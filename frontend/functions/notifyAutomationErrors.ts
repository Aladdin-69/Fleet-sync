import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CRITICAL_ERROR_TYPES = ['captcha', 'login_failed', 'network_error'];
const CRITICAL_ERROR_THRESHOLD = 3; // Consider critical if 3+ failures in a row

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationLogId } = await req.json();

    if (!automationLogId) {
      return Response.json({ error: 'Missing automationLogId' }, { status: 400 });
    }

    // Fetch the automation log
    const automationLog = await base44.entities.AutomationLog.list(null, 1, { id: automationLogId }).then(res => res[0]);

    if (!automationLog) {
      return Response.json({ error: 'Automation log not found' }, { status: 404 });
    }

    // Check if this is a critical error
    const isCriticalError = CRITICAL_ERROR_TYPES.includes(automationLog.error_type) || 
                            automationLog.manual_review_required;

    if (!isCriticalError) {
      return Response.json({ 
        success: true, 
        message: 'Error is not critical, no notification sent',
        isCritical: false 
      });
    }

    // Check for repeated failures on same platform
    const recentLogs = await base44.entities.AutomationLog.list('-executed_at', 10);
    const samePlatformLogs = recentLogs.filter(log => log.platform === automationLog.platform);
    const recentFailures = samePlatformLogs.filter(log => log.status === 'failed').length;

    // Determine notification severity
    let severity = 'warning';
    let notificationTitle = 'Erreur de synchronisation détectée';
    let notificationMessage = `Une erreur s'est produite lors de la synchronisation sur ${automationLog.platform}.`;

    if (automationLog.error_type === 'captcha') {
      severity = 'error';
      notificationTitle = '⚠️ CAPTCHA détecté - Action manuelle requise';
      notificationMessage = `Un CAPTCHA a été détecté sur ${automationLog.platform} pour le véhicule ${automationLog.vehicle_id}. Une intervention manuelle est nécessaire.`;
    } else if (automationLog.error_type === 'login_failed') {
      severity = 'error';
      notificationTitle = '🔐 Erreur de connexion - Vérifiez vos identifiants';
      notificationMessage = `La connexion à ${automationLog.platform} a échoué. Veuillez vérifier vos identifiants dans l'onglet Identifiants.`;
    } else if (automationLog.error_type === 'network_error') {
      severity = 'error';
      notificationTitle = '🌐 Erreur de réseau détectée';
      notificationMessage = `Une erreur de connexion s'est produite lors de l'accès à ${automationLog.platform}.`;
    }

    if (recentFailures >= CRITICAL_ERROR_THRESHOLD) {
      severity = 'error';
      notificationTitle = '🚨 Automatisation critique - Multiples échecs détectés';
      notificationMessage = `${recentFailures} échecs consécutifs détectés sur ${automationLog.platform}. L'automatisation a été partiellement arrêtée pour cette plateforme.`;
    }

    // Create in-app notification
    const notification = await base44.entities.Notification.create({
      type: 'sync_error',
      title: notificationTitle,
      message: notificationMessage,
      severity,
      vehicle_id: automationLog.vehicle_id,
      booking_id: automationLog.booking_id,
      action_url: '/Automation?tab=sync-status',
      read: false
    });

    // Send email notification
    const emailSubject = notificationTitle;
    const automationLogUrl = `${Deno.env.get('APP_URL') || 'https://app.fleetsync.io'}/Automation?tab=logs`;
    
    const emailBody = `
<h2>${notificationTitle}</h2>
<p>${notificationMessage}</p>

<h3>Détails de l'erreur :</h3>
<ul>
  <li><strong>Plateforme :</strong> ${automationLog.platform.toUpperCase()}</li>
  <li><strong>Véhicule :</strong> ${automationLog.vehicle_id}</li>
  <li><strong>Type d'erreur :</strong> ${automationLog.error_type || 'Inconnu'}</li>
  <li><strong>Message :</strong> ${automationLog.error_message || 'N/A'}</li>
  <li><strong>Heure :</strong> ${new Date(automationLog.executed_at).toLocaleString('fr-FR')}</li>
</ul>

${automationLog.error_type === 'captcha' ? '<p style="color: red;"><strong>Action requise :</strong> Veuillez vous connecter manuellement à la plateforme et résoudre le CAPTCHA.</p>' : ''}

${automationLog.error_type === 'login_failed' ? '<p style="color: red;"><strong>Action requise :</strong> Veuillez vérifier et mettre à jour vos identifiants de connexion.</p>' : ''}

<p><a href="${automationLogUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir l'historique d'automatisation</a></p>

<p style="color: #666; font-size: 12px;">Ceci est une notification automatique de FleetSync. Ne pas répondre à cet email.</p>
    `;

    // Send email to user
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `FleetSync - ${emailSubject}`,
        body: emailBody
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - notification is already created
    }

    // Update SyncStatus to track errors
    try {
      const syncStatus = await base44.entities.SyncStatus.list(null, 1).then(res => res[0]);
      if (syncStatus) {
        await base44.entities.SyncStatus.update(syncStatus.id, {
          sync_errors_count: (syncStatus.sync_errors_count || 0) + 1
        });
      }
    } catch (syncError) {
      console.error('Failed to update SyncStatus:', syncError);
    }

    return Response.json({
      success: true,
      message: 'Critical error notification sent',
      notificationId: notification.id,
      emailSent: true,
      isCritical: true,
      recentFailureCount: recentFailures
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});