import express from 'express';
import Stripe from 'stripe';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { price_id, trial_days = 3 } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: 'price_id is required' });
    }

    // Get or create Stripe customer
    let customerId = req.user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          user_id: req.user.id
        }
      });
      customerId = customer.id;

      // Update user with customer ID
      await query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.id]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trial_days,
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        user_id: req.user.id
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Customer Portal Session
router.post('/create-portal', authenticateToken, async (req, res) => {
  try {
    if (!req.user.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook endpoint (must be raw body, not JSON parsed)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          // Find user by Stripe customer ID
          const userResult = await query(
            'SELECT id, email FROM users WHERE stripe_customer_id = $1',
            [customerId]
          );

          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const status = ['active', 'trialing'].includes(subscription.status)
              ? subscription.status
              : 'cancelled';

            // Update user subscription
            await query(
              `UPDATE users SET 
                subscription_status = $1,
                stripe_subscription_id = $2,
                subscription_start_date = $3,
                trial_end_date = $4,
                updated_at = NOW()
               WHERE id = $5`,
              [
                status,
                subscription.id,
                new Date(subscription.current_period_start * 1000),
                subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
                user.id
              ]
            );

            console.log(`Subscription ${status} for user ${user.email}`);
          }
        }
        break;

      case 'customer.subscription.deleted':
        {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          await query(
            `UPDATE users SET 
              subscription_status = 'cancelled',
              updated_at = NOW()
             WHERE stripe_customer_id = $1`,
            [customerId]
          );

          console.log('Subscription cancelled for customer:', customerId);
        }
        break;

      case 'invoice.payment_succeeded':
        {
          const invoice = event.data.object;
          console.log('Payment succeeded:', invoice.id);
        }
        break;

      case 'invoice.payment_failed':
        {
          const invoice = event.data.object;
          console.log('Payment failed:', invoice.id);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
