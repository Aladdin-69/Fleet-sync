import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await req.json();

    if (!['google', 'outlook'].includes(provider)) {
      return Response.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Récupérer le token d'accès via le connecteur OAuth
    const accessToken = await base44.asServiceRole.connectors.getAccessToken(
      provider === 'google' ? 'googlecalendar' : 'outlook'
    );

    if (!accessToken) {
      return Response.json({ error: 'Failed to get access token' }, { status: 400 });
    }

    // Mettre à jour le profil utilisateur
    await base44.auth.updateMe({ calendar_provider: provider });

    return Response.json({
      success: true,
      message: `Connecté à ${provider} Calendar`,
      provider
    });
  } catch (error) {
    console.error('Calendar auth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});