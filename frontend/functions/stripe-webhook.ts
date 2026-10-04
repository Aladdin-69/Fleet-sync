import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return Response.json(
        { error: 'Missing security information' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);

    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id);

        const userEmail = session.customer_email || session.customer_details?.email;
        if (userEmail) {
          try {
            // Get the subscription to determine the plan
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const priceId = subscription.items.data[0]?.price?.id;

            // Map price IDs to plan names
            const planMap = {
              'price_1Sx8RI8Ee6MCd5y0D8JX00qX': 'starter',
              'price_1Sx8RI8Ee6MCd5y07dNgUwrv': 'growth',
              'price_1Sx8RI8Ee6MCd5y0d6Cq9ekV': 'enterprise'
            };

            const plan = planMap[priceId] || 'starter';

            // Create subscription record in Base44
            await base44.asServiceRole.entities.Subscription.create({
              status: subscription.status === 'trialing' ? 'trialing' : 'active',
              plan: plan,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer,
              price: subscription.items.data[0]?.price?.unit_amount / 100,
              currency: subscription.currency?.toUpperCase() || 'EUR',
              renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
              created_by: userEmail
            });
            console.log(`Subscription created for ${userEmail}`);
          } catch (err) {
            console.error('Error creating subscription record:', err.message);
          }
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);
        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        console.log('Subscription updated:', updatedSub.id);

        try {
          // Find and update the subscription record
          const subs = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: updatedSub.id
          });

          if (subs.length > 0) {
            const status = (updatedSub.status === 'active' || updatedSub.status === 'trialing')
              ? updatedSub.status
              : 'inactive';

            await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
              status: status,
              renewal_date: new Date(updatedSub.current_period_end * 1000).toISOString()
            });
            console.log(`Subscription updated: ${updatedSub.id} with status: ${status}`);
          }
        } catch (err) {
          console.error('Error updating subscription record:', err.message);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('Subscription deleted:', deletedSub.id);

        try {
          // Find and update the subscription record
          const subs = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: deletedSub.id
          });

          if (subs.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
              status: 'cancelled'
            });
            console.log(`Subscription cancelled: ${deletedSub.id}`);
          }
        } catch (err) {
          console.error('Error cancelling subscription record:', err.message);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
});