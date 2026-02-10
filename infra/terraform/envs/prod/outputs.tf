# Outputs for Production Environment

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.alb.alb_dns_name}"
}

# DNS Outputs (conditional)
output "route53_name_servers" {
  description = "Route 53 name servers (set these at your domain registrar)"
  value       = var.domain_name != "" ? module.dns[0].zone_name_servers : []
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = var.domain_name != "" ? module.dns[0].certificate_arn : ""
}

output "ses_domain_identity_arn" {
  description = "SES domain identity ARN"
  value       = var.domain_name != "" ? module.dns[0].ses_domain_identity_arn : ""
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = module.cognito.client_id
}

output "cognito_issuer_url" {
  description = "Cognito Issuer URL for JWT validation"
  value       = module.cognito.issuer_url
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

# SNS Outputs
output "sns_topic_arn" {
  description = "SNS topic ARN for SMS"
  value       = module.sns.topic_arn
}

# GitHub Actions Outputs
output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN"
  value       = module.github_oidc.role_arn
}

# Secrets Manager
output "secrets_arn" {
  description = "Secrets Manager secret ARN"
  value       = module.secrets.secret_arn
}

# CloudWatch Logs
output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = module.ecs.log_group_name
}
