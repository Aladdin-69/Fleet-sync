import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Get all vehicles for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, 
        (SELECT COUNT(*) FROM bookings WHERE vehicle_id = v.id) as booking_count
       FROM vehicles v
       WHERE v.user_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );

    res.json({ vehicles: result.rows });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM bookings WHERE vehicle_id = v.id) as booking_count,
        (SELECT json_agg(json_build_object(
          'id', b.id,
          'start_date', b.start_date,
          'end_date', b.end_date,
          'platform', b.platform,
          'status', b.status
        )) FROM bookings b WHERE b.vehicle_id = v.id ORDER BY b.start_date DESC LIMIT 10) as recent_bookings
       FROM vehicles v
       WHERE v.id = $1 AND v.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Create new vehicle
router.post('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const {
      name,
      make,
      model,
      year,
      plate_number,
      platforms,
      vin,
      color,
      image_url
    } = req.body;

    if (!name || !plate_number) {
      return res.status(400).json({ error: 'Name and plate number are required' });
    }

    const result = await query(
      `INSERT INTO vehicles (
        user_id, name, make, model, year, plate_number, platforms,
        vin, color, image_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        req.user.id,
        name,
        make,
        model,
        year,
        plate_number,
        JSON.stringify(platforms || []),
        vin,
        color,
        image_url
      ]
    );

    res.status(201).json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.patch('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const {
      name,
      make,
      model,
      year,
      plate_number,
      platforms,
      vin,
      color,
      image_url
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (make) {
      updates.push(`make = $${paramCount++}`);
      values.push(make);
    }
    if (model) {
      updates.push(`model = $${paramCount++}`);
      values.push(model);
    }
    if (year) {
      updates.push(`year = $${paramCount++}`);
      values.push(year);
    }
    if (plate_number) {
      updates.push(`plate_number = $${paramCount++}`);
      values.push(plate_number);
    }
    if (platforms) {
      updates.push(`platforms = $${paramCount++}`);
      values.push(JSON.stringify(platforms));
    }
    if (vin) {
      updates.push(`vin = $${paramCount++}`);
      values.push(vin);
    }
    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (image_url) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);

    const result = await query(
      `UPDATE vehicles 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if vehicle has bookings
    const bookingCheck = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE vehicle_id = $1',
      [req.params.id]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete vehicle with existing bookings',
        booking_count: bookingCheck.rows[0].count
      });
    }

    const result = await query(
      'DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
