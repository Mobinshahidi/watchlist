// netlify/functions/data.js
// GET  → returns stored series JSON (public)
// POST → { user, pass, data:[...] } → saves if credentials valid
//
// Requires @netlify/blobs in root package.json:
//   "dependencies": { "@netlify/blobs": "^8.0.0" }

const { getStore } = require('@netlify/blobs');

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };

  // GET — public read
  if (event.httpMethod === 'GET') {
    try {
      const store = getStore('watchlist');
      const raw = await store.get('series');
      return { statusCode: 200, headers: HEADERS, body: raw || '[]' };
    } catch (err) {
      console.error('[data/GET]', err.message);
      return { statusCode: 200, headers: HEADERS, body: '[]' };
    }
  }

  // POST — auth-gated write
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { user, pass, data } = body;
    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    if (!ADMIN_USER || !ADMIN_PASS)
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Server misconfigured' }) };
    if (user !== ADMIN_USER || pass !== ADMIN_PASS)
      return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
    if (!Array.isArray(data))
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'data must be array' }) };

    try {
      const store = getStore('watchlist');
      await store.set('series', JSON.stringify(data));
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, saved: data.length }) };
    } catch (err) {
      console.error('[data/POST]', err.message);
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Write failed' }) };
    }
  }

  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
