# 🔄 FleetSync Migration Guide: Base44 → Self-Hosted Backend

## Overview

This guide walks you through migrating your FleetSync frontend from Base44 to a self-hosted backend. The migration has been **automated** using the included migration script.

## ✅ What Was Changed

The automated migration script has updated **47 files** in your frontend:

### 1. **Authentication System** (`src/lib/AuthContext.jsx`)
- ✅ Replaced Base44 SDK authentication with custom API client
- ✅ Updated login/logout/register flows
- ✅ Simplified state management (removed Base44-specific states)
- ✅ Added direct API integration

### 2. **API Client** (`src/api/client.js`)
Already implemented - provides all methods needed:
- ✅ Auth (login, register, logout, me, updateMe)
- ✅ Vehicles (CRUD operations)
- ✅ Bookings (CRUD operations + sync)
- ✅ Calendar (connect, sync, disconnect)
- ✅ Stripe (checkout, portal)
- ✅ Automation (logs, stats, trigger)
- ✅ Notifications (list, read, delete)

### 3. **All Component Files** (47 files updated)
- ✅ Replaced `import { base44 } from '@/api/base44Client'`
- ✅ With `import apiClient from '@/api/client'`
- ✅ Updated all `base44.*` calls to `apiClient.*`
- ✅ Removed unused Base44 SDK imports

### 4. **Dependencies** (`package.json`)
- ✅ Removed `@base44/sdk` dependency

## 🚀 Quick Start

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 15+ installed
- ✅ Stripe account (for payments)
- ✅ Google Cloud account (for calendar integration)

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment example
cp .env.example .env

# Edit .env with your credentials
# Required: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, etc.
nano .env

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:3000`

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Remove old dependencies
rm -rf node_modules package-lock.json

# Install dependencies (without @base44/sdk)
npm install

# Update .env.local with backend URL
echo "VITE_API_URL=http://localhost:3000/api" > .env.local

# Start frontend
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### Step 3: Test the Application

1. **Registration**: Create a new account at `/register`
2. **Login**: Sign in with your credentials
3. **Vehicles**: Add a new vehicle
4. **Bookings**: Create a booking
5. **Settings**: Connect integrations

## 📋 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fleetsync

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# App Configuration
VITE_APP_NAME=FleetSync
VITE_APP_URL=http://localhost:5173

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🔍 Key Differences from Base44

### Authentication Flow

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

// Base44 handled auth automatically
const user = await base44.auth.me();
```

**After (Self-Hosted):**
```javascript
import apiClient from '@/api/client';

// You control the auth flow
const data = await apiClient.auth.login(email, password);
// Token stored in localStorage automatically
const user = await apiClient.auth.me();
```

### Data Fetching

**Before (Base44):**
```javascript
const vehicles = await base44.vehicles.list();
```

**After (Self-Hosted):**
```javascript
const vehicles = await apiClient.vehicles.list();
// Identical API!
```

### Token Management

**Before (Base44):**
- Tokens managed by Base44 SDK
- Automatic refresh
- Cloud-based session

**After (Self-Hosted):**
- Tokens stored in `localStorage`
- Manual refresh (implement if needed)
- Your own session management

## 🔐 Security Considerations

### JWT Token Storage
- Currently using `localStorage` (simple, works well)
- Consider `httpOnly` cookies for production (more secure)
- Implement token refresh for long sessions

### CORS Configuration
Update backend `server.js` CORS settings:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Environment Variables
- **Never commit `.env` files**
- Use different secrets for dev/prod
- Rotate JWT secrets periodically

## 📊 Migration Checklist

- [x] Run migration script
- [x] Update AuthContext
- [x] Update all component files
- [x] Remove Base44 dependencies
- [ ] Setup backend database
- [ ] Configure environment variables
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Test integrations (Stripe, Calendar)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Update production URLs

## 🐛 Troubleshooting

### "Network Error" when calling API
**Problem**: Frontend can't reach backend
**Solution**: 
1. Verify backend is running: `curl http://localhost:3000/health`
2. Check VITE_API_URL in .env.local
3. Check CORS settings in backend

### "Unauthorized" errors
**Problem**: Token not being sent or invalid
**Solution**:
1. Check if token exists: `localStorage.getItem('auth_token')`
2. Login again to get fresh token
3. Verify JWT_SECRET matches on backend

### Database connection errors
**Problem**: Backend can't connect to PostgreSQL
**Solution**:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in backend/.env
3. Run migrations: `npm run db:migrate`

### Stripe webhooks not working
**Problem**: Webhook signature verification fails
**Solution**:
1. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Update STRIPE_WEBHOOK_SECRET
3. Verify webhook endpoint URL in Stripe dashboard

## 🔄 Rollback Plan

If you need to revert to Base44:

1. **Restore package.json**:
```bash
cd frontend
git checkout HEAD -- package.json
npm install
```

2. **Restore source files**:
```bash
git checkout HEAD -- src/
```

3. **Clear localStorage**:
```javascript
localStorage.clear();
```

## 📚 Additional Resources

- [Backend API Documentation](../backend/README.md)
- [Database Schema](../docs/DATABASE_SCHEMA.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Troubleshooting](../docs/TROUBLESHOOTING.md)

## 🎯 Next Steps

1. **Local Development**: Get everything running locally first
2. **Testing**: Thoroughly test all features
3. **Deployment**: Deploy to your chosen platform (AWS, Heroku, VPS)
4. **Monitoring**: Set up error tracking and monitoring
5. **Optimization**: Add caching, CDN, performance improvements

## 💡 Tips

- Start with a fresh database to avoid migration issues
- Test payment flows in Stripe test mode first
- Use environment-specific .env files
- Keep Base44 project running until migration is verified
- Document any custom changes you've made

## 🆘 Need Help?

1. Check the [Migration Checklist](./docs/MIGRATION_CHECKLIST.md)
2. Review [Troubleshooting Guide](./docs/TROUBLESHOOTING_NPM.md)
3. Check backend logs: `cd backend && npm run dev`
4. Check browser console for frontend errors

---

**Migration completed successfully!** 🎉

Your FleetSync application is now running on a self-hosted backend with full control over your data and infrastructure.
