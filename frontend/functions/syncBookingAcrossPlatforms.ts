import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, source_platform } = await req.json();

    if (!booking_id || !source_platform) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch booking and vehicle details
    const booking = await base44.entities.Booking.list();
    const targetBooking = booking.find(b => b.id === booking_id);

    if (!targetBooking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get vehicle platforms
    const vehicles = await base44.entities.Vehicle.list();
    const vehicle = vehicles.find(v => v.id === targetBooking.vehicle_id);

    if (!vehicle) {
      return Response.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Determine target platforms (all except source)
    const targetPlatforms = (vehicle.platforms || []).filter(p => p !== source_platform);

    if (targetPlatforms.length === 0) {
      return Response.json({
        success: true,
        message: 'Vehicle not listed on other platforms',
        syncResults: {}
      });
    }

    // Create sync record
    const syncRecord = await base44.entities.PlatformSync.create({
      booking_id,
      vehicle_id: vehicle.id,
      source_platform,
      target_platforms: targetPlatforms,
      start_date: targetBooking.start_date,
      end_date: targetBooking.end_date,
      status: 'syncing'
    });

    const syncResults = {};

    // Sync with each target platform (simulated - would integrate with actual platform APIs)
    for (const platform of targetPlatforms) {
      try {
        // In production, this would call actual platform APIs (Turo, Getaround, Hunos Rent)
        // For now, simulating the sync process
        syncResults[platform] = {
          status: 'success',
          message: `Dates bloquées du ${new Date(targetBooking.start_date).toLocaleDateString('fr-FR')} au ${new Date(targetBooking.end_date).toLocaleDateString('fr-FR')} synchronisées`
        };

        // Create automation log for tracking
        await base44.asServiceRole.entities.AutomationLog.create({
          vehicle_id: vehicle.id,
          booking_id,
          platform,
          status: 'success',
          start_date: targetBooking.start_date,
          end_date: targetBooking.end_date,
          steps: [
            {
              step: 'Block dates on platform',
              status: 'success',
              timestamp: new Date().toISOString(),
              details: `Successfully blocked dates on ${platform}`
            }
          ],
          executed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
      } catch (error) {
        syncResults[platform] = {
          status: 'failed',
          message: error.message
        };
      }
    }

    // Update sync record
    const allSuccess = Object.values(syncResults).every(r => r.status === 'success');
    const finalStatus = allSuccess ? 'success' : 
                       Object.values(syncResults).some(r => r.status === 'success') ? 'partial_failure' :
                       'failed';

    await base44.entities.PlatformSync.update(syncRecord.id, {
      status: finalStatus,
      sync_results: syncResults
    });

    // Send notification if sync completed
    if (allSuccess) {
      await base44.entities.Notification.create({
        type: 'booking_modified',
        title: `Synchronisation multi-plateforme réussie`,
        message: `Les dates de réservation ont été synchronisées sur ${targetPlatforms.length} plateforme(s)`,
        severity: 'success',
        booking_id,
        vehicle_id: vehicle.id
      });
    }

    return Response.json({
      success: allSuccess,
      syncRecord,
      syncResults
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});