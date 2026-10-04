# 🚀 AWS Automated Deployment Guide

## Overview

This guide allows you to deploy **FleetSync** on AWS with **a single command**!

The complete infrastructure will be created automatically:
- ✅ VPC with public subnets
- ✅ EC2 for backend (Node.js)
- ✅ RDS PostgreSQL for database
- ✅ S3 for frontend
- ✅ CloudFront CDN
- ✅ Configured Security Groups
- ✅ IAM Roles

---

## 💰 Estimated Cost

### Free Tier (First 12 months)
\`\`\`
EC2 t3.micro          : FREE
RDS db.t3.micro       : FREE
S3 + CloudFront       : ~$2/month
──────────────────────────────
TOTAL : ~$2/month
\`\`\`

### After Free Tier
\`\`\`
EC2 t3.micro          : ~$8/month
RDS db.t3.micro       : ~$13/month
S3 + CloudFront       : ~$2/month
──────────────────────────────
TOTAL : ~$23/month
\`\`\`

---

## 📋 Prerequisites

### 1. AWS Account
- Create account: https://aws.amazon.com/
- Credit card required (for verification)

### 2. AWS CLI Installed

**macOS:**
\`\`\`bash
brew install awscli
\`\`\`

**Linux:**
\`\`\`bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
\`\`\`

**Windows:**
Download from: https://aws.amazon.com/cli/

### 3. Configure AWS CLI
\`\`\`bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (ex: us-east-1)
# - Default output format (json)
\`\`\`

### 4. Create SSH Key Pair
\`\`\`bash
aws ec2 create-key-pair --key-name fleetsync-key \\
  --query 'KeyMaterial' --output text > fleetsync-key.pem

# Set permissions
chmod 400 fleetsync-key.pem
\`\`\`

### 5. Install jq (for scripts)
\`\`\`bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
\`\`\`

---

## 🚀 Step 1: Deploy Infrastructure

\`\`\`bash
cd aws
./deploy.sh
\`\`\`

**The script will:**
1. Ask for environment name (dev/staging/prod)
2. Ask for AWS region
3. Ask for database password
4. Create CloudFormation stack
5. Wait for completion (~10-15 min)
6. Generate helper scripts
7. Display connection info

**Output files created:**
- \`deployment-info.txt\` - All your credentials
- \`deploy-backend.sh\` - Script to upload backend
- \`deploy-frontend.sh\` - Script to upload frontend

---

## 🚀 Step 2: Deploy Backend

\`\`\`bash
./deploy-backend.sh
\`\`\`

**This script:**
1. Packages backend code
2. Uploads to EC2
3. Installs dependencies
4. Runs database migrations
5. Starts with PM2

---

## 🚀 Step 3: Deploy Frontend

\`\`\`bash
./deploy-frontend.sh
\`\`\`

**This script:**
1. Builds React app
2. Uploads to S3
3. Invalidates CloudFront cache

---

## ✅ Step 4: Verify Deployment

### Check Backend
\`\`\`bash
curl http://YOUR_EC2_IP:3000/health
# Should return: {"status":"ok"}
\`\`\`

### Check Frontend
Open in browser:
\`\`\`
https://YOUR_CLOUDFRONT_DOMAIN
\`\`\`

### SSH to EC2
\`\`\`bash
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP
\`\`\`

---

## 🔧 Configuration

### Backend Environment Variables

SSH into EC2 and edit:
\`\`\`bash
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP
cd fleetsync-backend
nano .env
\`\`\`

**Required variables:**
\`\`\`env
DATABASE_URL=postgresql://fleetsync:PASSWORD@RDS_ENDPOINT:5432/fleetsync
JWT_SECRET=your-generated-secret
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://YOUR_CLOUDFRONT_DOMAIN
PORT=3000
\`\`\`

After editing:
\`\`\`bash
pm2 restart fleetsync
\`\`\`

### Frontend Environment Variables

Edit \`frontend/.env.production\` before deploying:
\`\`\`env
VITE_API_URL=http://YOUR_EC2_IP:3000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
\`\`\`

---

## 📊 Monitoring

### CloudWatch Metrics
- Access: AWS Console → CloudWatch
- Metrics available:
  - EC2: CPU, Network, Disk
  - RDS: Connections, CPU, Storage
  - CloudFront: Requests, Data transfer

### PM2 Monitoring
\`\`\`bash
# SSH to EC2
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP

# View status
pm2 status

# View logs
pm2 logs fleetsync

# View metrics
pm2 monit
\`\`\`

### Database Monitoring
\`\`\`bash
# Connect to database
psql -h YOUR_RDS_ENDPOINT -U fleetsync -d fleetsync

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('fleetsync'));
\`\`\`

---

## 💾 Backups

### Automatic RDS Backups
- Enabled by default
- Retention: 7 days
- Access: AWS Console → RDS → Automated backups

### Manual Database Backup
\`\`\`bash
# From your local machine
pg_dump -h YOUR_RDS_ENDPOINT -U fleetsync fleetsync > backup-$(date +%Y%m%d).sql

# Restore
psql -h YOUR_RDS_ENDPOINT -U fleetsync fleetsync < backup-YYYYMMDD.sql
\`\`\`

### EC2 AMI Backup
\`\`\`bash
aws ec2 create-image \\
  --instance-id i-xxxxx \\
  --name "fleetsync-backup-$(date +%Y%m%d)" \\
  --description "FleetSync EC2 backup"
\`\`\`

---

## 🔄 Updates

### Update Backend Code
\`\`\`bash
./deploy-backend.sh
# This will:
# 1. Upload new code
# 2. Install new dependencies
# 3. Restart PM2
\`\`\`

### Update Frontend
\`\`\`bash
./deploy-frontend.sh
# This will:
# 1. Build new version
# 2. Upload to S3
# 3. Invalidate cache
\`\`\`

### Update Infrastructure
\`\`\`bash
# Modify cloudformation-template.yaml
# Then:
aws cloudformation update-stack \\
  --stack-name fleetsync-stack-prod \\
  --template-body file://cloudformation-template.yaml
\`\`\`

---

## 🛡️ Security

### SSL/HTTPS Setup

**For Frontend (CloudFront):**
SSL is automatic with CloudFront default domain.

**For Custom Domain:**
1. Register domain
2. Create certificate in AWS Certificate Manager
3. Add custom domain to CloudFront
4. Update DNS records

**For Backend (EC2):**
\`\`\`bash
# Install certbot
sudo yum install -y certbot

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Configure nginx or use certificate in Node.js
\`\`\`

### Security Groups Review
\`\`\`bash
# View security groups
aws ec2 describe-security-groups

# Ensure:
# - EC2: Only port 22 (SSH) and 3000 (API) open
# - RDS: Only accessible from EC2 security group
# - No 0.0.0.0/0 access to RDS
\`\`\`

### Secrets Management
\`\`\`bash
# Use AWS Secrets Manager (recommended)
aws secretsmanager create-secret \\
  --name fleetsync/production \\
  --secret-string '{"db_password":"xxx","jwt_secret":"xxx"}'

# Or use AWS Systems Manager Parameter Store
aws ssm put-parameter \\
  --name /fleetsync/db-password \\
  --value "xxx" \\
  --type SecureString
\`\`\`

---

## 🔍 Troubleshooting

### Backend Not Responding

**Check if running:**
\`\`\`bash
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP
pm2 status
\`\`\`

**Check logs:**
\`\`\`bash
pm2 logs fleetsync --lines 100
\`\`\`

**Restart:**
\`\`\`bash
pm2 restart fleetsync
\`\`\`

### Database Connection Issues

**Test connection:**
\`\`\`bash
psql -h YOUR_RDS_ENDPOINT -U fleetsync -d fleetsync
\`\`\`

**Check security group:**
- EC2 security group must be allowed in RDS security group
- RDS endpoint must be correct in backend .env

### Frontend Not Loading

**Check CloudFront:**
\`\`\`bash
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
\`\`\`

**Check S3:**
\`\`\`bash
aws s3 ls s3://YOUR_BUCKET_NAME/
\`\`\`

**Invalidate cache:**
\`\`\`bash
aws cloudfront create-invalidation \\
  --distribution-id YOUR_DISTRIBUTION_ID \\
  --paths "/*"
\`\`\`

### High Costs

**Check usage:**
\`\`\`bash
aws ce get-cost-and-usage \\
  --time-period Start=2026-01-01,End=2026-02-01 \\
  --granularity MONTHLY \\
  --metrics BlendedCost
\`\`\`

**Common cost issues:**
- Forgot to stop unused instances
- High data transfer (optimize CloudFront cache)
- Unused elastic IPs
- Snapshots accumulating

---

## 📈 Scaling

### Vertical Scaling (Bigger instances)

Edit \`cloudformation-template.yaml\`:
\`\`\`yaml
InstanceType: t3.small  # instead of t3.micro
DBInstanceClass: db.t3.small
\`\`\`

Then update stack:
\`\`\`bash
aws cloudformation update-stack \\
  --stack-name fleetsync-stack-prod \\
  --template-body file://cloudformation-template.yaml
\`\`\`

### Horizontal Scaling (More instances)

Add:
- Application Load Balancer
- Auto Scaling Group
- Multi-AZ RDS

This requires modifying CloudFormation template.

---

## 🗑️ Cleanup

### Delete Everything
\`\`\`bash
aws cloudformation delete-stack --stack-name fleetsync-stack-prod
\`\`\`

**This will delete:**
- EC2 instance
- RDS database
- S3 bucket
- CloudFront distribution
- VPC and networking
- All associated resources

**Note:** S3 buckets must be empty before deletion:
\`\`\`bash
aws s3 rm s3://YOUR_BUCKET_NAME --recursive
\`\`\`

---

## 📚 Additional Resources

- **AWS Free Tier:** https://aws.amazon.com/free/
- **EC2 Pricing:** https://aws.amazon.com/ec2/pricing/
- **RDS Pricing:** https://aws.amazon.com/rds/postgresql/pricing/
- **CloudFront Pricing:** https://aws.amazon.com/cloudfront/pricing/
- **AWS Documentation:** https://docs.aws.amazon.com/
- **CloudFormation Reference:** https://docs.aws.amazon.com/cloudformation/

---

## 🎓 Best Practices

1. **Use separate environments** (dev, staging, prod)
2. **Enable MFA** on AWS account
3. **Use IAM roles** instead of access keys when possible
4. **Regular backups** (automate with cron or AWS Backup)
5. **Monitor costs** with AWS Budgets
6. **Use CloudWatch alarms** for critical metrics
7. **Keep secrets in AWS Secrets Manager**
8. **Regular security updates** on EC2
9. **Use HTTPS** everywhere in production
10. **Test disaster recovery** procedures

---

## 📞 Support

- **AWS Support:** https://console.aws.amazon.com/support/
- **FleetSync Issues:** Check backend logs with \`pm2 logs\`
- **Database Issues:** Check RDS logs in CloudWatch
- **Network Issues:** Check Security Groups and NACLs

---

**Ready to deploy?**
\`\`\`bash
cd aws && ./deploy.sh
\`\`\`

🚀 **Happy Deploying!**
