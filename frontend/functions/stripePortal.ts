import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.6.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'portal') {
      // Get or create Stripe customer
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      let customerId = customers.data[0]?.id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name
        });
        customerId = customer.id;
      }

      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${Deno.env.get('BASE44_APP_URL')}/Settings?tab=subscription`
      });

      return Response.json({ url: session.url });
    }

    if (action === 'cancel') {
      // Get customer
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (!customers.data.length) {
        return Response.json({ error: 'No customer found', success: false }, { status: 404 });
      }

      const customerId = customers.data[0].id;

      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 100
      });

      if (!subscriptions.data.length) {
        return Response.json({ success: false, message: 'No active subscriptions found' }, { status: 200 });
      }

      // Cancel all active subscriptions
      const cancelledCount = await Promise.all(
        subscriptions.data.map(sub => stripe.subscriptions.cancel(sub.id))
      );

      return Response.json({ 
        success: true, 
        message: `${cancelledCount.length} subscription(s) cancelled` 
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Stripe Portal Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});