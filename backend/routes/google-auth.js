import express from 'express';
import { google } from 'googleapis';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || process.env.SERVER_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Google OAuth not configured',
      message: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
    });
  }

  // Google OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${backendUrl}/auth/google/callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Forces consent screen to ensure we get refresh token
  });

  res.json({ authUrl });
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || process.env.SERVER_URL || 'http://localhost:3000';

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Google OAuth not configured',
      message: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
    });
  }

  try {
    // Create a new OAuth2 client for this request
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${backendUrl}/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const plus = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await plus.userinfo.get();

    if (!data.email) {
      return res.status(400).json({ error: 'Unable to retrieve email from Google' });
    }

    // Check if user exists
    let userResult = await query(
      'SELECT id, email, name, subscription_status FROM users WHERE email = $1',
      [data.email]
    );

    let user;
    if (userResult.rows.length > 0) {
      // User exists, update with latest Google info
      user = userResult.rows[0];
      await query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             updated_at = NOW()
         WHERE id = $2`,
        [data.name || null, user.id]
      );
    } else {
      // Create new user
      userResult = await query(
        `INSERT INTO users (email, name, subscription_status, created_at)
         VALUES ($1, $2, 'inactive', NOW())
         RETURNING id, email, name, subscription_status`,
        [data.email, data.name || '']
      );
      user = userResult.rows[0];
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

export default router;