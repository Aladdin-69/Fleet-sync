import express from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, v.name as vehicle_name, v.plate_number 
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = $1
       ORDER BY b.start_date DESC`,
      [req.user.id]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, v.name as vehicle_name, v.plate_number 
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Create new booking
router.post('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const {
      vehicle_id,
      platform,
      start_date,
      end_date,
      customer_name,
      customer_email,
      total_price,
      status = 'confirmed'
    } = req.body;

    if (!vehicle_id || !platform || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify vehicle belongs to user
    const vehicleCheck = await query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
      [vehicle_id, req.user.id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Vehicle not found or access denied' });
    }

    const result = await query(
      `INSERT INTO bookings (
        user_id, vehicle_id, platform, start_date, end_date,
        customer_name, customer_email, total_price, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        req.user.id,
        vehicle_id,
        platform,
        start_date,
        end_date,
        customer_name,
        customer_email,
        total_price,
        status
      ]
    );

    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking
router.patch('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { status, start_date, end_date, customer_name, customer_email, total_price } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (start_date) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(start_date);
    }
    if (end_date) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(end_date);
    }
    if (customer_name) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(customer_name);
    }
    if (customer_email) {
      updates.push(`customer_email = $${paramCount++}`);
      values.push(customer_email);
    }
    if (total_price) {
      updates.push(`total_price = $${paramCount++}`);
      values.push(total_price);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);

    const result = await query(
      `UPDATE bookings 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Sync booking across platforms
router.post('/:id/sync', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { source_platform } = req.body;

    if (!source_platform) {
      return res.status(400).json({ error: 'source_platform required' });
    }

    // Get booking
    const bookingResult = await query(
      `SELECT b.*, v.platforms 
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const targetPlatforms = (booking.platforms || []).filter(p => p !== source_platform);

    if (targetPlatforms.length === 0) {
      return res.json({
        success: true,
        message: 'Vehicle not listed on other platforms',
        syncResults: {}
      });
    }

    // Create sync record
    const syncResult = await query(
      `INSERT INTO platform_syncs (
        booking_id, vehicle_id, source_platform, target_platforms,
        start_date, end_date, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        booking.id,
        booking.vehicle_id,
        source_platform,
        JSON.stringify(targetPlatforms),
        booking.start_date,
        booking.end_date,
        'syncing'
      ]
    );

    const syncRecord = syncResult.rows[0];
    const syncResults = {};

    // Simulate platform sync (in production, integrate with actual platform APIs)
    for (const platform of targetPlatforms) {
      syncResults[platform] = {
        status: 'success',
        message: `Dates blocked from ${new Date(booking.start_date).toLocaleDateString('fr-FR')} to ${new Date(booking.end_date).toLocaleDateString('fr-FR')}`
      };

      // Log automation
      await query(
        `INSERT INTO automation_logs (
          vehicle_id, booking_id, platform, status, start_date, end_date,
          steps, executed_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          booking.vehicle_id,
          booking.id,
          platform,
          'success',
          booking.start_date,
          booking.end_date,
          JSON.stringify([{
            step: 'Block dates on platform',
            status: 'success',
            timestamp: new Date().toISOString(),
            details: `Successfully blocked dates on ${platform}`
          }])
        ]
      );
    }

    // Update sync record
    const allSuccess = Object.values(syncResults).every(r => r.status === 'success');
    await query(
      `UPDATE platform_syncs 
       SET status = $1, sync_results = $2, updated_at = NOW()
       WHERE id = $3`,
      [allSuccess ? 'success' : 'partial_failure', JSON.stringify(syncResults), syncRecord.id]
    );

    res.json({
      success: allSuccess,
      syncRecord,
      syncResults
    });
  } catch (error) {
    console.error('Sync booking error:', error);
    res.status(500).json({ error: 'Failed to sync booking' });
  }
});

export default router;
