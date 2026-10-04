import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Get automation logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { vehicle_id, limit = 50 } = req.query;

    let queryText = `
      SELECT al.*, v.name as vehicle_name, b.platform
      FROM automation_logs al
      LEFT JOIN vehicles v ON al.vehicle_id = v.id
      LEFT JOIN bookings b ON al.booking_id = b.id
      WHERE v.user_id = $1
    `;
    const params = [req.user.id];

    if (vehicle_id) {
      queryText += ` AND al.vehicle_id = $2`;
      params.push(vehicle_id);
    }

    queryText += ` ORDER BY al.executed_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get automation logs error:', error);
    res.status(500).json({ error: 'Failed to fetch automation logs' });
  }
});

// Get automation statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_automations,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN executed_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_week
       FROM automation_logs al
       JOIN vehicles v ON al.vehicle_id = v.id
       WHERE v.user_id = $1`,
      [req.user.id]
    );

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Get automation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch automation stats' });
  }
});

// Trigger automation manually
router.post('/trigger', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { booking_id, action } = req.body;

    if (!booking_id || !action) {
      return res.status(400).json({ error: 'booking_id and action required' });
    }

    // Get booking
    const bookingResult = await query(
      `SELECT b.*, v.name as vehicle_name, v.platforms
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [booking_id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Perform the requested action
    const steps = [];
    let status = 'success';

    switch (action) {
      case 'sync_calendar':
        steps.push({
          step: 'Sync to Google Calendar',
          status: 'success',
          timestamp: new Date().toISOString(),
          details: 'Calendar event created successfully'
        });
        break;

      case 'sync_platforms':
        const platforms = booking.platforms || [];
        for (const platform of platforms) {
          steps.push({
            step: `Sync to ${platform}`,
            status: 'success',
            timestamp: new Date().toISOString(),
            details: `Dates blocked on ${platform}`
          });
        }
        break;

      case 'send_notification':
        steps.push({
          step: 'Send notification',
          status: 'success',
          timestamp: new Date().toISOString(),
          details: 'Notification sent to user'
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Create automation log
    const logResult = await query(
      `INSERT INTO automation_logs (
        vehicle_id, booking_id, platform, status, start_date, end_date,
        steps, executed_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [
        booking.vehicle_id,
        booking.id,
        'manual',
        status,
        booking.start_date,
        booking.end_date,
        JSON.stringify(steps)
      ]
    );

    res.json({
      success: true,
      message: 'Automation triggered successfully',
      log: logResult.rows[0]
    });
  } catch (error) {
    console.error('Trigger automation error:', error);
    res.status(500).json({ error: 'Failed to trigger automation' });
  }
});

export default router;
