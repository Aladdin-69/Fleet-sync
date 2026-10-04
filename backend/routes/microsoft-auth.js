import express from 'express';
import axios from 'axios';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Microsoft OAuth configuration
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0';

// Initiate Microsoft OAuth
router.get('/microsoft', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL || process.env.SERVER_URL || 'http://localhost:3000'}/auth/microsoft/callback`;
  const scopes = 'openid profile email';

  if (!clientId) {
    return res.status(500).json({ error: 'Microsoft OAuth not configured' });
  }

  const authUrl = `${MICROSOFT_AUTH_URL}/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_mode=query`;

  res.json({ authUrl });
});

// Microsoft OAuth callback
router.get('/microsoft/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = `${process.env.BACKEND_URL || process.env.SERVER_URL || 'http://localhost:3000'}/auth/microsoft/callback`;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided for Microsoft OAuth' });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Microsoft OAuth not configured',
      message: 'Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET environment variables'
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(`${MICROSOFT_AUTH_URL}/token`, null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Microsoft Graph API
    const userResponse = await axios.get(`${MICROSOFT_GRAPH_URL}/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userInfo = userResponse.data;

    // Also get user's email if it's not in the main user object
    let userEmail = userInfo.mail || userInfo.userPrincipalName;

    if (!userEmail) {
      const profileResponse = await axios.get(`${MICROSOFT_GRAPH_URL}/me/profile`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      userEmail = profileResponse.data.emailAddresses?.[0]?.address || userInfo.id + '@outlook.com';
    }

    // Check if user exists
    let userResult = await query(
      'SELECT id, email, name, subscription_status FROM users WHERE email = $1',
      [userEmail]
    );

    let user;
    if (userResult.rows.length > 0) {
      // User exists, update with latest Microsoft info
      user = userResult.rows[0];
      await query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             updated_at = NOW()
         WHERE id = $2`,
        [userInfo.displayName || userInfo.givenName || userInfo.surname || null, user.id]
      );
    } else {
      // Create new user
      userResult = await query(
        `INSERT INTO users (email, name, subscription_status, created_at)
         VALUES ($1, $2, 'inactive', NOW())
         RETURNING id, email, name, subscription_status`,
        [userEmail, userInfo.displayName || userInfo.givenName || userInfo.surname || 'Microsoft User']
      );
      user = userResult.rows[0];
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error('Microsoft OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

export default router;