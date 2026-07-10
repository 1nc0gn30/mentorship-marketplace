// Netlify Function: return recent webhook events (for the /success debug view).
// Receives GET /api/events  -> redirect to /.netlify/functions/events
// Shares the in-memory event log with the webhook function via module scope.
const events = (globalThis.__unstuckEvents = globalThis.__unstuckEvents || []);

export async function handler() {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events: events.slice(-25).reverse() }),
  };
}
