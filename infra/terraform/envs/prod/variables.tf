# Variables for Production Environment

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "barber-school"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# RDS Variables
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# ECS Variables
variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "ecs_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

# ALB Variables
variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

# Cognito Variables
variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login"]
}

# S3 Variables
variable "s3_bucket_name" {
  description = "S3 bucket name (optional, auto-generated if empty)"
  type        = string
  default     = ""
}

# SNS Variables
variable "sns_monthly_spend_limit" {
  description = "Monthly SMS spend limit in USD"
  type        = number
  default     = 10
}

# Domain & SES Variables
variable "domain_name" {
  description = "Domain name for Route 53 and SES (leave empty to skip DNS setup)"
  type        = string
  default     = ""
}

variable "ses_from_email" {
  description = "SES verified sender email address"
  type        = string
  default     = ""
}

# GitHub Variables
variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "barber-school"
}
