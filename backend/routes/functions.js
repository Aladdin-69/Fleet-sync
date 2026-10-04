import express from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import {
  activateLocalPlan,
  connectCalendar,
  notifyAutomationErrors,
  processInbox,
  savePlatformAccount,
  suggestRulesForUser,
  syncBookingAcrossPlatforms,
  syncBookingsToCalendar,
  syncPayPalLedger,
} from '../services/fleet.js';

const router = express.Router();

router.post('/invoke/:functionName', authenticateToken, async (req, res, next) => {
  try {
    const { functionName } = req.params;
    const params = req.body || {};
    let data;

    switch (functionName) {
      case 'testPlatformConnection':
      case 'savePlatformAccount':
        data = await savePlatformAccount(req.user.id, params.platform, params.email);
        break;
      case 'connectCalendar':
        data = await connectCalendar(req.user.id, params.provider);
        break;
      case 'syncBookingsToGoogleCalendar':
        data = await syncBookingsToCalendar(req.user.id);
        break;
      case 'syncBookingAcrossPlatforms':
        data = await syncBookingAcrossPlatforms(req.user.id, params.booking_id, params.source_platform);
        break;
      case 'processBookingEmails':
        data = await processInbox(req.user.id);
        break;
      case 'suggestAlertRules':
        data = { suggestions: await suggestRulesForUser(req.user.id) };
        break;
      case 'notifyAutomationErrors':
        data = await notifyAutomationErrors(req.user.id);
        break;
      case 'syncPayPalTransactions':
        data = await syncPayPalLedger(req.user.id, params.paypal_connection_id);
        break;
      case 'createStripeCheckout':
      case 'createSubscriptionForUser':
        data = await createCheckout(req.user, params.priceId || params.price_id);
        break;
      case 'stripePortal':
        data = await openBillingPortal(req.user, params.action);
        break;
      default:
        return res.status(404).json({ error: `Fonction ${functionName} inconnue` });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

async function createCheckout(user, priceId) {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/Settings?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/Pricing?checkout=cancel`,
    });
    return { success: true, url: session.url, sessionId: session.id, billing_provider: 'stripe' };
  }

  return activateLocalPlan(user.id, priceId);
}

async function openBillingPortal(user, action) {
  if (process.env.STRIPE_SECRET_KEY && user.stripe_customer_id) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/Settings`,
    });
    return { success: true, url: session.url };
  }

  return {
    success: true,
    url: '/Settings',
    message: action === 'cancel'
      ? 'Le portail Stripe n’est pas configuré. Le plan local se gère dans les paramètres.'
      : 'Facturation locale : ouvrez les paramètres du compte.',
  };
}

export default router;
