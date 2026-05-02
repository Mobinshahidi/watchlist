// netlify/functions/tmdb.js
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function titleScore(query, candidate) {
  const q = norm(query);
  const c = norm(candidate);
  if (!c) return 0;
  if (q === c) return 1;
  if (c.startsWith(q) || q.startsWith(c)) return 0.85;
  if (c.includes(q) || q.includes(c)) return 0.65;
  const qWords = new Set(q.split(' '));
  const cWords = c.split(' ');
  const overlap = cWords.filter(w => qWords.has(w)).length;
  return (overlap / Math.max(qWords.size, cWords.length)) * 0.5;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'TMDB_API_KEY not configured.' }) };
  }

  const { title, year, isMovie } = event.queryStringParameters || {};
  if (!title) return { statusCode: 400, body: JSON.stringify({ error: 'Missing param: title' }) };

  try {
    // Try with year first for precision, fall back to without year
    const attempts = year ? [year, null] : [null];
    let results = [];

    for (const attemptYear of attempts) {
      const p = new URLSearchParams({
        api_key: TMDB_API_KEY, query: title,
        include_adult: 'false', language: 'en-US', page: '1'
      });
      if (attemptYear) p.set('year', attemptYear);
      const res = await fetch(`${TMDB_BASE}/search/multi?${p}`);
      if (!res.ok) continue;
      const data = await res.json();
      results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
      if (results.length > 0) break;
    }

    if (results.length === 0) {
      return { statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
        body: JSON.stringify({ id: null }) };
    }

    const wantMovie = isMovie === '1';
    const scored = results.map(r => {
      const ts = titleScore(title, r.title || r.name || '');
      const typeBonus = (wantMovie ? r.media_type === 'movie' : r.media_type === 'tv') ? 0.3 : 0;
      const popScore = Math.min((r.popularity || 0) / 200, 0.2);
      return { r, score: ts + typeBonus + popScore };
    });
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].r;

    const releaseDate = best.release_date || best.first_air_date || '';
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
      body: JSON.stringify({
        id: best.id,
        poster: best.poster_path ? `${POSTER_BASE}${best.poster_path}` : null,
        year: releaseYear,
        title: best.title || best.name || null,
        mediaType: best.media_type,
        overview: (best.overview || '').slice(0, 300) || null,
        genreIds: best.genre_ids || []
      })
    };
  } catch (err) {
    console.error('TMDB proxy error:', err);
    return { statusCode: 502, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch from TMDB.' }) };
  }
};
