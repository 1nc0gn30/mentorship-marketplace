// Netlify Function: receive Stripe webhooks (signed), record fulfillment events in memory.
// Receives POST /webhook  -> redirect to /.netlify/functions/webhook
// NOTE: events are kept in function memory for the demo (test mode). For production,
// swap this for Netlify Blobs / a DB. Webhook always returns 200 so Stripe stays happy.
import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = secret && !secret.includes('REPLACE_ME') ? new Stripe(secret) : null;

// Module-scoped event log (persists across warm invocations of this function instance).
const events = [];

export async function handler(event) {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  let payload = event.body;
  if (typeof payload !== 'string') payload = JSON.stringify(payload);

  let stripeEvent;
  try {
    stripeEvent = webhookSecret && stripe
      ? stripe.webhooks.constructEvent(payload, sig, webhookSecret)
      : JSON.parse(payload);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const entry = { id: stripeEvent.id, type: stripeEvent.type, created: stripeEvent.created, data: stripeEvent.data?.object ?? null };
  events.push(entry);
  if (events.length > 200) events.splice(0, events.length - 200);
  console.log(`[webhook] ${stripeEvent.type} — ${stripeEvent.data?.object?.metadata?.expertName || stripeEvent.id}`);

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
