import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { provisionAccount, temporaryPassword } from '../services/fleet.js';
import { accountIdFor } from '../services/store.js';

const router = express.Router();

router.post('/invite', authenticateToken, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = req.body?.role === 'admin' ? 'admin' : 'user';
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email requis' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Cet email a déjà un compte' });

    const accountId = await accountIdFor(req.user.id);
    const password = temporaryPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = email.split('@')[0];

    const created = await query(
      `INSERT INTO users (email, password, name, role, owner_id, subscription_status, trial_end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, 'trialing', NOW() + INTERVAL '14 days', NOW())
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, role, accountId]
    );

    await provisionAccount({ ...created.rows[0], owner_id: accountId });

    res.status(201).json({
      success: true,
      email,
      role,
      temporary_password: password,
      email_sent: false,
      message: 'Compte créé. Transmettez le mot de passe temporaire : aucun email sortant n’est configuré.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
