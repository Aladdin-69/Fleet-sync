#!/bin/bash

# FleetSync - Fix npm install Issues
# This script resolves common npm installation problems

echo "🔧 FleetSync - Fixing npm installation issues"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    print_error "Not in a Node.js project directory (no package.json found)"
    echo "Please run this from backend/ or frontend/ directory"
    exit 1
fi

print_info "Cleaning npm cache and lock files..."

# Step 1: Remove lock file and node_modules
rm -rf node_modules package-lock.json

print_success "Cleaned old files"

# Step 2: Clear npm cache
print_info "Clearing npm cache..."
npm cache clean --force

print_success "Cache cleared"

# Step 3: Set npm registry (sometimes helps with timeouts)
print_info "Setting npm registry..."
npm config set registry https://registry.npmjs.org/

# Step 4: Increase timeout
print_info "Increasing npm timeout..."
npm config set fetch-timeout 60000
npm config set fetch-retry-maxtimeout 120000

print_success "npm configured"

# Step 5: Install with verbose logging
print_info "Installing dependencies (this may take a few minutes)..."
echo ""
print_warning "If it gets stuck again, press Ctrl+C and try Option 2 below"
echo ""

npm install --verbose

if [ $? -eq 0 ]; then
    echo ""
    print_success "Installation completed successfully!"
    echo ""
    echo "✅ You can now run:"
    echo "   npm run dev        (for development)"
    echo "   npm start          (for production)"
else
    echo ""
    print_error "Installation failed"
    echo ""
    echo "📋 Alternative solutions:"
    echo ""
    echo "Option 1: Try with legacy peer deps"
    echo "  npm install --legacy-peer-deps"
    echo ""
    echo "Option 2: Use yarn instead"
    echo "  npm install -g yarn"
    echo "  yarn install"
    echo ""
    echo "Option 3: Install without optional dependencies"
    echo "  npm install --no-optional"
    echo ""
    echo "Option 4: Use different network"
    echo "  - Try mobile hotspot"
    echo "  - Use VPN"
    echo "  - Check firewall settings"
    echo ""
    exit 1
fi
