// Netlify Function: create a Stripe Payment Link (test mode) for a 30-min session.
// Receives POST /api/checkout  -> redirect to /.netlify/functions/checkout
import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';

const secret = process.env.STRIPE_SECRET_KEY;
const stripe = secret && !secret.includes('REPLACE_ME') ? new Stripe(secret) : null;
const CLIENT_URL = process.env.URL || process.env.DEPLOY_PRIMARY_URL || 'http://localhost:8888';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  if (!stripe) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe not configured — set STRIPE_SECRET_KEY in Netlify env.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'bad json' }) }; }

  const { expertId, expertName, sessionLabel, amount, sessionId } = body;
  if (!expertId || !amount) return { statusCode: 400, body: JSON.stringify({ error: 'missing expertId or amount' }) };

  try {
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
      success_url: `${CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/?canceled=true`,
      metadata: { expertId, expertName, sessionId, sessionLabel },
      allow_promotion_codes: false,
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: session.line_items?.[0]?.price?.id, quantity: 1 }].filter(Boolean),
    }).catch(() => null);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: session.url,
        paymentLinkUrl: paymentLink?.url ?? session.url,
        checkoutSessionId: session.id,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
