import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platform, email, password } = body;

    if (!platform || !email || !password) {
      return Response.json({ error: 'Platform, email and password required' }, { status: 400 });
    }

    // Test connection based on platform
    let isConnected = false;
    let message = '';

    if (platform === 'turo') {
      // Simple validation - in production, would actually test login
      isConnected = email.includes('@') && password.length >= 6;
      message = isConnected 
        ? 'Connexion à Turo testée avec succès' 
        : 'Identifiants Turo invalides';
    } else if (platform === 'getaround') {
      // Simple validation - in production, would actually test login
      isConnected = email.includes('@') && password.length >= 6;
      message = isConnected 
        ? 'Connexion à Getaround testée avec succès' 
        : 'Identifiants Getaround invalides';
    }

    return Response.json({
      success: isConnected,
      message,
      platform
    });
  } catch (error) {
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});