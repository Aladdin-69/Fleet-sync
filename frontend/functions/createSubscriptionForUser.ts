import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { email, plan, stripe_customer_id, stripe_subscription_id } = await req.json();

    if (!email || !plan) {
      return Response.json({ error: 'Missing email or plan' }, { status: 400 });
    }

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      status: 'active',
      plan: plan,
      stripe_customer_id: stripe_customer_id || '',
      stripe_subscription_id: stripe_subscription_id || '',
      price: plan === 'starter' ? 19.99 : plan === 'growth' ? 39.99 : 79.99,
      currency: 'EUR',
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: email
    });

    return Response.json({ success: true, subscription });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});