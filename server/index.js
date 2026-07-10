/**
 * Unstuck — local API server (test mode).
 *
 * Responsibilities:
 *   POST /api/checkout  -> create a Stripe Payment Link for a 30-min session, return hosted URL
 *   POST /webhook       -> receive Stripe webhook events (signed), log fulfillment
 *   GET  /api/events    -> latest webhook events (for the /success debug view)
 *   GET  /health        -> liveness
 *
 * Test mode only: Payment Links use the test_secret_key, so no real charges occur.
 * Webhooks are delivered locally via `stripe listen --forward-to localhost:4242/webhook`.
 */
import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4242;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5186';

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!secretKey || secretKey.includes('REPLACE_ME')) {
  console.error('[server] STRIPE_SECRET_KEY is missing in .env — copy .env.example to .env and fill it in.');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// Persist webhook events to a local JSONL so the /success page can show real fulfillment.
const EVENTS_FILE = path.join(__dirname, '.webhook-events.jsonl');
const events = [];
if (fs.existsSync(EVENTS_FILE)) {
  for (const line of fs.readFileSync(EVENTS_FILE, 'utf8').split('\n')) {
    if (line.trim()) { try { events.push(JSON.parse(line)); } catch { /* ignore */ } }
  }
}
function recordEvent(evt) {
  const entry = { id: evt.id, type: evt.type, created: evt.created, data: evt.data?.object ?? null };
  events.push(entry);
  if (events.length > 200) events.splice(0, events.length - 200);
  fs.appendFileSync(EVENTS_FILE, JSON.stringify(entry) + '\n');
}

const app = express();

// Raw body for the webhook so Stripe signature verification works.
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, mode: 'test', events: events.length }));

app.get('/api/events', (_req, res) => res.json({ events: events.slice(-25).reverse() }));

// Create a Payment Link for the chosen expert + session.
// Body: { expertId, expertName, sessionLabel, amount (cents), sessionId }
app.post('/api/checkout', async (req, res) => {
  try {
    const { expertId, expertName, sessionLabel, amount, sessionId } = req.body || {};
    if (!expertId || !amount) {
      return res.status(400).json({ error: 'missing expertId or amount' });
    }

    // Idempotent product name (one per expert+session — Payment Links are per-link).
    const productName = `Unstuck · ${sessionLabel || '30-min session'} with ${expertName || expertId}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.max(1, Math.round(amount)),
          product_data: {
            name: productName,
            description: 'Tactical 30-minute working session. Booking confirmed on payment.',
          },
        },
        quantity: 1,
      }],
      // Send the buyer to our success page with the session id for fulfillment lookup.
      success_url: `${CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/?canceled=true`,
      // Stash our internal references; visible in webhook via metadata.
      metadata: { expertId, expertName, sessionId, sessionLabel },
      // Allow promotion codes off; keep it simple.
      allow_promotion_codes: false,
    });

    // Create a reusable Payment Link from the session (hosted, shareable).
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: session.line_items?.[0]?.price?.id, quantity: 1 }].filter(Boolean),
    }).catch(() => null);

    res.json({
      url: session.url,
      paymentLinkUrl: paymentLink?.url ?? session.url,
      checkoutSessionId: session.id,
    });
  } catch (err) {
    console.error('[server] /api/checkout failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook: verify signature, then record fulfillment events.
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (err) {
    console.error('[server] webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the events we care about for fulfillment.
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      console.log(`[webhook] payment succeeded for ${session.metadata?.expertName || session.id}`);
      recordEvent(event);
      break;
    }
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      recordEvent(event);
      break;
    }
    default:
      // Record everything else too (for the debug view).
      recordEvent(event);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`[server] Unstuck API listening on http://localhost:${PORT} (test mode)`);
  console.log(`[server] Start webhook forwarding with: stripe listen --forward-to localhost:${PORT}/webhook`);
});
