import express from 'express';
import { google } from 'googleapis';
import { query } from '../config/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Google Calendar OAuth2 client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL}/api/calendar/callback`
  );
};

// Initialize Google Calendar authorization
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.body;

    if (!['google', 'outlook'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (provider === 'google') {
      const oauth2Client = getOAuth2Client();
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        state: req.user.id.toString()
      });

      res.json({ authUrl });
    } else {
      // Outlook implementation would go here
      res.status(501).json({ error: 'Outlook calendar not yet implemented' });
    }
  } catch (error) {
    console.error('Calendar connect error:', error);
    res.status(500).json({ error: 'Failed to initialize calendar connection' });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=calendar_auth_failed`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens securely
    await query(
      `UPDATE users SET 
        calendar_provider = 'google',
        calendar_access_token = $1,
        calendar_refresh_token = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [tokens.access_token, tokens.refresh_token, userId]
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?calendar=connected`);
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=calendar_auth_failed`);
  }
});

// Sync bookings to Google Calendar
router.post('/sync/:bookingId', authenticateToken, requireSubscription, async (req, res) => {
  try {
    // Get booking
    const bookingResult = await query(
      `SELECT b.*, v.name as vehicle_name 
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.bookingId, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Get user's calendar tokens
    const userResult = await query(
      'SELECT calendar_access_token, calendar_refresh_token FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0].calendar_access_token) {
      return res.status(400).json({ error: 'Calendar not connected' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: userResult.rows[0].calendar_access_token,
      refresh_token: userResult.rows[0].calendar_refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create calendar event
    const event = {
      summary: `${booking.vehicle_name} - ${booking.platform}`,
      description: `Booking from ${booking.platform}\nCustomer: ${booking.customer_name || 'N/A'}`,
      start: {
        dateTime: new Date(booking.start_date).toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: new Date(booking.end_date).toISOString(),
        timeZone: 'Europe/Paris',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    // Save calendar event ID
    await query(
      'UPDATE bookings SET calendar_event_id = $1 WHERE id = $2',
      [response.data.id, booking.id]
    );

    res.json({
      success: true,
      message: 'Booking synced to calendar',
      eventId: response.data.id
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync to calendar' });
  }
});

// Disconnect calendar
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    await query(
      `UPDATE users SET 
        calendar_provider = NULL,
        calendar_access_token = NULL,
        calendar_refresh_token = NULL,
        updated_at = NOW()
       WHERE id = $1`,
      [req.user.id]
    );

    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

export default router;
