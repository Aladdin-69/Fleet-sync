import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return Response.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create checkout session (no auth required for public checkout)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 3,
      },
      success_url: `${Deno.env.get('BASE44_APP_URL') || 'https://example.com'}/settings?tab=subscription&success=true`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL') || 'https://example.com'}/Landing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    console.log('Checkout session created:', session.id);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json(
      { error: error.message || 'Checkout creation failed' },
      { status: 500 }
    );
  }
});