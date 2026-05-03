// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const ICONS = {
  sun:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  import: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  export: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  plus:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  logout: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  lock:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  edit:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  close:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  tv:     `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  tv_sm:  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  sync:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
};

// ─── State ────────────────────────────────────────────────────────────────────
let seriesData    = [];
let isLoggedIn    = false;
let isDarkMode    = true;
let currentRating = 0;

// Credentials held in memory for the session (used when POSTing to server)
let _sessionCreds = null;

const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western',
  10759:'Action & Adv.', 10762:'Kids', 10763:'News', 10764:'Reality',
  10765:'Sci-Fi & Fantasy', 10766:'Soap', 10767:'Talk', 10768:'War & Politics',
};

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // 1. Theme — instant, no network
  isDarkMode = localStorage.getItem('wl_theme') !== 'light';
  applyTheme();

  // 2. Render from localStorage immediately so the page is never blank
  const savedRaw = localStorage.getItem('wl_data');
  if (savedRaw) {
    try { seriesData = JSON.parse(savedRaw); } catch { seriesData = []; }
  }
  populateCategories();
  renderHeader();
  filterData();

  // 3. Auth check + server data load in parallel (background)
  const [serverData, loggedIn] = await Promise.all([
    fetchServerData(),
    checkStoredLogin(),
  ]);

  // Prefer server data — it is the authoritative source
  if (serverData && serverData.length > 0) {
    seriesData = serverData;
    localStorage.setItem('wl_data', JSON.stringify(seriesData));
    populateCategories();
    filterData();
  } else if (!savedRaw || seriesData.length === 0) {
    // Last resort: static series.json
    try {
      const res = await fetch('series.json');
      if (res.ok) {
        const fromFile = await res.json();
        if (Array.isArray(fromFile) && fromFile.length > 0) {
          seriesData = fromFile;
          populateCategories();
          filterData();
          localStorage.setItem('wl_data', JSON.stringify(seriesData));
        }
      }
    } catch { /* series.json unavailable */ }
  }

  if (loggedIn !== isLoggedIn) {
    isLoggedIn = loggedIn;
    renderHeader();
    renderGrid();
  }

  // 4. TMDB enrichment — non-blocking
  refreshFromTMDB();
}

// ─── Server persistence ───────────────────────────────────────────────────────
async function fetchServerData() {
  try {
    const res = await fetch('/.netlify/functions/data');
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch { return null; }
}

// Push to server — fire-and-forget with toast feedback
async function pushToServer() {
  if (!isLoggedIn) return;
  const creds = _sessionCreds || getStoredCreds();
  if (!creds) return;

  showToast(ICONS.sync + ' Saving to server…', 'saving', 10000);

  try {
    const res = await fetch('/.netlify/functions/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: creds.u, pass: creds.p, data: seriesData }),
    });
    if (res.ok) {
      const json = await res.json();
      showToast('✓ Saved ' + json.saved + ' titles', 'saved', 2500);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('✗ Save failed: ' + (err.error || res.status), 'error', 4000);
      console.warn('[sync] failed:', res.status, err);
    }
  } catch (err) {
    showToast('✗ Network error — saved locally only', 'error', 4000);
    console.warn('[sync] network error:', err.message);
  }
}

function getStoredCreds() {
  try { return JSON.parse(localStorage.getItem('wl_auth') || 'null'); }
  catch { return null; }
}

function showToast(msg, type = 'info', duration = 2800) {
  // type: 'saving' | 'saved' | 'error'
  let toast = document.getElementById('wl-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wl-toast';
    document.body.appendChild(toast);
  }
  const colors = {
    saving: { bg: '#d57455', text: '#fff' },
    saved:  { bg: '#22c55e', text: '#fff' },
    error:  { bg: '#ef4444', text: '#fff' },
    info:   { bg: '#3b3b3a', text: '#c3c2b7' },
  };
  const c = colors[type] || colors.info;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${c.bg}; color:${c.text};
    padding:10px 18px; border-radius:12px;
    font-size:0.82rem; font-weight:600; font-family:inherit;
    box-shadow:0 4px 20px rgba(0,0,0,0.35);
    display:flex; align-items:center; gap:8px;
    transform:translateY(0); opacity:1;
    transition:opacity 0.35s, transform 0.35s;
    pointer-events:none;
  `;
  toast.innerHTML = msg;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, duration);
}

// ─── saveData: localStorage + server ─────────────────────────────────────────
function saveData() {
  localStorage.setItem('wl_data', JSON.stringify(seriesData));
  pushToServer(); // async, non-blocking
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function verifyCredentials(user, pass) {
  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch { return false; }
}

async function checkStoredLogin() {
  const creds = getStoredCreds();
  if (!creds) return false;
  const ok = await verifyCredentials(creds.u, creds.p);
  if (ok) _sessionCreds = creds;
  return ok;
}

async function login(user, pass) {
  const ok = await verifyCredentials(user, pass);
  if (ok) {
    localStorage.setItem('wl_auth', JSON.stringify({ u: user, p: pass }));
    _sessionCreds = { u: user, p: pass };
    isLoggedIn = true;
    renderHeader();
    filterData();
  }
  return ok;
}

function logout() {
  localStorage.removeItem('wl_auth');
  _sessionCreds = null;
  isLoggedIn = false;
  renderHeader();
  filterData();
}

// ─── TMDB Refresh ─────────────────────────────────────────────────────────────
async function fetchTMDBData(title, year, isMovie) {
  try {
    const p = new URLSearchParams({ title, isMovie: isMovie ? '1' : '0', v: '3' });
    if (year) p.set('year', year);
    const res = await fetch(`/.netlify/functions/tmdb?${p}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function refreshFromTMDB() {
  const needs = seriesData.filter(x =>
    x.title && (!x._tmdbId || !x._overview || !x._genreIds?.length)
  );
  if (!needs.length) return;

  const BATCH = 6, DELAY = 350;
  for (let i = 0; i < needs.length; i += BATCH) {
    const batch = needs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(x => fetchTMDBData(x.title, x.year, x.isMovie)));

    let changed = false;
    results.forEach((d, j) => {
      const item = batch[j];
      if (!d?.id) return;
      item._tmdbId = d.id;
      if (d.poster   && !item.poster)  { item.poster    = d.poster;   changed = true; }
      if (d.year     && !item.year)    { item.year      = d.year;     changed = true; }
      if (d.overview?.trim())          { item._overview = d.overview; changed = true; }
      if (d.genreIds?.length)          { item._genreIds = d.genreIds; changed = true; }
    });

    if (changed) { saveData(); filterData(); }
    if (i + BATCH < needs.length) await new Promise(r => setTimeout(r, DELAY));
  }
}

// ─── Category & genre helpers ─────────────────────────────────────────────────

// Watch-status category derived from playerData
function statusCat(item) {
  const p = item.playerData || {};
  if (item.isMovie || p.isMovie) return 'Movies';
  if (p.finished)                return 'Finished';
  if (p.season && p.season > 1)  return 'Ongoing Series';
  return 'Watching';
}

// Genre names for an item — uses _genreIds first, falls back to exported `genres` array
function itemGenres(item) {
  const fromIds = (item._genreIds || []).map(id => GENRE_MAP[id]).filter(Boolean);
  return fromIds.length ? fromIds : (Array.isArray(item.genres) ? item.genres : []);
}

function assignCategories() {
  seriesData.forEach(item => { item._category = statusCat(item); });
}

// Build the category dropdown with two optgroups: Status and Genre
function populateCategories() {
  assignCategories();

  const genresInUse = new Set();
  seriesData.forEach(item => itemGenres(item).forEach(g => genresInUse.add(g)));

  const sel = document.getElementById('categoryFilter');
  const prev = sel.value;

  sel.innerHTML = '<option value="">All Categories</option>';

  // Status group — only statuses that have ≥1 item
  const usedStatuses = [...new Set(seriesData.map(x => x._category))].sort();
  if (usedStatuses.length) {
    const grp = document.createElement('optgroup');
    grp.label = 'Status';
    usedStatuses.forEach(cat => {
      const o = document.createElement('option');
      o.value = o.textContent = cat;
      grp.appendChild(o);
    });
    sel.appendChild(grp);
  }

  // Genre group — genres that actually appear in the data, sorted A-Z
  if (genresInUse.size) {
    const grp = document.createElement('optgroup');
    grp.label = 'Genre';
    [...genresInUse].sort().forEach(g => {
      const o = document.createElement('option');
      o.value = o.textContent = g;
      grp.appendChild(o);
    });
    sel.appendChild(grp);
  }

  // Restore previous selection if still valid
  if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
}

// ─── Filter & Sort ────────────────────────────────────────────────────────────
function filterData() {
  const q    = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const cat  = document.getElementById('categoryFilter')?.value || '';
  const sort = document.getElementById('sortSelect')?.value || 'name';

  let result = seriesData.filter(item => {
    if (q && !item.title.toLowerCase().includes(q)) return false;
    if (cat) {
      const matchStatus = item._category === cat;
      const matchGenre  = itemGenres(item).includes(cat);
      if (!matchStatus && !matchGenre) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    if (sort === 'name')         return a.title.localeCompare(b.title);
    if (sort === 'year-desc')    return (b.year||0) - (a.year||0);
    if (sort === 'rating-desc')  return (b.rating||0) - (a.rating||0);
    if (sort === 'updated-desc') return new Date(b.playerData?.updatedAt||0) - new Date(a.playerData?.updatedAt||0);
    return 0;
  });

  const countEl = document.getElementById('count');
  if (countEl) countEl.textContent = `${result.length} of ${seriesData.length} titles`;
  renderGrid(result);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('wl_theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
  renderHeader();
}
function applyTheme() { document.body.classList.toggle('light-mode', !isDarkMode); }

// ─── Render Header ────────────────────────────────────────────────────────────
function renderHeader() {
  const c = document.getElementById('headerBtns');
  c.innerHTML = '';

  c.appendChild(mkBtn('btn-icon-sq', isDarkMode ? ICONS.sun : ICONS.moon, toggleTheme,
    isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'));

  if (isLoggedIn) {
    c.appendChild(mkBtn('btn-ghost btn', ICONS.import + ' Import', () => document.getElementById('fileInput').click()));
    c.appendChild(mkBtn('btn-ghost btn', ICONS.export + ' Export', exportFile));
    c.appendChild(mkBtn('btn-accent btn', ICONS.plus + ' Add', openEditModal));
    c.appendChild(mkBtn('btn-ghost btn', ICONS.logout + ' Logout', logout));
  } else {
    c.appendChild(mkBtn('btn-ghost btn', ICONS.export + ' Export', exportFile));
    c.appendChild(mkBtn('btn-accent btn', ICONS.lock + ' Login', showLoginModal));
  }
}

function mkBtn(cls, html, onclick, title) {
  const b = document.createElement('button');
  b.className = cls; b.innerHTML = html; b.onclick = onclick;
  if (title) b.title = title;
  return b;
}

// ─── Grid Render ──────────────────────────────────────────────────────────────
function renderGrid(list = seriesData) {
  const grid = document.getElementById('seriesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">${ICONS.tv}<span>${seriesData.length ? 'No results found.' : 'No titles yet — import or add one!'}</span></div>`;
    return;
  }

  list.forEach(item => {
    const idx = seriesData.indexOf(item);
    const p   = item.playerData || {};
    const badge = item.isMovie
      ? `<span class="badge badge-m">Movie</span>`
      : p.finished ? `<span class="badge badge-f">Finished</span>`
      : `<span class="badge badge-w">S${p.season||1} E${p.episode||0}</span>`;

    const genres   = itemGenres(item).slice(0, 2);
    const genreHtml = genres.length
      ? `<div class="card-genres">${genres.map(g=>`<span class="gtag">${g}</span>`).join('')}</div>` : '';
    const descHtml  = item._overview ? `<p class="card-desc">${esc(item._overview)}</p>` : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="poster-wrap">
        ${item.poster ? `<img src="${esc(item.poster)}" loading="lazy" alt="${esc(item.title)}">` : `<div class="poster-ph">${ICONS.tv_sm}</div>`}
      </div>
      <div class="card-body">
        <p class="card-title">${esc(item.title)}</p>
        <div class="card-meta"><span class="card-year">${item.year||'—'}</span>${badge}</div>
        ${descHtml}${genreHtml}
        <div class="card-stars">${starsHtml(item.rating||0,'0.76rem')}</div>
      </div>`;
    card.onclick = () => openDetailModal(idx);
    grid.appendChild(card);
  });
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function openDetailModal(index) {
  const item = seriesData[index];
  if (!item) return;
  const p = item.playerData || {};

  const badge = item.isMovie
    ? `<span class="badge badge-m">Movie</span>`
    : p.finished ? `<span class="badge badge-f">Finished</span>`
    : `<span class="badge badge-w">Watching — S${p.season||1} E${p.episode||0}</span>`;

  const genres    = itemGenres(item);
  const genreHtml = genres.length
    ? `<div class="det-genres">${genres.map(g=>`<span class="gtag gtag-lg">${g}</span>`).join('')}</div>` : '';

  const adminHtml = isLoggedIn ? `
    <div class="det-actions">
      <button class="btn btn-accent det-btn" onclick="openEditModal(${index})">${ICONS.edit} Edit</button>
      <button class="btn-danger" onclick="confirmDelete(${index})" title="Delete">${ICONS.trash}</button>
    </div>` : '';

  setModal('modal-detail', `
    <div class="det-poster">
      ${item.poster ? `<img src="${esc(item.poster)}" alt="${esc(item.title)}">` : `<div class="det-poster-ph">${ICONS.tv}</div>`}
    </div>
    <div class="det-info">
      <div class="det-head">
        <h2 class="det-title">${esc(item.title)}</h2>
        <button class="btn-close" onclick="closeModal()" title="Close">${ICONS.close}</button>
      </div>
      <div class="det-meta">${item.year?`<span class="det-year">${item.year}</span>`:''} ${badge}</div>
      ${genreHtml}
      <p class="det-desc${item._overview?'':' empty'}">${item._overview?esc(item._overview):'No description available yet.'}</p>
      <div class="det-rating">${starsHtml(item.rating||0,'1.05rem')}<span class="det-rating-lbl">${item.rating?item.rating+'/5':'Not rated'}</span></div>
      ${adminHtml}
    </div>`);
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function openEditModal(index = -1) {
  const item = index >= 0 ? seriesData[index] : {};
  const p    = item.playerData || {};
  currentRating = item.rating || 0;
  const back = index >= 0 ? `openDetailModal(${index})` : 'closeModal()';

  setModal('modal-form', `
    <div class="form-head">
      <h2 class="form-title">${index===-1?'Add New Title':'Edit Title'}</h2>
      <button class="btn-close" onclick="${back}">${ICONS.close}</button>
    </div>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input id="mTitle" value="${esc(item.title||'')}" class="input-field" placeholder="Series or movie title">
    </div>
    <div class="form-group">
      <label class="form-label">Year</label>
      <input id="mYear" type="number" value="${item.year||''}" class="input-field" placeholder="e.g. 2024">
    </div>
    <div class="form-row">
      <label class="form-toggle">
        <label class="ts"><input type="checkbox" id="mMovie" ${item.isMovie?'checked':''} onchange="updateProgress()"><span class="ts-track"></span></label>
        Movie
      </label>
      <label class="form-toggle">
        <label class="ts"><input type="checkbox" id="mFinished" ${p.finished?'checked':''} onchange="updateProgress()"><span class="ts-track"></span></label>
        Finished
      </label>
    </div>
    <div id="progressSection" style="${(p.finished||item.isMovie)?'display:none':''}">
      <div class="form-grid2">
        <div>
          <label class="form-label">Season</label>
          <input id="mSeason" type="number" min="1" value="${p.season||1}" class="input-field">
        </div>
        <div>
          <label class="form-label">Episode</label>
          <input id="mEpisode" type="number" min="0" value="${p.episode||0}" class="input-field">
        </div>
      </div>
    </div>
    <label class="form-label">My Rating</label>
    <div class="stars-row" id="starRow">
      ${[1,2,3,4,5].map(n=>`<button class="star-btn${n<=currentRating?' on':''}" onmouseover="previewRating(${n})" onmouseleave="renderStars()" onclick="setRating(${n})">★</button>`).join('')}
    </div>
    <div class="rating-hint" id="ratingLabel">${currentRating?currentRating+' / 5':'Not rated'}</div>
    <div class="form-actions">
      <button class="btn btn-accent" onclick="saveModal(${index})">Save</button>
      <button class="btn btn-ghost" onclick="${back}">Cancel</button>
    </div>`);
}

function updateProgress() {
  const hide = document.getElementById('mMovie').checked || document.getElementById('mFinished').checked;
  document.getElementById('progressSection').style.display = hide ? 'none' : '';
}
function previewRating(n) {
  document.querySelectorAll('.star-btn').forEach((b,i)=>b.classList.toggle('on',i<n));
  document.getElementById('ratingLabel').textContent = n+' / 5';
}
function setRating(n)  { currentRating=n; renderStars(); }
function renderStars() {
  document.querySelectorAll('.star-btn').forEach((b,i)=>b.classList.toggle('on',i<currentRating));
  document.getElementById('ratingLabel').textContent = currentRating?currentRating+' / 5':'Not rated';
}

function saveModal(index) {
  const title = document.getElementById('mTitle').value.trim();
  if (!title) { alert('Please enter a title.'); return; }

  const isMovie  = document.getElementById('mMovie').checked;
  const finished = document.getElementById('mFinished').checked;
  const season   = parseInt(document.getElementById('mSeason')?.value)||1;
  const episode  = parseInt(document.getElementById('mEpisode')?.value)||0;
  const year     = parseInt(document.getElementById('mYear').value)||null;

  const base = index>=0 ? seriesData[index] : {id:'user_'+Date.now()};
  const newItem = {
    ...base, title, year, rating:currentRating, isMovie,
    playerData:{...(base.playerData||{}), finished, season, episode, updatedAt:new Date().toISOString()},
  };

  newItem._category = statusCat(newItem);

  // Clear TMDB cache if title changed
  if (index>=0 && seriesData[index].title !== title) {
    delete newItem._tmdbId; delete newItem.poster;
    delete newItem._overview; delete newItem._genreIds; delete newItem.genres;
  }

  if (index>=0) seriesData[index]=newItem; else seriesData.push(newItem);
  saveData(); // writes localStorage + pushes to server
  populateCategories();
  filterData();
  if (index>=0) openDetailModal(index); else closeModal();
}

function confirmDelete(index) {
  if (!confirm(`Delete "${seriesData[index].title}"?`)) return;
  seriesData.splice(index,1);
  saveData(); // writes localStorage + pushes to server
  closeModal(); populateCategories(); filterData();
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function showLoginModal() {
  setModal('modal-form', `
    <div class="form-head">
      <h2 class="form-title">Login</h2>
      <button class="btn-close" onclick="closeModal()">${ICONS.close}</button>
    </div>
    <div class="login-err" id="loginErr">❌ Wrong username or password.</div>
    <div class="form-group">
      <label class="form-label">Username</label>
      <input id="lUser" class="input-field" placeholder="Username" onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input id="lPass" type="password" class="input-field" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <div class="form-actions">
      <button class="btn btn-accent" onclick="doLogin()" id="loginBtn">Login</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    </div>`);
  setTimeout(()=>document.getElementById('lUser')?.focus(), 80);
}

async function doLogin() {
  const u = document.getElementById('lUser').value.trim();
  const p = document.getElementById('lPass').value;
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled=true; btn.textContent='Checking…'; }
  const ok = await login(u,p);
  if (ok) { closeModal(); }
  else {
    document.getElementById('loginErr').style.display='block';
    document.getElementById('lPass').value='';
    if (btn) { btn.disabled=false; btn.textContent='Login'; }
  }
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function setModal(cls, html) {
  const mc = document.getElementById('modalContent');
  mc.className = cls; mc.innerHTML = html;
  document.getElementById('modal').classList.add('active');
}
function closeModal() { document.getElementById('modal').classList.remove('active'); }
function handleOverlayClick(e) { if (e.target===document.getElementById('modal')) closeModal(); }

// ─── Import / Export ──────────────────────────────────────────────────────────
function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error();
      seriesData = imported;
      seriesData.forEach(x => { x._category = statusCat(x); });
      saveData(); // localStorage + server
      populateCategories(); filterData();
      alert(`✅ Imported ${imported.length} titles.`);
      refreshFromTMDB();
    } catch { alert('❌ Invalid JSON file.'); }
  };
  reader.readAsText(file);
  event.target.value='';
}

function exportFile() {
  const exportData = seriesData.map(item => ({
    ...item,
    genres: itemGenres(item), // always fresh from _genreIds
  }));
  const blob = new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='series.json'; a.click();
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function starsHtml(rating, size='0.9rem') {
  const full = Math.round(rating);
  return Array(5).fill(0).map((_,i)=>
    `<span style="font-size:${size};color:${i<full?'#f5c518':'var(--border)'}">★</span>`
  ).join('');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
