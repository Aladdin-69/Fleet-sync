# ⚡ Quick Start Guide - FleetSync Migration

## If npm install Gets Stuck

**Don't worry! This is common. Here are your options:**

### Option 1: Use the Fix Script (Recommended)

```bash
cd backend  # or cd frontend
chmod +x ../fix-npm.sh
../fix-npm.sh
```

This script will:
- Clean npm cache
- Remove old files
- Increase timeouts
- Retry installation with verbose logging

---

### Option 2: Manual Quick Fix

```bash
# Stop the stuck process
Ctrl + C

# Clean everything
rm -rf node_modules package-lock.json
npm cache clean --force

# Try again with increased timeout
npm config set fetch-timeout 60000
npm install --legacy-peer-deps
```

---

### Option 3: Use Docker (Skip npm entirely)

```bash
cd ..  # Go to project root
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

**Done!** Backend runs on http://localhost:3000, Frontend on http://localhost:80

---

## Complete Setup Instructions

### Backend Setup

**If npm install works:**

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Run database migrations
npm run db:migrate

# 4. Start server
npm run dev
```

**If npm install is stuck:**

```bash
cd backend

# Option A: Use fix script
../fix-npm.sh

# Option B: Use minimal dependencies
mv package.json package-full.json
mv package-minimal.json package.json
npm install
mv package-full.json package.json

# Option C: Use Docker
cd ..
docker-compose up -d backend
```

✅ **Backend running:** http://localhost:3000

---

### Frontend Setup

**Method 1: Automated Setup**

```bash
cd frontend
chmod +x setup.sh
./setup.sh
```

This will:
- Ask for your backend URL
- Create .env.local configuration
- Optionally run npm install
- Give you next steps

**Method 2: Manual Setup**

```bash
cd frontend

# 1. Create configuration
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=FleetSync
VITE_APP_URL=http://localhost:5173
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EOF

# 2. Install dependencies
npm install

# If stuck, use fix script:
# ../fix-npm.sh

# 3. Start development server
npm run dev
```

✅ **Frontend running:** http://localhost:5173

---

## Connecting Frontend to Your Backend

The frontend needs to know where your backend is running.

### Configuration File: `.env.local`

```bash
# For local development
VITE_API_URL=http://localhost:3000/api

# For AWS EC2
VITE_API_URL=http://YOUR_EC2_IP:3000/api

# For production with domain
VITE_API_URL=https://api.yourdomain.com
```

### Update Steps:

```bash
cd frontend

# Edit .env.local
nano .env.local

# Change VITE_API_URL to your backend URL
# Save and exit (Ctrl+X, then Y, then Enter)

# Restart development server
npm run dev
```

---

## Verify Everything Works

### Test Backend

```bash
# Check health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend

```bash
# Open in browser
http://localhost:5173

# You should see the FleetSync login page
```

### Test Connection

```bash
# In browser console (F12 → Console tab)
fetch('http://localhost:3000/api/auth/me')
  .then(r => r.json())
  .then(console.log)

# Should return error if not logged in (this is correct)
```

---

## Common Issues & Solutions

### Issue 1: npm install stuck at fetchMetadata

**Solution:**
```bash
# Increase timeout
npm config set fetch-timeout 60000
npm config set fetch-retry-maxtimeout 120000
npm install
```

### Issue 2: EACCES permission errors

**Solution:**
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
npm install
```

### Issue 3: Cannot connect to backend

**Solution:**
```bash
# Make sure backend is running
curl http://localhost:3000/health

# Check CORS settings in backend/.env
FRONTEND_URL=http://localhost:5173

# Restart backend
cd backend
npm run dev
```

### Issue 4: Frontend shows "Network Error"

**Solution:**
```bash
# Check .env.local in frontend
cd frontend
cat .env.local

# VITE_API_URL should match your backend URL
# Restart frontend after changes
npm run dev
```

---

## Production Deployment

### Backend to EC2

```bash
# 1. SSH to EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. Upload code
exit
scp -i your-key.pem -r backend/* ec2-user@YOUR_EC2_IP:~/fleetsync/backend/

# 4. SSH back and start
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
cd fleetsync/backend
npm install --production
npm run db:migrate
npm start
```

### Frontend to S3/CloudFront

```bash
cd frontend

# Update .env.local with production backend URL
echo "VITE_API_URL=http://YOUR_EC2_IP:3000/api" > .env.local

# Build
npm run build

# Deploy to S3 (if using AWS)
aws s3 sync dist/ s3://your-bucket-name/
```

---

## Using Docker (Easiest)

### Start Everything

```bash
# From project root
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate

# View logs
docker-compose logs -f
```

### Stop Everything

```bash
docker-compose down
```

### Rebuild After Changes

```bash
docker-compose down
docker-compose up -d --build
```

---

## Minimal Test Setup

If you just want to test quickly without full installation:

```bash
# Backend only (minimal)
cd backend
node --version  # Check Node.js installed
npm init -y
npm install express pg dotenv
node server.js  # Will show which deps are missing

# Or use Docker
docker run -d -p 3000:3000 -v $(pwd):/app -w /app node:18 npm start
```

---

## Alternative Package Managers

### Using Yarn

```bash
# Install yarn
npm install -g yarn

# Use yarn instead of npm
yarn install
yarn dev
```

### Using pnpm

```bash
# Install pnpm
npm install -g pnpm

# Use pnpm instead of npm
pnpm install
pnpm dev
```

---

## Getting Help

### Check Logs

**Backend:**
```bash
# Development mode shows logs in console
npm run dev

# Production with PM2
pm2 logs fleetsync-api
```

**Frontend:**
```bash
# Console shows logs
npm run dev

# Browser console (F12)
# Check for errors in Console tab
```

### Verbose Installation

```bash
npm install --verbose
# Shows exactly where it's stuck
```

### Create Debug Report

```bash
node --version
npm --version
uname -a
npm config list
cat package.json
```

Send this info when asking for help.

---

## Summary

| Task | Command |
|------|---------|
| **Fix stuck npm install** | `../fix-npm.sh` |
| **Setup backend** | `cd backend && npm install && npm run db:migrate && npm run dev` |
| **Setup frontend** | `cd frontend && ./setup.sh` |
| **Use Docker** | `docker-compose up -d` |
| **Test backend** | `curl http://localhost:3000/health` |
| **Test frontend** | Open http://localhost:5173 |
| **View logs** | `docker-compose logs -f` or `npm run dev` |

---

## Next Steps After Setup

1. ✅ Backend running on http://localhost:3000
2. ✅ Frontend running on http://localhost:5173
3. ✅ Database migrated

**Now:**
- Read `aws/AWS_SUMMARY.md` for AWS deployment
- Read `docs/DEPLOYMENT.md` for other deployment options
- Read `docs/MIGRATION_CHECKLIST.md` for production checklist

---

**Need more help?** Check `docs/TROUBLESHOOTING_NPM.md` for detailed solutions.
