import { query } from '../config/database.js';
import { accountIdFor, createRecord, listRecords } from './store.js';
import { processInbox } from './fleet.js';

const PLATFORM_SENDERS = ['turo.fr', 'turo.com', 'getaround.com', 'getaround.fr', 'hunos'];

function mailboxConfig() {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const password = process.env.IMAP_PASSWORD;
  if (!host || !user || !password) return null;
  return {
    host,
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: { user, pass: password },
  };
}

function isBookingSender(from = '') {
  const value = from.toLowerCase();
  return PLATFORM_SENDERS.some((domain) => value.includes(domain));
}

export async function readBookingMailbox(userId) {
  const config = mailboxConfig();
  if (!config) {
    const error = new Error('Boîte mail non configurée. Renseignez IMAP_HOST, IMAP_USER et IMAP_PASSWORD sur le serveur.');
    error.status = 400;
    throw error;
  }

  const { ImapFlow } = await import('imapflow');
  const { simpleParser } = await import('mailparser');
  const client = new ImapFlow(config);
  await client.connect();

  const accountId = await accountIdFor(userId);
  const profile = await query('SELECT email FROM users WHERE id = $1', [userId]);
  const email = profile.rows[0]?.email;
  const existing = await listRecords(accountId, 'email_activity');
  const known = new Set(existing.map((item) => `${item.sender}|${item.subject}|${item.message_id || ''}`));
  let imported = 0;

  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const unseen = await client.search({ since, seen: false });
    for (const uid of unseen) {
      const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
      if (!message?.source) continue;
      const parsed = await simpleParser(message.source);
      const sender = parsed.from?.text || '';
      if (!isBookingSender(sender)) continue;

      const subject = parsed.subject || '(sans sujet)';
      const messageId = parsed.messageId || '';
      const fingerprint = `${sender}|${subject}|${messageId}`;
      if (known.has(fingerprint)) continue;

      await createRecord(accountId, 'email_activity', {
        subject,
        sender,
        content: parsed.text || '',
        received_at: (parsed.date || new Date()).toISOString(),
        message_id: messageId,
        processed: false,
        action_taken: 'pending_review',
        platform_detected: 'unknown',
      }, { email });
      known.add(fingerprint);
      imported += 1;
      await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
    }
  } finally {
    lock.release();
    await client.logout();
  }

  const result = await processInbox(userId);
  return {
    ...result,
    emails_imported: imported,
    summary: imported
      ? `${imported} email(s) lu(s) dans la boîte. ${result.summary}`
      : `Aucun nouvel email Turo ou Getaround. ${result.summary}`,
  };
}
