import { query } from '../config/database.js';

export function toDocument(row) {
  return {
    id: row.id,
    ...(row.data || {}),
    created_date: row.data?.created_date || row.created_at,
    updated_date: row.data?.updated_date || row.updated_at,
  };
}

export function matchesFilter(item, filter = {}) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === 'object' && Array.isArray(value.$in)) {
      return value.$in.includes(item[key]);
    }
    return item[key] === value;
  });
}

export function sortDocuments(items, sort = '-created_date') {
  const descending = String(sort).startsWith('-');
  const field = descending ? String(sort).slice(1) : String(sort || 'created_date');
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return descending ? 1 : -1;
    if (av > bv) return descending ? -1 : 1;
    return 0;
  });
}

export async function accountIdFor(userId) {
  const result = await query('SELECT id, owner_id FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  return row?.owner_id || row?.id || userId;
}

export async function listRecords(accountId, entityType) {
  const result = await query(
    `SELECT id, data, created_at, updated_at
     FROM records
     WHERE user_id = $1 AND entity_type = $2`,
    [accountId, entityType]
  );
  return result.rows.map(toDocument);
}

export async function createRecord(accountId, entityType, data, { email } = {}) {
  const payload = { ...(data || {}) };
  delete payload.id;
  if (!payload.created_date) payload.created_date = new Date().toISOString();
  if (email && payload.created_by == null) payload.created_by = email;

  const result = await query(
    `INSERT INTO records (user_id, entity_type, data)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id, data, created_at, updated_at`,
    [accountId, entityType, JSON.stringify(payload)]
  );
  return toDocument(result.rows[0]);
}

export async function updateRecord(accountId, entityType, id, updates) {
  const payload = { ...(updates || {}) };
  delete payload.id;
  payload.updated_date = new Date().toISOString();

  const result = await query(
    `UPDATE records
     SET data = data || $1::jsonb, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND entity_type = $4
     RETURNING id, data, created_at, updated_at`,
    [JSON.stringify(payload), id, accountId, entityType]
  );
  return result.rows[0] ? toDocument(result.rows[0]) : null;
}

export async function deleteRecord(accountId, entityType, id) {
  const result = await query(
    `DELETE FROM records
     WHERE id = $1 AND user_id = $2 AND entity_type = $3`,
    [id, accountId, entityType]
  );
  return result.rowCount > 0;
}
