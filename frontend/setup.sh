#!/bin/bash

# FleetSync Frontend - Quick Setup
# Configures frontend to connect to self-hosted backend

echo "🎨 FleetSync Frontend - Quick Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if in frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in frontend directory"
    echo "Please run this from the frontend/ directory"
    exit 1
fi

# Get backend URL from user
echo "Configure Backend URL"
echo "--------------------"
echo ""
echo "Where is your backend running?"
echo ""
echo "1) Local development (http://localhost:3000)"
echo "2) AWS EC2 (http://your-ec2-ip:3000)"
echo "3) Custom URL"
echo ""
read -p "Choose option (1-3): " CHOICE

case $CHOICE in
    1)
        BACKEND_URL="http://localhost:3000/api"
        FRONTEND_URL="http://localhost:5173"
        ;;
    2)
        read -p "Enter your EC2 public IP: " EC2_IP
        BACKEND_URL="http://$EC2_IP:3000/api"
        FRONTEND_URL="http://$EC2_IP"
        ;;
    3)
        read -p "Enter backend URL (e.g., https://api.example.com): " CUSTOM_URL
        BACKEND_URL="$CUSTOM_URL"
        read -p "Enter frontend URL (e.g., https://app.example.com): " CUSTOM_FRONTEND
        FRONTEND_URL="$CUSTOM_FRONTEND"
        ;;
    *)
        echo "Invalid option, using localhost"
        BACKEND_URL="http://localhost:3000/api"
        FRONTEND_URL="http://localhost:5173"
        ;;
esac

# Create .env.local file
print_info "Creating .env.local configuration..."

cat > .env.local << EOF
# Backend API URL
VITE_API_URL=$BACKEND_URL

# App Configuration
VITE_APP_NAME=FleetSync
VITE_APP_URL=$FRONTEND_URL

# Stripe Publishable Key (add your own)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EOF

print_success ".env.local created"

echo ""
echo "📝 Configuration:"
echo "  Backend API: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# Ask about npm install
read -p "Do you want to install dependencies now? (y/n): " INSTALL

if [ "$INSTALL" = "y" ] || [ "$INSTALL" = "Y" ]; then
    print_info "Installing dependencies..."
    echo ""
    print_warning "This may take a few minutes. If it gets stuck, press Ctrl+C"
    echo ""
    
    # Try install with timeout
    timeout 300 npm install || {
        echo ""
        print_warning "Installation timed out or failed"
        echo ""
        echo "Alternative options:"
        echo "1. Run: ../fix-npm.sh"
        echo "2. Try: npm install --legacy-peer-deps"
        echo "3. Try: yarn install"
        echo "4. Use Docker instead"
        exit 1
    }
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed"
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "To start development server:"
        echo "  npm run dev"
        echo ""
        echo "To build for production:"
        echo "  npm run build"
    fi
else
    echo ""
    echo "⏭️  Skipping npm install"
    echo ""
    echo "To install later, run:"
    echo "  npm install"
    echo ""
    echo "Or use the fix script if you have issues:"
    echo "  ../fix-npm.sh"
fi

echo ""
print_info "Next steps:"
echo "1. Make sure backend is running on: ${BACKEND_URL%/api}"
echo "2. Add your Stripe publishable key to .env.local"
echo "3. Run: npm run dev"
echo "4. Open: $FRONTEND_URL"
