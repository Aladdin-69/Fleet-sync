import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
        
        // Fetch all bookings for this user
        const bookings = await base44.entities.Booking.filter({ created_by: user.email });
        
        if (!bookings || bookings.length === 0) {
            return Response.json({ message: 'No bookings to sync', synced: 0 });
        }

        let syncedCount = 0;
        const errors = [];

        // Sync each booking to Google Calendar
        for (const booking of bookings) {
            try {
                const vehicle = await base44.entities.Vehicle.read(booking.vehicle_id);
                
                const event = {
                    summary: `${vehicle?.name || 'Booking'} - ${booking.guest_name || 'Guest'}`,
                    description: `Booking Reference: ${booking.booking_reference || 'N/A'}\nPlatform: ${booking.platform}\nNotes: ${booking.notes || ''}`,
                    start: {
                        dateTime: new Date(booking.start_date).toISOString(),
                    },
                    end: {
                        dateTime: new Date(booking.end_date).toISOString(),
                    },
                    colorId: getColorByStatus(booking.status),
                };

                // Create event in Google Calendar
                const response = await fetch(
                    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(event),
                    }
                );

                if (response.ok) {
                    syncedCount++;
                } else {
                    const error = await response.text();
                    errors.push({ bookingId: booking.id, error });
                }
            } catch (error) {
                errors.push({ bookingId: booking.id, error: error.message });
            }
        }

        return Response.json({
            message: 'Sync completed',
            synced: syncedCount,
            total: bookings.length,
            errors: errors.length > 0 ? errors : null,
        });
    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getColorByStatus(status) {
    const colors = {
        'confirmed': '2',      // Green
        'pending': '5',        // Cyan
        'in_progress': '4',    // Blue
        'completed': '1',      // Blue
        'cancelled': '8',      // Graphite
    };
    return colors[status] || '2';
}