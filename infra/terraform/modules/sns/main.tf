# SNS Module for Barber School
# SMS topic for bulk messaging

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (prod, staging, dev)"
  type        = string
}

variable "monthly_spend_limit" {
  description = "Monthly SMS spend limit in USD"
  type        = number
  default     = 10
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# SNS Topic for SMS
resource "aws_sns_topic" "sms" {
  name = "${local.name_prefix}-sms"

  tags = {
    Name        = "${local.name_prefix}-sms"
    Environment = var.environment
    Project     = var.project_name
  }
}

# SNS SMS preferences (account-level)
# Note: AWS has a default SMS spending limit of $1 for new accounts.
# To increase this, contact AWS Support.
resource "aws_sns_sms_preferences" "main" {
  monthly_spend_limit                   = 1  # Default AWS limit, increase via AWS Support
  default_sms_type                      = "Transactional"
  usage_report_s3_bucket                = ""
  delivery_status_iam_role_arn          = ""
  delivery_status_success_sampling_rate = "0"
}

# Outputs
output "topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.sms.arn
}

output "topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.sms.name
}
