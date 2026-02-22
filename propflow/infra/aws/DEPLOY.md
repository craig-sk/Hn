# ════════════════════════════════════════════════════════════
# PropFlow – AWS Deployment Guide
# Stack: EC2 + Application Load Balancer + ECR + RDS (optional)
# ════════════════════════════════════════════════════════════

## RECOMMENDED AWS ARCHITECTURE
#
#   CloudFront CDN
#        │
#   Application Load Balancer (ALB)
#        │
#   EC2 Auto Scaling Group  ←── ECR (Docker images)
#        │
#   Supabase (managed Postgres + Auth)   ← External
#   S3 (property images)
#   ElastiCache Redis (sessions/cache)   ← Optional

## STEP 1: Build & Push Docker Image to ECR
# ──────────────────────────────────────────
# 1. Create ECR repository
aws ecr create-repository --repository-name propflow-backend --region af-south-1

# 2. Login to ECR
aws ecr get-login-password --region af-south-1 | docker login --username AWS \
  --password-stdin <account-id>.dkr.ecr.af-south-1.amazonaws.com

# 3. Build & tag
docker build -f infra/docker/backend.Dockerfile -t propflow-backend .
docker tag propflow-backend:latest <account-id>.dkr.ecr.af-south-1.amazonaws.com/propflow-backend:latest

# 4. Push
docker push <account-id>.dkr.ecr.af-south-1.amazonaws.com/propflow-backend:latest


## STEP 2: Build Frontend & Upload to S3
# ──────────────────────────────────────────
cd frontend
npm run build

# Create S3 bucket for static hosting (or serve via EC2)
aws s3 mb s3://propflow-frontend-prod --region af-south-1
aws s3 sync dist/ s3://propflow-frontend-prod --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" --exclude "*.json"
aws s3 cp dist/index.html s3://propflow-frontend-prod/index.html \
  --cache-control "no-cache, no-store, must-revalidate"


## STEP 3: EC2 User Data Script (paste into Launch Template)
# ──────────────────────────────────────────────────────────
cat << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y docker nginx certbot
systemctl start docker
systemctl enable docker

# Pull latest image
aws ecr get-login-password --region af-south-1 | docker login --username AWS \
  --password-stdin <account-id>.dkr.ecr.af-south-1.amazonaws.com

docker pull <account-id>.dkr.ecr.af-south-1.amazonaws.com/propflow-backend:latest

# Start container with env from SSM Parameter Store or Secrets Manager
docker run -d \
  --name propflow-api \
  --restart unless-stopped \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=$(aws ssm get-parameter --name /propflow/SUPABASE_URL --with-decryption --query Parameter.Value --output text) \
  -e SUPABASE_SERVICE_ROLE_KEY=$(aws ssm get-parameter --name /propflow/SUPABASE_SERVICE_KEY --with-decryption --query Parameter.Value --output text) \
  -e ANTHROPIC_API_KEY=$(aws ssm get-parameter --name /propflow/ANTHROPIC_KEY --with-decryption --query Parameter.Value --output text) \
  <account-id>.dkr.ecr.af-south-1.amazonaws.com/propflow-backend:latest
USERDATA


## STEP 4: AWS Parameter Store (store secrets securely)
# ──────────────────────────────────────────────────────
aws ssm put-parameter --name /propflow/SUPABASE_URL           --type SecureString --value "https://your.supabase.co"
aws ssm put-parameter --name /propflow/SUPABASE_SERVICE_KEY   --type SecureString --value "your-service-role-key"
aws ssm put-parameter --name /propflow/ANTHROPIC_KEY          --type SecureString --value "your-anthropic-key"
aws ssm put-parameter --name /propflow/JWT_SECRET             --type SecureString --value "your-jwt-secret"


## STEP 5: S3 for Property Images
# ──────────────────────────────────────────
aws s3 mb s3://propflow-property-images --region af-south-1

# Set CORS (allow uploads from frontend)
aws s3api put-bucket-cors --bucket propflow-property-images --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","PUT","POST"],
    "AllowedOrigins": ["https://propflow.co.za"],
    "MaxAgeSeconds": 3000
  }]
}'

# Block all public access except via signed URLs
aws s3api put-public-access-block --bucket propflow-property-images \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"


## STEP 6: CloudFront Distribution (CDN)
# ──────────────────────────────────────────
# Create a CloudFront distribution pointing to:
# - S3 bucket for frontend static files (default)
# - ALB for /api/* routes (add behaviour)
# This gives you global edge caching + HTTPS


## REQUIRED AWS IAM PERMISSIONS (EC2 Instance Role)
# ──────────────────────────────────────────────────
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     { "Effect": "Allow", "Action": ["ssm:GetParameter","ssm:GetParameters"], "Resource": "arn:aws:ssm:*:*:parameter/propflow/*" },
#     { "Effect": "Allow", "Action": ["ecr:GetAuthorizationToken","ecr:BatchGetImage","ecr:GetDownloadUrlForLayer"], "Resource": "*" },
#     { "Effect": "Allow", "Action": ["s3:PutObject","s3:GetObject","s3:DeleteObject"], "Resource": "arn:aws:s3:::propflow-property-images/*" },
#     { "Effect": "Allow", "Action": ["kms:Decrypt"], "Resource": "*" }
#   ]
# }


## AZURE ALTERNATIVE (App Service + Azure Container Registry)
# ──────────────────────────────────────────────────────────
# az group create --name propflow-rg --location southafricanorth
# az acr create --resource-group propflow-rg --name propflowacr --sku Basic
# az appservice plan create --name propflow-plan --resource-group propflow-rg --is-linux --sku B2
# az webapp create --resource-group propflow-rg --plan propflow-plan \
#   --name propflow-api --deployment-container-image-name propflowacr.azurecr.io/propflow-backend:latest
# az webapp config appsettings set --resource-group propflow-rg --name propflow-api \
#   --settings NODE_ENV=production SUPABASE_URL=@Microsoft.KeyVault(...)
