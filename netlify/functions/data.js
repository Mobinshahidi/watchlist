// netlify/functions/data.js
//
// Uses a GitHub Gist as persistent storage — zero npm packages, always works.
//
// Setup (one time):
//   1. Create a SECRET gist at https://gist.github.com with a file named "series.json"
//      and initial content: []
//   2. Create a GitHub Personal Access Token at https://github.com/settings/tokens
//      with ONLY the "gist" scope checked.
//   3. In Netlify → Site settings → Environment variables, add:
//        GITHUB_TOKEN   = ghp_xxxxxxxxxxxxxxxxxxxx
//        GIST_ID        = the long ID from your gist URL
//        ADMIN_USER     = slaughter          (already set)
//        ADMIN_PASS     = your_password      (already set)

const GIST_API = 'https://api.github.com/gists';
const FILE_NAME = 'series.json';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

function githubHeaders() {
  return {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'mswatchlist-netlify',
  };
}

function missingEnv(...keys) {
  return keys.filter(k => !process.env[k]);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  // ── GET: read from gist (public — anyone can load the watchlist) ─────────
  if (event.httpMethod === 'GET') {
    const missing = missingEnv('GITHUB_TOKEN', 'GIST_ID');
    if (missing.length) {
      console.error('[data/GET] missing env vars:', missing.join(', '));
      return { statusCode: 200, headers: HEADERS, body: '[]' };
    }

    try {
      const res = await fetch(`${GIST_API}/${process.env.GIST_ID}`, {
        headers: githubHeaders(),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[data/GET] GitHub API error:', res.status, text);
        return { statusCode: 200, headers: HEADERS, body: '[]' };
      }

      const gist = await res.json();
      const content = gist.files?.[FILE_NAME]?.content;
      if (!content) {
        console.warn('[data/GET] file not found in gist, returning []');
        return { statusCode: 200, headers: HEADERS, body: '[]' };
      }

      return { statusCode: 200, headers: HEADERS, body: content };
    } catch (err) {
      console.error('[data/GET] unexpected error:', err.message);
      return { statusCode: 200, headers: HEADERS, body: '[]' };
    }
  }

  // ── POST: write to gist (requires admin credentials) ────────────────────
  if (event.httpMethod === 'POST') {
    // Check required env vars
    const missing = missingEnv('GITHUB_TOKEN', 'GIST_ID', 'ADMIN_USER', 'ADMIN_PASS');
    if (missing.length) {
      return {
        statusCode: 500, headers: HEADERS,
        body: JSON.stringify({ error: `Missing env vars: ${missing.join(', ')}` }),
      };
    }

    // Parse body
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { user, pass, data } = body;

    // Authenticate
    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
      return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    if (!Array.isArray(data)) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: '"data" must be an array' }) };
    }

    // Write to gist
    try {
      const payload = {
        files: {
          [FILE_NAME]: { content: JSON.stringify(data) },
        },
      };

      const res = await fetch(`${GIST_API}/${process.env.GIST_ID}`, {
        method: 'PATCH',
        headers: githubHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[data/POST] GitHub API error:', res.status, text);
        return {
          statusCode: 502, headers: HEADERS,
          body: JSON.stringify({ error: `GitHub API error: ${res.status}` }),
        };
      }

      return {
        statusCode: 200, headers: HEADERS,
        body: JSON.stringify({ ok: true, saved: data.length }),
      };
    } catch (err) {
      console.error('[data/POST] unexpected error:', err.message);
      return {
        statusCode: 500, headers: HEADERS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
