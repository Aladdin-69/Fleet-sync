# ✅ FleetSync Migration Checklist

Use this checklist to ensure a smooth migration from Base44 to your own server.

## 📋 Pre-Migration

- [ ] Export all data from Base44 (if needed)
- [ ] Document current features and functionality
- [ ] Note all third-party integrations
- [ ] Backup Base44 project files

## 🔧 Local Development Setup

- [ ] Install Node.js 18+
- [ ] Install PostgreSQL 15+
- [ ] Clone/extract migration files
- [ ] Copy `.env.example` to `.env` in backend
- [ ] Copy `.env.local` in frontend
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install frontend dependencies: `cd frontend && npm install`

## 🔑 API Keys & Credentials

- [ ] Create Stripe account
- [ ] Get Stripe API keys (test mode)
- [ ] Get Stripe API keys (production mode)
- [ ] Setup Stripe webhook endpoint
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 credentials
- [ ] Generate JWT secret (32+ characters)
- [ ] Configure email service (if using notifications)

## 💾 Database Setup

- [ ] Create PostgreSQL database
- [ ] Create database user
- [ ] Grant necessary privileges
- [ ] Update DB credentials in `.env`
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify tables created: `psql -U postgres -d fleetsync -c "\dt"`

## 🧪 Local Testing

- [ ] Start backend: `cd backend && npm run dev`
- [ ] Verify backend health: `curl http://localhost:3000/health`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Open http://localhost:5173
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating a vehicle
- [ ] Test creating a booking
- [ ] Test Stripe checkout (test mode)
- [ ] Test calendar connection
- [ ] Test booking sync
- [ ] Check all API endpoints work

## 🐳 Docker Setup (Optional)

- [ ] Install Docker and Docker Compose
- [ ] Review `docker-compose.yml`
- [ ] Build images: `docker-compose build`
- [ ] Start services: `docker-compose up -d`
- [ ] Run migrations in container
- [ ] Test all services
- [ ] Check logs: `docker-compose logs -f`

## 🌐 Production Preparation

- [ ] Choose hosting provider (VPS, AWS, Heroku, etc.)
- [ ] Register domain name
- [ ] Setup DNS records
- [ ] Generate production JWT secret
- [ ] Switch Stripe to production mode
- [ ] Update Google OAuth redirect URLs
- [ ] Update frontend `VITE_API_URL` to production URL
- [ ] Update backend `FRONTEND_URL` to production URL
- [ ] Review and update CORS settings

## 🚀 Production Deployment

### For VPS (Ubuntu/Debian)
- [ ] Create server instance
- [ ] SSH into server
- [ ] Update system packages
- [ ] Install Node.js 18
- [ ] Install PostgreSQL
- [ ] Install Nginx
- [ ] Install PM2 globally
- [ ] Create database and user
- [ ] Upload backend files
- [ ] Upload frontend build
- [ ] Configure `.env` with production values
- [ ] Run database migrations
- [ ] Start backend with PM2
- [ ] Configure Nginx
- [ ] Test Nginx configuration
- [ ] Restart Nginx
- [ ] Setup SSL with Let's Encrypt
- [ ] Configure firewall (ufw)
- [ ] Setup PM2 startup script

### For Docker Production
- [ ] Update `docker-compose.yml` for production
- [ ] Set production environment variables
- [ ] Build production images
- [ ] Deploy to server
- [ ] Start containers
- [ ] Run migrations
- [ ] Setup reverse proxy (Nginx/Traefik)
- [ ] Configure SSL

### For Cloud Platforms (Heroku, DigitalOcean, etc.)
- [ ] Create application
- [ ] Add PostgreSQL addon
- [ ] Configure environment variables
- [ ] Connect repository
- [ ] Deploy application
- [ ] Run migrations
- [ ] Configure custom domain
- [ ] Enable SSL

## 🔒 Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set security headers (Helmet)
- [ ] Disable directory listing
- [ ] Setup rate limiting
- [ ] Enable firewall
- [ ] Close unnecessary ports
- [ ] Keep dependencies updated
- [ ] Setup fail2ban (for VPS)

## 📊 Monitoring & Maintenance

- [ ] Setup error logging
- [ ] Configure application monitoring
- [ ] Setup database backups
- [ ] Schedule automatic backups
- [ ] Test backup restoration
- [ ] Setup uptime monitoring
- [ ] Configure alerts
- [ ] Document maintenance procedures

## 📝 Post-Deployment

- [ ] Test all features in production
- [ ] Verify Stripe payments work
- [ ] Test calendar integration
- [ ] Send test emails
- [ ] Check mobile responsiveness
- [ ] Verify all API endpoints
- [ ] Test user registration flow
- [ ] Test password reset (if implemented)
- [ ] Check error handling
- [ ] Load test (optional)
- [ ] Document known issues

## 🎓 User Training

- [ ] Create user documentation
- [ ] Document new features
- [ ] Note differences from Base44
- [ ] Prepare FAQ
- [ ] Train team members
- [ ] Update support materials

## ✨ Optimization (Optional)

- [ ] Setup Redis for caching
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Enable CDN for static assets
- [ ] Implement lazy loading
- [ ] Compress images
- [ ] Minify CSS/JS (done by Vite)
- [ ] Enable HTTP/2
- [ ] Setup monitoring dashboards

## 🎉 Launch

- [ ] Final testing of all features
- [ ] Verify all integrations working
- [ ] Check analytics setup
- [ ] Announce to users
- [ ] Monitor error logs closely
- [ ] Be ready for support requests
- [ ] Celebrate! 🎊

## 📞 Emergency Contacts

- Hosting Support: _______________
- Database Backup Location: _______________
- SSL Certificate Expiry: _______________
- Stripe Dashboard: https://dashboard.stripe.com
- Google Cloud Console: https://console.cloud.google.com

---

## Notes

Use this space for migration-specific notes:

```
[Your notes here]
```

---

**Last Updated:** _____________
**Completed By:** _____________
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed
