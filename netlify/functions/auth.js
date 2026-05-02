// netlify/functions/auth.js
// Validates login credentials entirely server-side.
// Set ADMIN_USER and ADMIN_PASS in Netlify → Site settings → Environment variables
// (or in a .env file when running locally with `netlify dev`).

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  const { user, pass } = body;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('ADMIN_USER or ADMIN_PASS environment variables are not set.');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Server misconfiguration.' })
    };
  }

  const ok = (user === ADMIN_USER) && (pass === ADMIN_PASS);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      // Prevent this response from being cached
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({ ok })
  };
};
