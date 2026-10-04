import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Fetch emails from inbox and spam folders
    const folders = ['INBOX', 'SPAM'];
    let allEmails = [];

    for (const folder of folders) {
      const query = folder === 'SPAM' ? `in:${folder} from:(@turo.fr OR @getaround.com OR @hunosrent.com)` : `from:(@turo.fr OR @getaround.com OR @hunosrent.com)`;
      
      const listResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const listData = await listResponse.json();
      if (listData.messages) {
        allEmails = [...allEmails, ...listData.messages];
      }
    }

    // Process each email
    const results = [];
    for (const msg of allEmails) {
      const emailResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const emailData = await emailResponse.json();
      const headers = emailData.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';

      // Classify and process email
      const classifyResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this booking email and extract:
        1. Platform (turo, getaround, or hunos_rent)
        2. Event type (booking_confirmed, booking_cancelled, booking_modified, or reminder)
        3. Vehicle name/identifier if mentioned
        4. Guest name
        5. Check-in date and time
        6. Check-out date and time
        
        Email from: ${from}
        Subject: ${subject}
        
        Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            event_type: { type: 'string' },
            vehicle_name: { type: 'string' },
            guest_name: { type: 'string' },
            check_in: { type: 'string' },
            check_out: { type: 'string' }
          }
        }
      });

      // Save email activity
      await base44.entities.EmailActivity.create({
        subject,
        sender: from,
        received_at: new Date().toISOString(),
        platform_detected: classifyResponse.platform || 'unknown',
        event_type: classifyResponse.event_type || 'unknown',
        classification_confidence: 85,
        vehicle_matched: classifyResponse.vehicle_name,
        action_taken: 'pending_review',
        raw_content_preview: subject
      });

      // Try to find and update vehicle or booking
      if (classifyResponse.vehicle_name) {
        const vehicles = await base44.entities.Vehicle.filter({});
        const matchedVehicle = vehicles.find(v => 
          v.name.toLowerCase().includes(classifyResponse.vehicle_name.toLowerCase())
        );

        if (matchedVehicle && classifyResponse.check_in && classifyResponse.check_out) {
          // Create or update booking
          const booking = await base44.entities.Booking.create({
            vehicle_id: matchedVehicle.id,
            platform: classifyResponse.platform || 'manual',
            start_date: new Date(classifyResponse.check_in).toISOString(),
            end_date: new Date(classifyResponse.check_out).toISOString(),
            guest_name: classifyResponse.guest_name,
            status: classifyResponse.event_type === 'booking_confirmed' ? 'confirmed' : 'pending',
            synced_to_calendar: false
          });

          // Trigger cloud automation if enabled
          if (user.automation_enabled && classifyResponse.platform && ['turo', 'getaround'].includes(classifyResponse.platform)) {
            try {
              await base44.functions.invoke('automateBlockDates', {
                booking_id: booking.id,
                vehicle_id: matchedVehicle.id,
                platform: classifyResponse.platform,
                start_date: booking.start_date,
                end_date: booking.end_date
              });
            } catch (autoError) {
              console.error('Automation trigger failed:', autoError);
              // Continue even if automation fails - booking is still created
            }
          }

          results.push({
            vehicle: classifyResponse.vehicle_name,
            status: 'booking_created',
            platform: classifyResponse.platform
          });
        }
      }
    }

    // Update sync status
    const syncStatus = await base44.entities.SyncStatus.list();
    if (syncStatus.length > 0) {
      await base44.entities.SyncStatus.update(syncStatus[0].id, {
        last_email_processed: new Date().toISOString(),
        emails_processed_today: (syncStatus[0].emails_processed_today || 0) + allEmails.length,
        email_connected: true,
        email_provider: 'gmail'
      });
    } else {
      await base44.entities.SyncStatus.create({
        last_email_processed: new Date().toISOString(),
        emails_processed_today: allEmails.length,
        email_connected: true,
        email_provider: 'gmail'
      });
    }

    return Response.json({
      success: true,
      emails_processed: allEmails.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});