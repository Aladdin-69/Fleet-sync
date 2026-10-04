import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  accountIdFor,
  createRecord,
  deleteRecord,
  listRecords,
  matchesFilter,
  sortDocuments,
  updateRecord,
} from '../services/store.js';

const router = express.Router();

const ENTITY_TYPES = {
  vehicle: 'vehicle',
  booking: 'booking',
  notification: 'notification',
  alert: 'alert',
  customer: 'customer',
  'alert-rule': 'alert_rule',
  'user-consent': 'user_consent',
  'paypal-connection': 'paypal_connection',
  'paypal-transaction': 'paypal_transaction',
  subscription: 'subscription',
  'sync-status': 'sync_status',
  'email-activity': 'email_activity',
  'automation-log': 'automation_log',
  'platform-sync': 'platform_sync',
  revenue: 'revenue',
  user: 'user',
};

function entityTypeFrom(param) {
  const type = ENTITY_TYPES[param];
  if (!type) {
    const error = new Error('Entité inconnue');
    error.status = 404;
    throw error;
  }
  return type;
}

function queryOptions(req) {
  let filter = {};
  if (req.query.filter) {
    filter = JSON.parse(req.query.filter);
  }
  return {
    sort: req.query.sort || '-created_date',
    limit: Number.parseInt(req.query.limit, 10) || 100,
    filter,
  };
}

async function context(req) {
  const accountId = await accountIdFor(req.user.id);
  const profile = await query('SELECT email, role, name FROM users WHERE id = $1', [req.user.id]);
  return { accountId, email: profile.rows[0]?.email, role: profile.rows[0]?.role, name: profile.rows[0]?.name };
}

function presentUsers(rows) {
  return rows.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    full_name: user.name,
    role: user.role || 'member',
    extended_role: user.role || 'member',
    created_date: user.created_at,
  }));
}

async function listUsers(accountId) {
  const result = await query(
    `SELECT id, email, name, role, created_at
     FROM users
     WHERE id = $1 OR owner_id = $1
     ORDER BY created_at DESC`,
    [accountId]
  );
  return presentUsers(result.rows);
}

router.use(authenticateToken);

router.get('/:entityType/filter', async (req, res, next) => {
  try {
    const type = entityTypeFrom(req.params.entityType);
    const { accountId } = await context(req);
    const { sort, limit, filter } = queryOptions(req);
    const rows = type === 'user' ? await listUsers(accountId) : await listRecords(accountId, type);
    const filtered = sortDocuments(rows.filter((item) => matchesFilter(item, filter)), sort).slice(0, limit);
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.get('/:entityType', async (req, res, next) => {
  try {
    const type = entityTypeFrom(req.params.entityType);
    const { accountId } = await context(req);
    const { sort, limit, filter } = queryOptions(req);
    const rows = type === 'user' ? await listUsers(accountId) : await listRecords(accountId, type);
    res.json(sortDocuments(rows.filter((item) => matchesFilter(item, filter)), sort).slice(0, limit));
  } catch (error) {
    next(error);
  }
});

router.post('/:entityType', async (req, res, next) => {
  try {
    const type = entityTypeFrom(req.params.entityType);
    if (type === 'user') return res.status(405).json({ error: 'Utilisez l’invitation pour ajouter un utilisateur' });
    const { accountId, email } = await context(req);
    const defaults = type === 'vehicle'
      ? { status: 'available', archived: false, platforms: [] }
      : {};
    const created = await createRecord(accountId, type, { ...defaults, ...req.body }, { email });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch('/:entityType/:id', async (req, res, next) => {
  try {
    const type = entityTypeFrom(req.params.entityType);
    const { accountId } = await context(req);

    if (type === 'user') {
      const { role, full_name, name, extended_role } = req.body;
      const nextName = full_name || name;
      const nextRole = role || extended_role;
      const result = await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             role = COALESCE($2, role),
             updated_at = NOW()
         WHERE id = $3 AND (id = $4 OR owner_id = $4)
         RETURNING id, email, name, role, created_at`,
        [nextName || null, nextRole || null, req.params.id, accountId]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
      return res.json(presentUsers(result.rows)[0]);
    }

    const updated = await updateRecord(accountId, type, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Élément introuvable' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:entityType/:id', async (req, res, next) => {
  try {
    const type = entityTypeFrom(req.params.entityType);
    const { accountId } = await context(req);

    if (type === 'user') {
      if (req.params.id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      const result = await query(
        'DELETE FROM users WHERE id = $1 AND owner_id = $2',
        [req.params.id, accountId]
      );
      if (!result.rowCount) return res.status(404).json({ error: 'Utilisateur introuvable' });
      return res.json({ success: true });
    }

    const removed = await deleteRecord(accountId, type, req.params.id);
    if (!removed) return res.status(404).json({ error: 'Élément introuvable' });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
