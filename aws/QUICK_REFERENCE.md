# ⚡ AWS Quick Reference

## Essential Commands

### Deploy Infrastructure
\`\`\`bash
cd aws
./deploy.sh
\`\`\`

### Upload Backend
\`\`\`bash
./deploy-backend.sh
\`\`\`

### Upload Frontend
\`\`\`bash
./deploy-frontend.sh
\`\`\`

---

## SSH Access

\`\`\`bash
# Connect to EC2
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP

# View backend logs
pm2 logs fleetsync

# Restart backend
pm2 restart fleetsync

# Check backend status
pm2 status
\`\`\`

---

## Database Access

\`\`\`bash
# Connect to PostgreSQL
psql -h YOUR_RDS_ENDPOINT -U fleetsync -d fleetsync

# View tables
\\dt

# Backup database
pg_dump -h YOUR_RDS_ENDPOINT -U fleetsync fleetsync > backup.sql
\`\`\`

---

## CloudFormation

\`\`\`bash
# Check stack status
aws cloudformation describe-stacks --stack-name fleetsync-stack-prod

# Update stack
aws cloudformation update-stack --stack-name fleetsync-stack-prod \\
  --template-body file://cloudformation-template.yaml

# Delete stack
aws cloudformation delete-stack --stack-name fleetsync-stack-prod
\`\`\`

---

## CloudWatch Logs

\`\`\`bash
# View EC2 logs
aws logs tail /aws/ec2/fleetsync --follow

# View RDS logs
aws rds describe-db-log-files --db-instance-identifier fleetsync-db-prod
\`\`\`

---

## S3 & CloudFront

\`\`\`bash
# List S3 buckets
aws s3 ls

# Sync frontend
aws s3 sync ../frontend/dist/ s3://YOUR_BUCKET_NAME

# Invalidate CloudFront cache
aws cloudfront create-invalidation \\
  --distribution-id YOUR_DISTRIBUTION_ID \\
  --paths "/*"
\`\`\`

---

## EC2 Management

\`\`\`bash
# List instances
aws ec2 describe-instances

# Stop instance
aws ec2 stop-instances --instance-ids i-xxxxx

# Start instance
aws ec2 start-instances --instance-ids i-xxxxx

# Reboot instance
aws ec2 reboot-instances --instance-ids i-xxxxx
\`\`\`

---

## RDS Management

\`\`\`bash
# List databases
aws rds describe-db-instances

# Create snapshot
aws rds create-db-snapshot \\
  --db-instance-identifier fleetsync-db-prod \\
  --db-snapshot-identifier fleetsync-snapshot-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier fleetsync-db-restored \\
  --db-snapshot-identifier fleetsync-snapshot-YYYYMMDD
\`\`\`

---

## Monitoring

\`\`\`bash
# CPU utilization
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --dimensions Name=InstanceId,Value=i-xxxxx \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average
\`\`\`

---

## Troubleshooting

### Backend not responding
\`\`\`bash
# Check if running
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP "pm2 status"

# Restart
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP "pm2 restart fleetsync"

# View logs
ssh -i fleetsync-key.pem ec2-user@YOUR_EC2_IP "pm2 logs fleetsync --lines 50"
\`\`\`

### Database connection issues
\`\`\`bash
# Test connection
psql -h YOUR_RDS_ENDPOINT -U fleetsync -d fleetsync -c "SELECT version();"

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx
\`\`\`

### Frontend not loading
\`\`\`bash
# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check S3 bucket
aws s3 ls s3://YOUR_BUCKET_NAME/

# Invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
\`\`\`

---

## Cost Management

\`\`\`bash
# View current month costs
aws ce get-cost-and-usage \\
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \\
  --granularity MONTHLY \\
  --metrics BlendedCost
\`\`\`

---

## Emergency Contacts

- **AWS Support:** https://console.aws.amazon.com/support/
- **Deployment Info:** \`deployment-info.txt\` (created after deploy.sh)
- **CloudFormation:** https://console.aws.amazon.com/cloudformation/
- **EC2 Console:** https://console.aws.amazon.com/ec2/
- **RDS Console:** https://console.aws.amazon.com/rds/
- **S3 Console:** https://console.aws.amazon.com/s3/

---

## Quick Health Check

\`\`\`bash
# Full system check
./deploy.sh --health-check

# Or manual:
# 1. Check EC2
aws ec2 describe-instance-status --instance-ids i-xxxxx

# 2. Check RDS
aws rds describe-db-instances --db-instance-identifier fleetsync-db-prod

# 3. Check Backend
curl http://YOUR_EC2_IP:3000/health

# 4. Check Frontend
curl -I https://YOUR_CLOUDFRONT_DOMAIN
\`\`\`

---

**For complete guide:** See AWS_DEPLOYMENT_GUIDE.md  
**For overview:** See AWS_SUMMARY.md
