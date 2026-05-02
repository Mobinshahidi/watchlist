// ─── State ────────────────────────────────────────────────────────────────────
let seriesData = [];
let isLoggedIn = false;
let isDarkMode = true;
let currentRating = 0;

const GENRE_MAP = {
  28:'Action',12:'Adventure',16:'Animation',35:'Comedy',80:'Crime',
  99:'Documentary',18:'Drama',10751:'Family',14:'Fantasy',36:'History',
  27:'Horror',10402:'Music',9648:'Mystery',10749:'Romance',878:'Sci-Fi',
  10770:'TV Movie',53:'Thriller',10752:'War',37:'Western',
  10759:'Action & Adv.',10762:'Kids',10763:'News',10764:'Reality',
  10765:'Sci-Fi & Fantasy',10766:'Soap',10767:'Talk',10768:'War & Politics'
};

// ─── Init ─────────────────────────────────────────────────────────────────────
// Key fix: render data FIRST from localStorage (sync), auth check in background.
// This prevents the blank-page-on-refresh bug.
async function init() {
  // 1. Theme — instant, no network
  isDarkMode = localStorage.getItem('wl_theme') !== 'light';
  applyTheme();

  // 2. Load data from localStorage immediately so the grid renders right away
  const savedRaw = localStorage.getItem('wl_data');
  if (savedRaw) {
    try { seriesData = JSON.parse(savedRaw); } catch { seriesData = []; }
  }

  // 3. Render the page with current data + isLoggedIn=false header
  populateCategories();
  renderHeader();
  filterData(); // grid renders here — no waiting for network

  // 4. Auth check in background — updates header/edit buttons when done
  checkStoredLogin().then(ok => {
    if (ok !== isLoggedIn) {
      isLoggedIn = ok;
      renderHeader();
      renderGrid(); // refresh so edit button appears on cards
    }
  });

  // 5. If no localStorage data, load from series.json
  if (!savedRaw || seriesData.length === 0) {
    try {
      const res = await fetch('series.json');
      if (res.ok) {
        const fromFile = await res.json();
        if (Array.isArray(fromFile) && fromFile.length > 0) {
          seriesData = fromFile;
          populateCategories();
          filterData();
          saveData();
        }
      }
    } catch { /* series.json not available */ }
  }

  // 6. TMDB enrichment in background (non-blocking)
  refreshFromTMDB();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function verifyCredentials(user, pass) {
  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch { return false; }
}

async function checkStoredLogin() {
  const stored = localStorage.getItem('wl_auth');
  if (!stored) return false;
  try {
    const { u, p } = JSON.parse(stored);
    return await verifyCredentials(u, p);
  } catch { return false; }
}

async function login(user, pass) {
  const ok = await verifyCredentials(user, pass);
  if (ok) {
    localStorage.setItem('wl_auth', JSON.stringify({ u: user, p: pass }));
    isLoggedIn = true;
    renderHeader();
    filterData();
  }
  return ok;
}

function logout() {
  localStorage.removeItem('wl_auth');
  isLoggedIn = false;
  renderHeader();
  filterData();
}

// ─── TMDB Refresh ─────────────────────────────────────────────────────────────
async function fetchTMDBData(title, year, isMovie) {
  try {
    const params = new URLSearchParams({
      title,
      isMovie: isMovie ? '1' : '0',
      v: '3' // cache-bust: increment when tmdb.js response shape changes
    });
    if (year) params.set('year', year);
    const res = await fetch(`/.netlify/functions/tmdb?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function refreshFromTMDB() {
  // Re-fetch any item missing overview or genres (even if _tmdbId is set —
  // older cached responses didn't include those fields)
  const needsFetch = seriesData.filter(item =>
    item.title && (!item._tmdbId || !item._overview || !item._genreIds?.length)
  );
  if (needsFetch.length === 0) return;

  const BATCH = 6;
  const DELAY = 350;

  for (let i = 0; i < needsFetch.length; i += BATCH) {
    const batch = needsFetch.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(item => fetchTMDBData(item.title, item.year, item.isMovie))
    );

    let changed = false;
    results.forEach((data, j) => {
      const item = batch[j];
      if (!data?.id) return;
      item._tmdbId = data.id;
      if (data.poster   && !item.poster)        { item.poster    = data.poster;    changed = true; }
      if (data.year     && !item.year)           { item.year      = data.year;      changed = true; }
      if (data.overview?.trim())                 { item._overview = data.overview;  changed = true; }
      if (data.genreIds?.length)                 { item._genreIds = data.genreIds;  changed = true; }
    });

    if (changed) { saveData(); filterData(); }
    if (i + BATCH < needsFetch.length) await new Promise(r => setTimeout(r, DELAY));
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
function assignCategories() {
  seriesData.forEach(item => {
    if (item._category) return;
    const p = item.playerData || {};
    if (item.isMovie)      item._category = 'Movies';
    else if (p.finished)   item._category = 'Finished';
    else if (p.season > 1) item._category = 'Ongoing';
    else                   item._category = 'Watching';
  });
}

function populateCategories() {
  assignCategories();
  const cats = [...new Set(seriesData.map(x => x._category).filter(Boolean))].sort();
  const sel = document.getElementById('categoryFilter');
  const prev = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
  // Restore previously selected category if still valid
  if (prev && cats.includes(prev)) sel.value = prev;
}

// ─── Render Header ────────────────────────────────────────────────────────────
function renderHeader() {
  const container = document.getElementById('headerBtns');
  container.innerHTML = '';

  const themeBtn = el('button', 'btn-icon', `<i class="fas fa-${isDarkMode ? 'sun' : 'moon'}"></i>`);
  themeBtn.title = 'Toggle theme';
  themeBtn.onclick = toggleTheme;
  container.appendChild(themeBtn);

  if (isLoggedIn) {
    const importBtn = el('button', 'btn-secondary', '<i class="fas fa-file-import mr-icon"></i>Import');
    importBtn.onclick = () => document.getElementById('fileInput').click();
    container.appendChild(importBtn);
    container.appendChild(makeExportBtn());
    const addBtn = el('button', 'btn-primary', '+ Add');
    addBtn.onclick = () => openEditModal();
    container.appendChild(addBtn);
    const logoutBtn = el('button', 'btn-secondary', '<i class="fas fa-sign-out-alt mr-icon"></i>Logout');
    logoutBtn.onclick = logout;
    container.appendChild(logoutBtn);
  } else {
    container.appendChild(makeExportBtn());
    const loginBtn = el('button', 'btn-primary', '<i class="fas fa-lock mr-icon"></i>Login');
    loginBtn.onclick = showLoginModal;
    container.appendChild(loginBtn);
  }
}

function makeExportBtn() {
  const btn = el('button', 'btn-secondary', '<i class="fas fa-file-export mr-icon"></i>Export');
  btn.onclick = exportFile;
  return btn;
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  e.className = cls; e.innerHTML = html; return e;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('wl_theme', isDarkMode ? 'dark' : 'light');
  applyTheme(); renderHeader();
}
function applyTheme() { document.body.classList.toggle('light-mode', !isDarkMode); }

// ─── Filter & Sort ────────────────────────────────────────────────────────────
function filterData() {
  const q   = (document.getElementById('searchInput')?.value   || '').toLowerCase().trim();
  const cat = document.getElementById('categoryFilter')?.value  || '';
  const sort= document.getElementById('sortSelect')?.value      || 'name';

  let result = seriesData.filter(item => {
    const matchSearch = !q   || item.title.toLowerCase().includes(q);
    const matchCat    = !cat || item._category === cat;
    return matchSearch && matchCat;
  });

  result = [...result].sort((a, b) => {
    if (sort === 'name')         return a.title.localeCompare(b.title);
    if (sort === 'year-desc')    return (b.year||0) - (a.year||0);
    if (sort === 'rating-desc')  return (b.rating||0) - (a.rating||0);
    if (sort === 'updated-desc')
      return new Date(b.playerData?.updatedAt||0) - new Date(a.playerData?.updatedAt||0);
    return 0;
  });

  const countEl = document.getElementById('count');
  if (countEl) countEl.textContent = `${result.length} of ${seriesData.length} titles`;

  renderGrid(result);
}

// ─── Grid Render ──────────────────────────────────────────────────────────────
function renderGrid(list = seriesData) {
  const grid = document.getElementById('seriesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-tv" style="font-size:3rem;opacity:0.2;display:block;margin-bottom:16px"></i>
      ${seriesData.length === 0 ? 'No titles yet. Import or add one!' : 'No results found.'}
    </div>`;
    return;
  }

  list.forEach(item => {
    const idx = seriesData.indexOf(item);
    const p = item.playerData || {};

    let badgeHtml = item.isMovie
      ? `<span class="badge badge-movie">Movie</span>`
      : p.finished
        ? `<span class="badge badge-finished">Finished</span>`
        : `<span class="badge badge-watching">S${p.season||1} E${p.episode||0}</span>`;

    const stars = Array(5).fill(0).map((_,n) =>
      `<span style="color:${n < Math.floor(item.rating||0) ? '#f5c518' : 'var(--border)'}">★</span>`
    ).join('');

    const genres = (item._genreIds||[]).slice(0,2).map(id=>GENRE_MAP[id]).filter(Boolean);
    const genresHtml = genres.length
      ? `<div class="card-genres">${genres.map(g=>`<span class="genre-tag">${g}</span>`).join('')}</div>`
      : '';

    const descHtml = item._overview
      ? `<p class="card-desc">${escHtml(item._overview)}</p>`
      : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="poster-container">
        ${item.poster
          ? `<img src="${item.poster}" loading="lazy" alt="${escHtml(item.title)}">`
          : `<div class="poster-placeholder"><i class="fas fa-tv"></i></div>`}
      </div>
      <div class="card-body">
        <div class="card-title">${escHtml(item.title)}</div>
        <div class="card-meta">
          <span class="card-year">${item.year||'—'}</span>
          ${badgeHtml}
        </div>
        ${descHtml}
        ${genresHtml}
        <div class="card-stars">${stars}</div>
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

  const statusHtml = item.isMovie
    ? `<span class="badge badge-movie">Movie</span>`
    : p.finished
      ? `<span class="badge badge-finished">Finished</span>`
      : `<span class="badge badge-watching">Watching — S${p.season||1} E${p.episode||0}</span>`;

  const ratingStars = Array(5).fill(0).map((_,n)=>
    `<span style="font-size:1.15rem;color:${n < Math.floor(item.rating||0) ? '#f5c518' : 'var(--border)'}">★</span>`
  ).join('');
  const ratingText = item.rating ? `${item.rating} / 5` : 'Not rated';

  const genres = (item._genreIds||[]).map(id=>GENRE_MAP[id]).filter(Boolean);
  const genresHtml = genres.length
    ? `<div class="detail-genres">${genres.map(g=>`<span class="genre-tag genre-tag-lg">${g}</span>`).join('')}</div>`
    : '';

  const overview = item._overview
    ? `<p class="detail-overview">${escHtml(item._overview)}</p>`
    : `<p class="detail-overview no-desc">No description available yet.</p>`;

  // Admin actions
  const adminHtml = isLoggedIn ? `
    <div class="detail-actions">
      <button onclick="openEditModal(${index})" class="btn-primary detail-btn">
        <i class="fas fa-pen" style="margin-right:6px"></i>Edit
      </button>
      <button onclick="confirmDelete(${index})" class="btn-danger-sm" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>` : '';

  document.getElementById('modalContent').className = 'modal-box-detail';
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-layout">
      <div class="detail-poster-wrap">
        ${item.poster
          ? `<img src="${item.poster}" class="detail-poster-img" alt="${escHtml(item.title)}">`
          : `<div class="detail-poster-placeholder"><i class="fas fa-tv"></i></div>`}
      </div>
      <div class="detail-info">
        <div class="detail-header">
          <h2 class="detail-title">${escHtml(item.title)}</h2>
          <button onclick="closeModal()" class="btn-close-x" title="Close">✕</button>
        </div>
        <div class="detail-meta">
          ${item.year ? `<span class="detail-year">${item.year}</span>` : ''}
          ${statusHtml}
        </div>
        ${genresHtml}
        ${overview}
        <div class="detail-rating">
          ${ratingStars}
          <span class="rating-label">${ratingText}</span>
        </div>
        ${adminHtml}
      </div>
    </div>`;

  document.getElementById('modal').classList.add('active');
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function openEditModal(index = -1) {
  const item = index >= 0 ? seriesData[index] : {};
  const p = item.playerData || {};
  currentRating = item.rating || 0;

  const backAction = index >= 0 ? `openDetailModal(${index})` : 'closeModal()';

  document.getElementById('modalContent').className = 'modal-box-form';
  document.getElementById('modalContent').innerHTML = `
    <div class="edit-header">
      <h2 class="edit-title">${index === -1 ? 'Add New Title' : 'Edit Title'}</h2>
      <button onclick="${backAction}" class="btn-close-x" title="Close">✕</button>
    </div>

    <label class="form-label">Title</label>
    <input id="mTitle" value="${escHtml(item.title||'')}" class="input-field" placeholder="Series or movie title" style="margin-bottom:14px">

    <label class="form-label">Year</label>
    <input id="mYear" type="number" value="${item.year||''}" class="input-field" placeholder="e.g. 2024" style="margin-bottom:16px">

    <div class="toggle-row">
      <label class="toggle-label">
        <label class="toggle-switch"><input type="checkbox" id="mMovie" ${item.isMovie?'checked':''} onchange="updateProgressSection()"><span class="toggle-track"></span></label>
        Movie
      </label>
      <label class="toggle-label">
        <label class="toggle-switch"><input type="checkbox" id="mFinished" ${p.finished?'checked':''} onchange="updateProgressSection()"><span class="toggle-track"></span></label>
        Finished
      </label>
    </div>

    <div id="progressSection" style="${(p.finished||item.isMovie)?'display:none':''}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
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
    <div class="star-row" id="starRow">
      ${[1,2,3,4,5].map(n=>`
        <button class="star-btn ${n<=Math.floor(currentRating)?'active':''}"
          onmouseover="previewRating(${n})" onmouseleave="renderStars()" onclick="setRating(${n})">★</button>
      `).join('')}
    </div>
    <div id="ratingLabel" class="rating-hint">${currentRating>0?currentRating+' / 5':'Not rated'}</div>

    <div class="edit-actions">
      <button onclick="saveModal(${index})" class="btn-primary" style="flex:1;padding:12px">Save</button>
      <button onclick="${backAction}" class="btn-secondary" style="flex:1;padding:12px">Cancel</button>
    </div>`;

  document.getElementById('modal').classList.add('active');
}

function updateProgressSection() {
  const hide = document.getElementById('mMovie').checked || document.getElementById('mFinished').checked;
  document.getElementById('progressSection').style.display = hide ? 'none' : '';
}
function previewRating(n) {
  document.querySelectorAll('.star-btn').forEach((b,i)=>b.classList.toggle('active',i<n));
  document.getElementById('ratingLabel').textContent = n+' / 5';
}
function setRating(n) { currentRating=n; renderStars(); }
function renderStars() {
  document.querySelectorAll('.star-btn').forEach((b,i)=>b.classList.toggle('active',i<currentRating));
  document.getElementById('ratingLabel').textContent = currentRating>0?currentRating+' / 5':'Not rated';
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
    playerData:{...(base.playerData||{}), finished, season, episode, updatedAt:new Date().toISOString()}
  };

  delete newItem._category;
  if (isMovie)       newItem._category='Movies';
  else if (finished) newItem._category='Finished';
  else if (season>1) newItem._category='Ongoing';
  else               newItem._category='Watching';

  if (index>=0 && seriesData[index].title!==title) {
    delete newItem._tmdbId; delete newItem.poster;
    delete newItem._overview; delete newItem._genreIds;
  }

  if (index>=0) seriesData[index]=newItem;
  else seriesData.push(newItem);

  saveData(); populateCategories(); filterData();
  if (index>=0) openDetailModal(index); else closeModal();
}

function confirmDelete(index) {
  if (!confirm(`Delete "${seriesData[index].title}"?`)) return;
  seriesData.splice(index,1);
  saveData(); closeModal(); populateCategories(); filterData();
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }
function handleOverlayClick(e) { if (e.target===document.getElementById('modal')) closeModal(); }

// ─── Login Modal ──────────────────────────────────────────────────────────────
function showLoginModal() {
  document.getElementById('modalContent').className = 'modal-box-form';
  document.getElementById('modalContent').innerHTML = `
    <div class="edit-header">
      <h2 class="edit-title">Login</h2>
      <button onclick="closeModal()" class="btn-close-x">✕</button>
    </div>
    <div id="loginError" style="display:none;background:rgba(239,68,68,0.1);color:#ef4444;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:0.85rem">
      ❌ Wrong username or password.
    </div>
    <label class="form-label">Username</label>
    <input id="lUser" class="input-field" placeholder="Username" style="margin-bottom:12px" onkeydown="if(event.key==='Enter')doLogin()">
    <label class="form-label">Password</label>
    <input id="lPass" type="password" class="input-field" placeholder="Password" style="margin-bottom:20px" onkeydown="if(event.key==='Enter')doLogin()">
    <div style="display:flex;gap:10px">
      <button onclick="doLogin()" class="btn-primary" style="flex:1;padding:12px" id="loginBtn">Login</button>
      <button onclick="closeModal()" class="btn-secondary" style="flex:1;padding:12px">Cancel</button>
    </div>`;
  document.getElementById('modal').classList.add('active');
  setTimeout(()=>document.getElementById('lUser')?.focus(),100);
}

async function doLogin() {
  const u = document.getElementById('lUser').value.trim();
  const p = document.getElementById('lPass').value;
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled=true; btn.textContent='Checking…'; }
  const ok = await login(u,p);
  if (ok) { closeModal(); }
  else {
    document.getElementById('loginError').style.display='block';
    document.getElementById('lPass').value='';
    if (btn) { btn.disabled=false; btn.textContent='Login'; }
  }
}

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
      seriesData.forEach(x => { delete x._category; });
      saveData(); populateCategories(); filterData();
      alert(`✅ Imported ${imported.length} titles.`);
      refreshFromTMDB();
    } catch { alert('❌ Invalid JSON file.'); }
  };
  reader.readAsText(file);
  event.target.value='';
}

function exportFile() {
  const blob = new Blob([JSON.stringify(seriesData,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download='series.json'; a.click();
}

function saveData() { localStorage.setItem('wl_data',JSON.stringify(seriesData)); }

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
