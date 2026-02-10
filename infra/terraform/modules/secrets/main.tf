# Secrets Manager Module for Barber School
# Centralized secrets storage

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (prod, staging, dev)"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "cognito_client_secret" {
  description = "Cognito app client secret"
  type        = string
  sensitive   = true
  default     = ""
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "main" {
  name = "${local.name_prefix}-secrets"

  tags = {
    Name        = "${local.name_prefix}-secrets"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Secret Version with actual values
resource "aws_secretsmanager_secret_version" "main" {
  secret_id = aws_secretsmanager_secret.main.id

  secret_string = jsonencode({
    DATABASE_URL          = var.database_url
    COGNITO_CLIENT_SECRET = var.cognito_client_secret
  })
}

# Outputs
output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.main.arn
}

output "secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.main.name
}
