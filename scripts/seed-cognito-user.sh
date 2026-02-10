#!/bin/bash
# Creates a test admin user in Cognito
# Usage: ./scripts/seed-cognito-user.sh
#
# Required environment variables (or set them below):
#   COGNITO_USER_POOL_ID - Your Cognito User Pool ID
#   AWS_REGION           - AWS region (default: us-east-1)
#
# The script creates:
#   Email:    admin@barberschool.com
#   Password: Admin123!
#   Role:     admin

set -e

REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID}"

EMAIL="admin@barberschool.com"
PASSWORD="Admin123!"
FIRST_NAME="Admin"
LAST_NAME="User"
ROLE="admin"

if [ -z "$POOL_ID" ]; then
  echo "Error: COGNITO_USER_POOL_ID is not set."
  echo "Usage: COGNITO_USER_POOL_ID=us-east-1_xxxxx ./scripts/seed-cognito-user.sh"
  exit 1
fi

echo "Creating test admin user in Cognito..."
echo "  Pool:     $POOL_ID"
echo "  Region:   $REGION"
echo "  Email:    $EMAIL"
echo "  Password: $PASSWORD"
echo ""

# Create the user (suppress delivery to avoid needing a real email)
aws cognito-idp admin-create-user \
  --user-pool-id "$POOL_ID" \
  --username "$EMAIL" \
  --user-attributes \
    Name=email,Value="$EMAIL" \
    Name=email_verified,Value=true \
    Name=given_name,Value="$FIRST_NAME" \
    Name=family_name,Value="$LAST_NAME" \
    Name=custom:role,Value="$ROLE" \
  --message-action SUPPRESS \
  --region "$REGION" \
  > /dev/null

echo "User created. Setting permanent password..."

# Set a permanent password (skips FORCE_CHANGE_PASSWORD state)
aws cognito-idp admin-set-user-password \
  --user-pool-id "$POOL_ID" \
  --username "$EMAIL" \
  --password "$PASSWORD" \
  --permanent \
  --region "$REGION"

echo ""
echo "Done! Test user ready:"
echo "  Email:    $EMAIL"
echo "  Password: $PASSWORD"
echo "  Role:     $ROLE"
