# 🚀 FleetSync - Quick Start Guide (5 Minutes)

## Option 1: Docker (Easiest) 🐳

```bash
# 1. Extract the ZIP file
unzip fleetsync-migration.zip
cd fleetsync-migration

# 2. Setup environment
cp backend/.env.example backend/.env
nano backend/.env  # Add your database password

# 3. Start everything!
docker-compose up -d

# 4. Setup database
docker-compose exec backend npm run db:migrate

# 5. Open in browser
# 👉 http://localhost:80
```

**That's it!** ✅

---

## Option 2: Manual Setup (More Control) 💻

### Backend

```bash
cd fleetsync-migration/backend

# Install
npm install

# Configure
cp .env.example .env
nano .env  # Edit your settings

# Setup database (PostgreSQL must be running)
npm run db:migrate

# Start server
npm run dev
```

✅ **Backend running at:** http://localhost:3000

### Frontend

```bash
cd fleetsync-migration/frontend

# Install
npm install

# Start
npm run dev
```

✅ **Frontend running at:** http://localhost:5173

---

## 🔑 What You Need

### Minimum (to get started locally):
- PostgreSQL password
- JWT secret (random string)

### For Full Features:
- **Stripe Keys** → https://dashboard.stripe.com/apikeys
- **Google OAuth** → https://console.cloud.google.com

---

## 🎯 First Steps After Setup

1. **Open the app** → http://localhost:5173 (or :80 if using Docker)
2. **Register** a new account
3. **Add a vehicle** to your fleet
4. **Create a booking** for testing
5. **Explore** the dashboard!

---

## ⚡ Quick Commands

```bash
# View logs (Docker)
docker-compose logs -f

# Stop everything (Docker)
docker-compose down

# Restart backend (Manual)
cd backend && npm run dev

# Build for production
cd frontend && npm run build
```

---

## 🆘 Common Issues

### "Database connection failed"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### "Can't connect to backend"
- Check backend is running: `curl http://localhost:3000/health`
- Verify `VITE_API_URL` in frontend/.env.local

---

## 📚 Need More Help?

Check these files:
- `README.md` - Project overview
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `docs/MIGRATION_CHECKLIST.md` - Step-by-step checklist

---

## 🎉 You're All Set!

Your FleetSync application is now running locally. 

**Next steps:**
1. Explore the features
2. Get your API keys (Stripe, Google)
3. Deploy to production when ready

Happy fleet managing! 🚗💨
