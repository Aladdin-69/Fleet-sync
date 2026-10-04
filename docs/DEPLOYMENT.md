# FleetSync - Complete Deployment Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

FleetSync is a complete vehicle fleet and booking management system migrated from Base44 to a self-hosted solution.

**Technology Stack:**
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS
- **Authentication**: JWT
- **Payments**: Stripe
- **Calendar Integration**: Google Calendar API

---

## ✅ Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 15+ installed
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** (optional, recommended)
- **Stripe Account** (for payments)
- **Google Cloud Console Account** (for calendar integration)

---

## 🚀 Local Development Setup

### Option 1: Manual Setup

#### 1. Clone/Extract the Project
```bash
cd fleetsync-migration
```

#### 2. Setup Database
```bash
# Install PostgreSQL if not already installed
# On macOS: brew install postgresql
# On Ubuntu: sudo apt install postgresql

# Start PostgreSQL service
# On macOS: brew services start postgresql
# On Ubuntu: sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE fleetsync;"
```

#### 3. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor

# Run database migrations
npm run db:migrate

# Start backend server
npm run dev
```

The backend will be available at `http://localhost:3000`

#### 4. Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local .env.local

# Edit .env.local with your configuration
nano .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### Option 2: Docker Setup (Recommended)

#### 1. Configure Environment
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit with your configuration
nano backend/.env
```

#### 2. Start All Services
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npm run db:migrate
```

**Services:**
- Frontend: `http://localhost:80`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

#### 3. Stop Services
```bash
docker-compose down

# To remove volumes too
docker-compose down -v
```

---

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetsync
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Server
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Calendar
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend Environment Variables (.env.local)

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=FleetSync
VITE_APP_URL=http://localhost:5173
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Getting API Keys

#### Stripe
1. Go to https://dashboard.stripe.com
2. Get your API keys from Developers > API keys
3. Setup webhooks at Developers > Webhooks
4. Add endpoint: `https://your-domain.com/api/stripe/webhook`
5. Select events: `customer.subscription.*`, `invoice.*`

#### Google Calendar
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/calendar/callback`

---

## 🌐 Production Deployment

### Deploy to VPS (Ubuntu/Debian)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Database Setup
```bash
# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE fleetsync;
postgres=# CREATE USER fleetsync_user WITH PASSWORD 'secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE fleetsync TO fleetsync_user;
postgres=# \q
```

#### 3. Deploy Backend
```bash
# Create app directory
sudo mkdir -p /var/www/fleetsync
sudo chown $USER:$USER /var/www/fleetsync

# Upload files
cd /var/www/fleetsync
# Upload your backend folder here (scp, git, etc.)

cd backend
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Update with production values

# Run migrations
npm run db:migrate

# Start with PM2
pm2 start server.js --name fleetsync-api
pm2 save
pm2 startup
```

#### 4. Deploy Frontend
```bash
cd ../frontend
npm install
npm run build

# Move build to Nginx directory
sudo cp -r dist/* /var/www/html/
```

#### 5. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/fleetsync
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fleetsync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Deploy to Cloud (AWS, DigitalOcean, etc.)

#### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js fleetsync

# Create environment
eb create fleetsync-prod

# Deploy
eb deploy
```

#### Heroku
```bash
# Login
heroku login

# Create app
heroku create fleetsync-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Select "Backend" for /backend folder
3. Select "Static Site" for /frontend folder
4. Add PostgreSQL database
5. Configure environment variables
6. Deploy!

---

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Vehicles

#### List Vehicles
```http
GET /api/vehicles
Authorization: Bearer {token}
```

#### Create Vehicle
```http
POST /api/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tesla Model 3",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2023,
  "plate_number": "ABC-123",
  "platforms": ["turo", "getaround"]
}
```

### Bookings

#### List Bookings
```http
GET /api/bookings
Authorization: Bearer {token}
```

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicle_id": "uuid",
  "platform": "turo",
  "start_date": "2024-03-01T10:00:00Z",
  "end_date": "2024-03-05T10:00:00Z",
  "customer_name": "Jane Smith",
  "total_price": 450.00
}
```

#### Sync Booking
```http
POST /api/bookings/{id}/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "source_platform": "turo"
}
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d fleetsync -c "SELECT 1"

# Reset password
sudo -u postgres psql
\password postgres
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Frontend Can't Connect to Backend
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify CORS settings in backend
3. Check `.env.local` has correct API_URL
4. Clear browser cache

### Stripe Webhook Issues
1. Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

2. Verify webhook secret matches in `.env`

### Migration Failed
```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE fleetsync;
CREATE DATABASE fleetsync;
\q

# Run migrations again
npm run db:migrate
```

---

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs fleetsync-api`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

## 📄 License

This project is migrated from Base44 and is for personal/commercial use.

Remember to:
- ✅ Update all secret keys before production
- ✅ Setup SSL certificates
- ✅ Configure firewall rules
- ✅ Setup regular database backups
- ✅ Enable monitoring and logging
