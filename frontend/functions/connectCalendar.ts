import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await req.json();

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return Response.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (provider === 'google') {
      // Get Google Calendar access token from connector
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
      
      if (!accessToken) {
        return Response.json({ error: 'Failed to get Google Calendar access token' }, { status: 500 });
      }

      // Test the connection by fetching calendars
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!calendarsResponse.ok) {
        return Response.json({ error: 'Failed to connect to Google Calendar' }, { status: 500 });
      }

      // Save the connection in user profile
      await base44.auth.updateMe({
        calendar_provider: 'google',
        google_calendar_access_token: accessToken
      });

      return Response.json({ success: true, provider: 'google' });
    }

    if (provider === 'outlook') {
      // Similar implementation for Outlook when ready
      return Response.json({ error: 'Outlook Calendar not yet implemented' }, { status: 501 });
    }

  } catch (error) {
    console.error('Calendar connection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});