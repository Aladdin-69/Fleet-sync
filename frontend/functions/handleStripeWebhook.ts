import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Initialize base44 first (required before stripe validation)
    const base44 = createClientFromRequest(req);

    // Validate webhook signature with Stripe
    const stripe = await import('npm:stripe@13.0.0');
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_API_KEY'));

    const event = await stripeClient.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle different webhook events
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by Stripe customer ID
      const users = await base44.asServiceRole.entities.User.filter({
        stripe_customer_id: customerId
      });

      if (users.length > 0) {
        const user = users[0];
        const status = (subscription.status === 'active' || subscription.status === 'trialing')
          ? subscription.status
          : 'cancelled';

        // Update user subscription status
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: status,
          stripe_subscription_id: subscription.id,
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          trial_end_date: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null
        });

        // Send email notification
        if (status === 'active' || status === 'trialing') {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: subscription.trial_end ? 'Bienvenue sur FleetSync' : 'Abonnement confirmé',
            body: subscription.trial_end
              ? `Votre essai gratuit de 3 jours commence maintenant! Accédez à votre tableau de bord: ${Deno.env.get('APP_URL') || 'https://app.base44.com'}`
              : `Votre abonnement est maintenant actif. Connectez-vous pour commencer: ${Deno.env.get('APP_URL') || 'https://app.base44.com'}`
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});