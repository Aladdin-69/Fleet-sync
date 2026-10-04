import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import calendarRoutes from './routes/calendar.js';
import bookingRoutes from './routes/booking.js';
import vehicleRoutes from './routes/vehicle.js';
import stripeRoutes from './routes/stripe.js';
import automationRoutes from './routes/automation.js';
import notificationRoutes from './routes/notification.js';
import integrationRoutes from './routes/integrations.js';
import functionRoutes from './routes/functions.js';
import entityRoutes from './routes/entities.js';
import userRoutes from './routes/user.js';
import appLogsRoutes from './routes/app-logs.js';
import googleAuthRoutes from './routes/google-auth.js';
import microsoftAuthRoutes from './routes/microsoft-auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration - Dynamic origin for testing
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.CORS_ORIGIN_1 || '',
  process.env.CORS_ORIGIN_2 || '',
  process.env.CORS_ORIGIN_3 || ''
].filter(origin => origin !== ''); // Remove empty strings

// For testing purposes, allow all origins but disable credentials
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }

    // For development/testing, allow all origins
    callback(null, true);
  },
  credentials: process.env.NODE_ENV === 'production', // Only enable credentials in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/app-logs', appLogsRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/auth', microsoftAuthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FleetSync Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
