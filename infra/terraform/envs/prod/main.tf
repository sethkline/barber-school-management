# Production Environment for Barber School
# Main Terraform configuration that orchestrates all modules

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state storage
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "barber-school-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "barber-school-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# ECR Module
module "ecr" {
  source = "../../modules/ecr"

  project_name          = var.project_name
  environment           = var.environment
  image_retention_count = 10
}

# DNS Module (conditional on domain_name being set)
# Created before ALB so the certificate is available for HTTPS
module "dns" {
  source = "../../modules/dns"
  count  = var.domain_name != "" ? 1 : 0

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

# ALB Module
module "alb" {
  source = "../../modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.domain_name != "" ? module.dns[0].certificate_arn : var.certificate_arn
  health_check_path = "/api/health"
  container_port    = 3000
}

# Route 53 alias records pointing domain to ALB (conditional)
resource "aws_route53_record" "root" {
  count = var.domain_name != "" ? 1 : 0

  zone_id = module.dns[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  count = var.domain_name != "" ? 1 : 0

  zone_id = module.dns[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

# Cognito Module
module "cognito" {
  source = "../../modules/cognito"

  project_name  = var.project_name
  environment   = var.environment
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls
}

# S3 Module (for documents) - no dependencies
module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment
  bucket_name  = var.s3_bucket_name
}

# SNS Module (for SMS) - no dependencies
module "sns" {
  source = "../../modules/sns"

  project_name        = var.project_name
  environment         = var.environment
  monthly_spend_limit = var.sns_monthly_spend_limit
}

# Secrets Manager Module
module "secrets" {
  source = "../../modules/secrets"

  project_name          = var.project_name
  environment           = var.environment
  database_url          = module.rds.connection_string
  cognito_client_secret = module.cognito.client_secret
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.task_security_group_id]
  db_name                    = "barber_school"
  db_username                = "postgres"
  instance_class             = var.rds_instance_class
  allocated_storage          = var.rds_allocated_storage
  backup_retention_period    = 7
}

# ECS Module - depends on S3 and SNS for IAM policies
module "ecs" {
  source = "../../modules/ecs"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_target_group_arn  = module.alb.target_group_arn
  alb_security_group_id = module.alb.security_group_id
  ecr_repository_url    = module.ecr.repository_url
  image_tag             = var.image_tag
  cpu                   = var.ecs_cpu
  memory                = var.ecs_memory
  desired_count         = var.ecs_desired_count
  container_port        = 3000
  secrets_arn             = module.secrets.secret_arn
  s3_bucket_arn           = module.s3.bucket_arn
  sns_topic_arn           = module.sns.topic_arn
  ses_domain_identity_arn = var.domain_name != "" ? module.dns[0].ses_domain_identity_arn : ""

  environment_variables = {
    NODE_ENV                  = "production"
    NUXT_AWS_REGION           = var.aws_region
    NUXT_AWS_S3_BUCKET        = module.s3.bucket_name
    NUXT_COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    NUXT_COGNITO_CLIENT_ID    = module.cognito.client_id
    NUXT_COGNITO_ISSUER_URL   = module.cognito.issuer_url
    NUXT_SNS_TOPIC_ARN        = module.sns.topic_arn
    NUXT_SES_FROM_EMAIL       = var.ses_from_email
    NUXT_APP_URL              = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.alb.alb_dns_name}"
  }

  depends_on = [module.alb, module.secrets, module.s3, module.sns]
}

# GitHub OIDC Module (for CI/CD)
module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name            = var.project_name
  environment             = var.environment
  github_org              = var.github_org
  github_repo             = var.github_repo
  ecr_repository_arn      = module.ecr.repository_arn
  ecs_cluster_arn         = module.ecs.cluster_arn
  ecs_service_arn         = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${module.ecs.cluster_name}/${module.ecs.service_name}"
  ecs_task_definition_arn = module.ecs.task_definition_arn

  depends_on = [module.ecr, module.ecs]
}
