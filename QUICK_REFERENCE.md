# ⚡ Quick Migration Reference

## 🎯 What Happened?

✅ **Automated migration completed successfully!**
- 47 files updated
- Base44 SDK removed
- Self-hosted backend integrated

## 📝 Quick Commands

### Start Backend
```bash
cd backend
npm install
npm run db:migrate
npm run dev
# Running on http://localhost:3000
```

### Start Frontend
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
# Running on http://localhost:5173
```

## 🔑 Key Changes

### Import Statements
```javascript
// OLD ❌
import { base44 } from '@/api/base44Client';

// NEW ✅
import apiClient from '@/api/client';
```

### API Calls
```javascript
// OLD ❌
const vehicles = await base44.vehicles.list();

// NEW ✅
const vehicles = await apiClient.vehicles.list();
```

### Authentication
```javascript
// OLD ❌
base44.auth.logout(window.location.href);

// NEW ✅
await apiClient.auth.logout();
window.location.href = '/login';
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `frontend/src/api/client.js` | Main API client (replaces Base44 SDK) |
| `frontend/src/lib/AuthContext.jsx` | Updated auth context |
| `frontend/.env.local` | Frontend environment variables |
| `backend/.env` | Backend environment variables |
| `backend/server.js` | Backend entry point |

## 🔧 Environment Setup

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fleetsync
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
PORT=3000
```

## 🧪 Testing Checklist

- [ ] Backend health check: `curl http://localhost:3000/health`
- [ ] Frontend loads: http://localhost:5173
- [ ] User registration works
- [ ] User login works
- [ ] Create vehicle
- [ ] Create booking
- [ ] All pages accessible

## 🐛 Common Issues

### "Network Error"
✅ Check backend is running
✅ Verify VITE_API_URL in .env.local

### "Unauthorized"
✅ Clear localStorage
✅ Login again
✅ Check JWT_SECRET matches

### Database error
✅ Run: `npm run db:migrate`
✅ Check DATABASE_URL

## 📚 Documentation

- [Full Migration Guide](./MIGRATION_GUIDE.md)
- [Before/After Comparison](./BEFORE_AFTER_COMPARISON.md)
- [Migration Checklist](./docs/MIGRATION_CHECKLIST.md)
- [Setup Guide](./SETUP_GUIDE.md)

## 🆘 Rollback

If needed:
```bash
cd frontend
git checkout HEAD -- package.json src/
npm install
```

## 📊 API Reference

All methods available on `apiClient`:

### Auth
- `apiClient.auth.login(email, password)`
- `apiClient.auth.register(email, password, name)`
- `apiClient.auth.logout()`
- `apiClient.auth.me()`
- `apiClient.auth.updateMe(updates)`

### Vehicles
- `apiClient.vehicles.list()`
- `apiClient.vehicles.get(id)`
- `apiClient.vehicles.create(data)`
- `apiClient.vehicles.update(id, updates)`
- `apiClient.vehicles.delete(id)`

### Bookings
- `apiClient.bookings.list()`
- `apiClient.bookings.get(id)`
- `apiClient.bookings.create(data)`
- `apiClient.bookings.update(id, updates)`
- `apiClient.bookings.delete(id)`
- `apiClient.bookings.sync(id, sourcePlatform)`

### Calendar
- `apiClient.calendar.connect(provider)`
- `apiClient.calendar.sync(bookingId)`
- `apiClient.calendar.disconnect()`

### Stripe
- `apiClient.stripe.createCheckout(priceId, trialDays)`
- `apiClient.stripe.createPortal()`

### Automation
- `apiClient.automation.logs(params)`
- `apiClient.automation.stats()`
- `apiClient.automation.trigger(bookingId, action)`

### Notifications
- `apiClient.notifications.list(params)`
- `apiClient.notifications.markAsRead(id)`
- `apiClient.notifications.markAllAsRead()`
- `apiClient.notifications.delete(id)`
- `apiClient.notifications.getUnreadCount()`

## 💡 Pro Tips

1. **Development**: Use localhost URLs
2. **Production**: Update environment variables with production URLs
3. **Security**: Never commit .env files
4. **Testing**: Test in incognito to avoid localStorage conflicts
5. **Debugging**: Check browser console and network tab

## 🚀 Next Steps

1. ✅ Run backend and frontend locally
2. ✅ Test all core features
3. 🔄 Deploy backend to your server
4. 🔄 Deploy frontend to hosting
5. 🔄 Update production environment variables
6. 🎉 Go live!

---

**Need help?** Check the full [Migration Guide](./MIGRATION_GUIDE.md)
