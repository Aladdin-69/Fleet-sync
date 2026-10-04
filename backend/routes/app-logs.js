import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Log user activity in app
router.post('/log-user-in-app', authenticateToken, async (req, res) => {
  try {
    const { page_name } = req.body;
    
    if (!page_name) {
      return res.status(400).json({ error: 'Page name is required' });
    }

    // Insert log entry into database
    await query(
      `INSERT INTO app_logs (user_id, page_name, accessed_at, ip_address, user_agent)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [
        req.user.id,
        page_name,
        req.ip || null,
        req.get('User-Agent') || null
      ]
    );

    res.json({ success: true, message: 'User activity logged successfully' });
  } catch (error) {
    console.error('Error logging user activity:', error);
    res.status(500).json({ error: 'Failed to log user activity' });
  }
});

export default router;