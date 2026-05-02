// netlify/functions/tmdb.js
// Proxies TMDB searches so the API key never touches the browser.
// Set TMDB_API_KEY in Netlify → Site settings → Environment variables
// (or in a .env file when running locally with `netlify dev`).
//
// Query params:
//   title   (required) – show/movie title to search
//   year    (optional) – release year to help narrow results
//   isMovie (optional) – '1' to bias toward movies, '0' for TV

const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY environment variable is not set.');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'TMDB API key not configured.' })
    };
  }

  const { title, year, isMovie } = event.queryStringParameters || {};
  if (!title) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required param: title' })
    };
  }

  try {
    // Use /search/multi to handle both movies and TV in one call
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      include_adult: 'false',
      language: 'en-US',
      page: '1'
    });
    if (year) searchParams.set('year', year);

    const searchRes = await fetch(`${TMDB_BASE}/search/multi?${searchParams}`);
    if (!searchRes.ok) {
      throw new Error(`TMDB search failed: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const results = (searchData.results || []).filter(r =>
      r.media_type === 'movie' || r.media_type === 'tv'
    );

    if (results.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
        body: JSON.stringify({ id: null, poster: null, year: null })
      };
    }

    // Prefer the type matching isMovie flag, fallback to first result
    const wantMovie = isMovie === '1';
    const best =
      results.find(r => wantMovie ? r.media_type === 'movie' : r.media_type === 'tv') ||
      results[0];

    const releaseDate = best.release_date || best.first_air_date || '';
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
    const poster = best.poster_path ? `${POSTER_BASE}${best.poster_path}` : null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache TMDB results for 24 h to avoid hammering the API on every reload
        'Cache-Control': 'public, max-age=86400'
      },
      body: JSON.stringify({
        id: best.id,
        poster,
        year: releaseYear,
        title: best.title || best.name || null,
        mediaType: best.media_type
      })
    };
  } catch (err) {
    console.error('TMDB proxy error:', err);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch from TMDB.' })
    };
  }
};
