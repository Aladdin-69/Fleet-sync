import crypto from 'crypto';
import { query } from '../config/database.js';
import { findConflicts, planFromPriceId } from './bookingRules.js';
import { matchVehicle, parseBookingEmail } from './emailParser.js';
import { suggestAlertRules } from './alertSuggestions.js';
import { accountIdFor, createRecord, listRecords, updateRecord } from './store.js';

async function userEmail(userId) {
  const result = await query('SELECT email, calendar_provider, calendar_access_token, calendar_refresh_token FROM users WHERE id = $1', [userId]);
  return result.rows[0] || {};
}

export async function provisionAccount(user) {
  const accountId = user.owner_id || user.id;
  const existing = await listRecords(accountId, 'subscription');
  if (!existing.some((item) => item.created_by === user.email)) {
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await createRecord(accountId, 'subscription', {
      plan_name: 'Starter',
      plan_type: 'starter',
      status: 'trialing',
      billing_provider: 'local',
      start_date: new Date().toISOString(),
      trial_end_date: trialEnd,
      created_by: user.email,
    }, { email: user.email });
  }

  const statuses = await listRecords(accountId, 'sync_status');
  if (statuses.length === 0) {
    await createRecord(accountId, 'sync_status', {
      platform: 'fleet',
      status: 'synced',
      overall_status: 'healthy',
      emails_processed_today: 0,
      calendar_provider: user.calendar_provider || 'none',
      last_sync: new Date().toISOString(),
    }, { email: user.email });
  }
}

async function addNotification(accountId, email, notification) {
  return createRecord(accountId, 'notification', {
    type: notification.type || 'system',
    title: notification.title,
    message: notification.message,
    severity: notification.severity || 'info',
    read: false,
    booking_id: notification.booking_id || null,
    vehicle_id: notification.vehicle_id || null,
  }, { email });
}

export async function syncBookingAcrossPlatforms(userId, bookingId, sourcePlatform) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const bookings = await listRecords(accountId, 'booking');
  const vehicles = await listRecords(accountId, 'vehicle');
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) {
    const error = new Error('Réservation introuvable');
    error.status = 404;
    throw error;
  }

  const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
  if (!vehicle) {
    const error = new Error('Véhicule introuvable');
    error.status = 404;
    throw error;
  }

  const source = sourcePlatform || booking.platform;
  const targets = (vehicle.platforms || []).filter((platform) => platform !== source);
  const conflicts = findConflicts(booking, bookings);
  const syncResults = {};

  if (targets.length === 0) {
    return { success: true, message: 'Véhicule absent des autres plateformes', syncResults, conflicts: conflicts.length };
  }

  for (const platform of targets) {
    const blocked = conflicts.length > 0;
    syncResults[platform] = blocked
      ? { status: 'blocked', message: 'Conflit de dates détecté, aucune fermeture automatique' }
      : { status: 'success', message: `Dates marquées occupées sur ${platform} dans FleetSync` };

    await createRecord(accountId, 'automation_log', {
      vehicle_id: vehicle.id,
      booking_id: booking.id,
      platform,
      status: blocked ? 'failed' : 'success',
      action: 'block_dates',
      start_date: booking.start_date,
      end_date: booking.end_date,
      executed_at: new Date().toISOString(),
      error_message: blocked ? 'Chevauchement avec une réservation existante' : null,
      steps: [{ name: 'compare_dates', status: blocked ? 'failed' : 'success' }],
    }, { email: profile.email });
  }

  await createRecord(accountId, 'platform_sync', {
    booking_id: booking.id,
    vehicle_id: vehicle.id,
    source_platform: source,
    target_platforms: targets,
    start_date: booking.start_date,
    end_date: booking.end_date,
    status: conflicts.length ? 'blocked' : 'success',
    sync_results: syncResults,
  }, { email: profile.email });

  if (conflicts.length) {
    await createRecord(accountId, 'alert', {
      title: 'Conflit de réservation',
      message: `${vehicle.name || 'Un véhicule'} a des dates qui se chevauchent.`,
      severity: 'critical',
      category: 'booking',
      resolved: false,
      vehicle_id: vehicle.id,
      booking_id: booking.id,
    }, { email: profile.email });
    await addNotification(accountId, profile.email, {
      type: 'conflict',
      title: 'Double réservation évitée',
      message: `Aucune fermeture automatique : ${vehicle.name || 'véhicule'} est déjà occupé.`,
      severity: 'error',
      vehicle_id: vehicle.id,
      booking_id: booking.id,
    });
  }

  return {
    success: conflicts.length === 0,
    message: conflicts.length ? 'Conflit détecté' : 'Disponibilités synchronisées',
    syncResults,
    conflicts: conflicts.length,
  };
}

export async function processInbox(userId) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const emails = await listRecords(accountId, 'email_activity');
  const vehicles = await listRecords(accountId, 'vehicle');
  const bookings = await listRecords(accountId, 'booking');
  const pending = emails.filter((email) => !email.processed);

  let bookingsCreated = 0;
  let bookingsUpdated = 0;

  for (const email of pending) {
    const parsed = parseBookingEmail({
      subject: email.subject,
      sender: email.sender,
      body: email.content || email.body || '',
    });
    const vehicle = matchVehicle(parsed, vehicles.filter((item) => !item.archived));
    let action = 'pending_review';
    let bookingId = email.booking_id || null;

    if (!vehicle || !parsed.start_date || !parsed.end_date) {
      action = 'pending_review';
    } else if (parsed.event_type === 'booking_cancelled') {
      const existing = bookings.find((booking) => booking.vehicle_id === vehicle.id && booking.platform === parsed.platform_detected && booking.start_date === parsed.start_date);
      if (existing) {
        await updateRecord(accountId, 'booking', existing.id, { status: 'cancelled' });
        bookingsUpdated += 1;
        bookingId = existing.id;
        action = 'synced';
      }
    } else {
      const draft = {
        id: 'draft',
        vehicle_id: vehicle.id,
        platform: parsed.platform_detected,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        status: 'confirmed',
      };
      const conflicts = findConflicts(draft, bookings);
      if (conflicts.length) {
        action = 'blocked';
        await createRecord(accountId, 'alert', {
          title: 'Email bloqué',
          message: `La réservation ${vehicle.name} du ${parsed.start_date.slice(0, 10)} chevauche une location existante.`,
          severity: 'warning',
          category: 'email',
          resolved: false,
          vehicle_id: vehicle.id,
        }, { email: profile.email });
      } else {
        const created = await createRecord(accountId, 'booking', {
          vehicle_id: vehicle.id,
          platform: parsed.platform_detected,
          start_date: parsed.start_date,
          end_date: parsed.end_date,
          customer_name: parsed.customer_name,
          total_price: parsed.total_price,
          status: 'confirmed',
          source: 'email',
        }, { email: profile.email });
        bookings.push(created);
        bookingsCreated += 1;
        bookingId = created.id;
        action = 'synced';
        if (parsed.total_price) {
          await createRecord(accountId, 'revenue', {
            vehicle_id: vehicle.id,
            booking_id: created.id,
            amount: parsed.total_price,
            currency: 'EUR',
            platform: parsed.platform_detected,
            date: parsed.start_date.slice(0, 10),
          }, { email: profile.email });
        }
      }
    }

    await updateRecord(accountId, 'email_activity', email.id, {
      processed: true,
      action_taken: action,
      platform_detected: parsed.platform_detected,
      event_type: parsed.event_type,
      vehicle_matched: vehicle?.id || null,
      booking_id: bookingId,
      received_at: email.received_at || email.created_date,
    });
  }

  const summary = pending.length === 0
    ? 'Aucun email en attente. Collez un email de réservation dans Activité email, puis relancez la synchronisation.'
    : `${pending.length} email(s) lu(s), ${bookingsCreated} réservation(s) créée(s), ${bookingsUpdated} mise(s) à jour.`;

  return {
    emails_processed: pending.length,
    bookings_created: bookingsCreated,
    bookings_updated: bookingsUpdated,
    summary,
  };
}

export async function syncBookingsToCalendar(userId) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const bookings = await listRecords(accountId, 'booking');
  const vehicles = await listRecords(accountId, 'vehicle');
  const active = bookings.filter((booking) => booking.status !== 'cancelled' && booking.start_date && booking.end_date);
  let synced = 0;

  for (const booking of active) {
    const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
    const eventId = `fleetsync-${booking.id}`;
    await updateRecord(accountId, 'booking', booking.id, {
      calendar_event_id: eventId,
      calendar_synced_at: new Date().toISOString(),
      calendar_summary: `${vehicle?.name || 'Véhicule'} · ${booking.platform || 'manuel'}`,
    });
    synced += 1;
  }

  let mode = 'local';
  if (profile.calendar_provider === 'google' && profile.calendar_access_token && process.env.GOOGLE_CLIENT_ID) {
    mode = 'google';
    try {
      const { google } = await import('googleapis');
      const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      auth.setCredentials({
        access_token: profile.calendar_access_token,
        refresh_token: profile.calendar_refresh_token,
      });
      const calendar = google.calendar({ version: 'v3', auth });
      for (const booking of active) {
        const vehicle = vehicles.find((item) => item.id === booking.vehicle_id);
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `${vehicle?.name || 'FleetSync'} (${booking.platform || 'réservation'})`,
            start: { dateTime: new Date(booking.start_date).toISOString() },
            end: { dateTime: new Date(booking.end_date).toISOString() },
          },
        });
      }
    } catch (error) {
      mode = 'local';
      console.error('Google Calendar sync fell back to local calendar:', error.message);
    }
  }

  return { success: true, synced, total: active.length, mode };
}

export async function connectCalendar(userId, provider) {
  const allowed = ['google', 'outlook', 'none'];
  if (!allowed.includes(provider)) {
    const error = new Error('Fournisseur de calendrier inconnu');
    error.status = 400;
    throw error;
  }

  await query('UPDATE users SET calendar_provider = $1, updated_at = NOW() WHERE id = $2', [provider, userId]);
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const statuses = await listRecords(accountId, 'sync_status');
  if (statuses[0]) {
    await updateRecord(accountId, 'sync_status', statuses[0].id, { calendar_provider: provider, status: 'synced' });
  } else {
    await createRecord(accountId, 'sync_status', {
      platform: 'fleet',
      status: 'synced',
      overall_status: 'healthy',
      calendar_provider: provider,
      emails_processed_today: 0,
    }, { email: profile.email });
  }

  const oauthReady = provider === 'google'
    ? Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    : Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

  return {
    success: true,
    provider,
    connected: provider !== 'none',
    mode: oauthReady ? 'oauth' : 'local',
    message: oauthReady
      ? `${provider} est prêt pour la synchronisation OAuth`
      : `Calendrier ${provider} enregistré localement. Ajoutez les identifiants OAuth du serveur pour pousser les événements à l'extérieur.`,
  };
}

export async function savePlatformAccount(userId, platform, email) {
  const allowed = ['turo', 'getaround', 'hunos_rent'];
  if (!allowed.includes(platform)) {
    const error = new Error('Plateforme inconnue');
    error.status = 400;
    throw error;
  }
  if (!email || !email.includes('@')) {
    const error = new Error('Email de compte requis');
    error.status = 400;
    throw error;
  }

  await query(
    `UPDATE users
     SET platform_accounts = COALESCE(platform_accounts, '{}'::jsonb) || $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify({ [platform]: { email, connected_at: new Date().toISOString() } }), userId]
  );

  return {
    success: true,
    platform,
    connected: true,
    message: `Adresse ${email} enregistrée pour ${platform}. Le mot de passe n'est pas conservé.`,
  };
}

export async function suggestRulesForUser(userId) {
  const accountId = await accountIdFor(userId);
  const [emails, bookings, logs, vehicles] = await Promise.all([
    listRecords(accountId, 'email_activity'),
    listRecords(accountId, 'booking'),
    listRecords(accountId, 'automation_log'),
    listRecords(accountId, 'vehicle'),
  ]);
  return suggestAlertRules({ emails, bookings, logs, vehicles });
}

export async function activateLocalPlan(userId, priceId) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const plan = planFromPriceId(priceId);
  const subscriptions = await listRecords(accountId, 'subscription');
  const current = subscriptions.find((item) => item.created_by === profile.email) || subscriptions[0];
  const payload = {
    plan_name: plan.name,
    plan_type: plan.type,
    status: 'active',
    billing_provider: 'local',
    price_id: priceId,
    start_date: new Date().toISOString(),
  };

  if (current) await updateRecord(accountId, 'subscription', current.id, payload);
  else await createRecord(accountId, 'subscription', { ...payload, created_by: profile.email }, { email: profile.email });

  await query(`UPDATE users SET subscription_status = 'active', updated_at = NOW() WHERE id = $1`, [userId]);
  return { success: true, url: '/Settings', plan: plan.name, billing_provider: 'local' };
}

export async function syncPayPalLedger(userId, connectionId) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const revenues = await listRecords(accountId, 'revenue');
  const existing = await listRecords(accountId, 'paypal_transaction');
  const known = new Set(existing.map((item) => item.transaction_id));
  let count = 0;

  for (const revenue of revenues.filter((item) => item.platform === 'paypal' || item.platform === 'hunos_rent')) {
    const transactionId = `revenue-${revenue.id}`;
    if (known.has(transactionId)) continue;
    await createRecord(accountId, 'paypal_transaction', {
      paypal_connection_id: connectionId || null,
      transaction_id: transactionId,
      amount: revenue.amount,
      currency: revenue.currency || 'EUR',
      status: 'completed',
      transaction_date: revenue.date || revenue.created_date,
      description: 'Revenu importé du registre FleetSync',
    }, { email: profile.email });
    count += 1;
  }

  return {
    success: true,
    count,
    message: count ? `${count} transaction(s) importée(s) du registre` : 'Aucune transaction PayPal dans le registre',
  };
}

export async function notifyAutomationErrors(userId) {
  const accountId = await accountIdFor(userId);
  const profile = await userEmail(userId);
  const logs = await listRecords(accountId, 'automation_log');
  const notifications = await listRecords(accountId, 'notification');
  let created = 0;

  for (const log of logs.filter((item) => item.status === 'failed')) {
    const already = notifications.some((item) => item.automation_log_id === log.id);
    if (already) continue;
    await createRecord(accountId, 'notification', {
      type: 'automation_error',
      title: `Échec ${log.platform || 'automatisation'}`,
      message: log.error_message || 'Une synchronisation a échoué',
      severity: 'error',
      read: false,
      automation_log_id: log.id,
      vehicle_id: log.vehicle_id || null,
      booking_id: log.booking_id || null,
    }, { email: profile.email });
    created += 1;
  }

  return { success: true, created };
}

export function temporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}
