#!/bin/bash

# FleetSync AWS Automated Deployment Script
# This script deploys the complete FleetSync infrastructure to AWS

set -e

echo "🚀 FleetSync AWS Deployment Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="fleetsync-stack"
TEMPLATE_FILE="cloudformation-template.yaml"
REGION="us-east-1"

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first:"
        echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Get user inputs
get_inputs() {
    print_info "Configuration setup..."
    echo ""
    
    # Environment
    read -p "Environment (dev/staging/prod) [prod]: " ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-prod}
    
    # Region
    read -p "AWS Region [us-east-1]: " REGION
    REGION=${REGION:-us-east-1}
    
    # Database password
    while true; do
        read -sp "Database Password (min 8 characters): " DB_PASSWORD
        echo ""
        if [ ${#DB_PASSWORD} -ge 8 ]; then
            break
        else
            print_error "Password must be at least 8 characters"
        fi
    done
    
    # Key Pair
    echo ""
    print_info "Available EC2 Key Pairs in $REGION:"
    aws ec2 describe-key-pairs --region $REGION --query 'KeyPairs[*].KeyName' --output table 2>/dev/null || {
        print_warning "No key pairs found or unable to list"
    }
    
    read -p "EC2 Key Pair Name (for SSH access): " KEY_PAIR
    if [ -z "$KEY_PAIR" ]; then
        print_error "Key pair name is required"
        exit 1
    fi
    
    # Instance types
    read -p "EC2 Instance Type [t3.micro]: " EC2_TYPE
    EC2_TYPE=${EC2_TYPE:-t3.micro}
    
    read -p "RDS Instance Type [db.t3.micro]: " RDS_TYPE
    RDS_TYPE=${RDS_TYPE:-db.t3.micro}
    
    echo ""
    print_success "Configuration complete"
}

# Deploy CloudFormation stack
deploy_stack() {
    print_info "Deploying CloudFormation stack..."
    echo ""
    
    aws cloudformation create-stack \
        --stack-name $STACK_NAME-$ENVIRONMENT \
        --template-body file://$TEMPLATE_FILE \
        --parameters \
            ParameterKey=EnvironmentName,ParameterValue=$ENVIRONMENT \
            ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
            ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR \
            ParameterKey=InstanceType,ParameterValue=$EC2_TYPE \
            ParameterKey=DBInstanceClass,ParameterValue=$RDS_TYPE \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $REGION
    
    print_success "Stack creation initiated"
    print_info "Stack Name: $STACK_NAME-$ENVIRONMENT"
    print_info "Region: $REGION"
    echo ""
    print_info "Waiting for stack creation to complete (this may take 10-15 minutes)..."
    
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME-$ENVIRONMENT \
        --region $REGION
    
    print_success "Stack created successfully!"
}

# Get stack outputs
get_outputs() {
    print_info "Retrieving stack information..."
    echo ""
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME-$ENVIRONMENT \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    EC2_IP=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EC2PublicIP") | .OutputValue')
    DB_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DatabaseEndpoint") | .OutputValue')
    FRONTEND_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
    CLOUDFRONT_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="CloudFrontURL") | .OutputValue')
    SSH_COMMAND=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="SSHCommand") | .OutputValue')
    
    # Save to file
    cat > deployment-info.txt << EOF
FleetSync AWS Deployment Information
====================================

Environment: $ENVIRONMENT
Region: $REGION
Stack Name: $STACK_NAME-$ENVIRONMENT

EC2 Backend:
  Public IP: $EC2_IP
  API URL: http://$EC2_IP:3000
  SSH: $SSH_COMMAND

Database (RDS):
  Endpoint: $DB_ENDPOINT
  Port: 5432
  Database: fleetsync
  Username: postgres
  Password: [saved securely]

Frontend:
  S3 Bucket: $FRONTEND_BUCKET
  CloudFront URL: $CLOUDFRONT_URL

Next Steps:
1. SSH into EC2: $SSH_COMMAND
2. Upload your code to /home/ec2-user/fleetsync
3. Run: /home/ec2-user/deploy.sh
4. Build and deploy frontend to S3
5. Access your app at: $CLOUDFRONT_URL

Cost Estimate:
  EC2 ($EC2_TYPE): ~\$8-15/month
  RDS ($RDS_TYPE): ~\$13-16/month
  S3 + CloudFront: ~\$2/month
  Total: ~\$23-33/month
  
Note: First 12 months eligible for AWS Free Tier!
EOF
    
    print_success "Deployment information saved to deployment-info.txt"
}

# Display summary
display_summary() {
    echo ""
    echo "=================================================="
    print_success "🎉 Deployment Complete!"
    echo "=================================================="
    echo ""
    echo "📋 Deployment Details:"
    echo ""
    echo "🖥️  EC2 Backend:"
    echo "   IP: $EC2_IP"
    echo "   API: http://$EC2_IP:3000"
    echo ""
    echo "🗄️  Database:"
    echo "   Endpoint: $DB_ENDPOINT"
    echo "   Database: fleetsync"
    echo ""
    echo "🌐 Frontend:"
    echo "   URL: $CLOUDFRONT_URL"
    echo "   Bucket: $FRONTEND_BUCKET"
    echo ""
    echo "=================================================="
    echo ""
    print_info "Next Steps:"
    echo ""
    echo "1. Connect to your EC2 instance:"
    echo "   $SSH_COMMAND"
    echo ""
    echo "2. Upload your backend code:"
    echo "   scp -i $KEY_PAIR.pem -r backend/* ec2-user@$EC2_IP:/home/ec2-user/fleetsync/backend/"
    echo ""
    echo "3. Run the deployment script:"
    echo "   ssh -i $KEY_PAIR.pem ec2-user@$EC2_IP '/home/ec2-user/deploy.sh'"
    echo ""
    echo "4. Build and deploy frontend:"
    echo "   cd frontend"
    echo "   npm run build"
    echo "   aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --region $REGION"
    echo ""
    echo "5. Access your application:"
    echo "   $CLOUDFRONT_URL"
    echo ""
    print_warning "Important: Save deployment-info.txt in a secure location!"
    echo ""
}

# Create helper scripts
create_helper_scripts() {
    print_info "Creating helper scripts..."
    
    # Deploy backend script
    cat > deploy-backend.sh << 'EOF'
#!/bin/bash
# Load deployment info
source deployment-info.txt 2>/dev/null || {
    echo "Error: deployment-info.txt not found"
    exit 1
}

echo "📦 Deploying backend to EC2..."

# Upload backend
scp -i $KEY_PAIR.pem -r ../backend/* ec2-user@$EC2_IP:/home/ec2-user/fleetsync/backend/

# Run deployment
ssh -i $KEY_PAIR.pem ec2-user@$EC2_IP '/home/ec2-user/deploy.sh'

echo "✅ Backend deployed successfully!"
echo "🌐 API URL: http://$EC2_IP:3000"
EOF

    # Deploy frontend script
    cat > deploy-frontend.sh << 'EOF'
#!/bin/bash
# Load deployment info
source deployment-info.txt 2>/dev/null || {
    echo "Error: deployment-info.txt not found"
    exit 1
}

echo "🎨 Building and deploying frontend..."

cd ../frontend

# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete --region $REGION

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$FRONTEND_BUCKET.s3.amazonaws.com']].Id" --output text --region $REGION)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $REGION
    echo "✅ CloudFront cache invalidated"
fi

echo "✅ Frontend deployed successfully!"
echo "🌐 URL: $CLOUDFRONT_URL"
EOF

    chmod +x deploy-backend.sh deploy-frontend.sh
    print_success "Helper scripts created (deploy-backend.sh, deploy-frontend.sh)"
}

# Main execution
main() {
    cd "$(dirname "$0")"
    
    check_prerequisites
    get_inputs
    deploy_stack
    get_outputs
    create_helper_scripts
    display_summary
}

# Run main function
main
