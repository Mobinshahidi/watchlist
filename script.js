// ─── State ────────────────────────────────────────────────────────────────────
let seriesData = [];
let isLoggedIn = false;
let isDarkMode = true;
let currentRating = 0;

// ─── Auth (server-side via Netlify Function — no credentials in client code) ──
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
  } catch {
    // If running without Netlify (e.g. plain file:// or non-netlify server)
    console.warn('Auth function unavailable. Run via `netlify dev` for local auth.');
    return false;
  }
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
    renderGrid();
  }
  return ok;
}

function logout() {
  localStorage.removeItem('wl_auth');
  isLoggedIn = false;
  renderHeader();
  renderGrid();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // Theme
  const storedTheme = localStorage.getItem('wl_theme');
  isDarkMode = storedTheme !== 'light';
  applyTheme();

  // Check stored login
  isLoggedIn = await checkStoredLogin();

  // Load data
  try {
    const res = await fetch('series.json');
    const fromFile = await res.json();
    const saved = localStorage.getItem('wl_data');
    seriesData = saved ? JSON.parse(saved) : fromFile;
  } catch (e) {
    const saved = localStorage.getItem('wl_data');
    seriesData = saved ? JSON.parse(saved) : [];
  }

  populateCategories();
  renderHeader();
  filterData();

  // Refresh metadata from TMDB for items that haven't been fetched yet
  refreshFromTMDB();
}

// ─── TMDB Refresh ─────────────────────────────────────────────────────────────
async function fetchTMDBData(title, year, isMovie) {
  try {
    const params = new URLSearchParams({ title, isMovie: isMovie ? '1' : '0' });
    if (year) params.set('year', year);
    const res = await fetch(`/.netlify/functions/tmdb?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function refreshFromTMDB() {
  // Only fetch for items that haven't been matched to TMDB yet
  const needsFetch = seriesData.filter(item => !item._tmdbId && item.title);
  if (needsFetch.length === 0) return;

  let changed = false;
  for (const item of needsFetch) {
    const data = await fetchTMDBData(item.title, item.year, item.isMovie);
    if (data && data.id) {
      item._tmdbId = data.id;
      // Only overwrite poster if item doesn't have one already
      if (data.poster && !item.poster) {
        item.poster = data.poster;
        changed = true;
      }
      // Only overwrite year if missing
      if (data.year && !item.year) {
        item.year = data.year;
        changed = true;
      }
      if (data.poster || data.year) changed = true;
    }
    // Respect TMDB rate limits (~40 req/10s)
    await new Promise(r => setTimeout(r, 260));
  }

  if (changed) {
    saveData();
    filterData(); // re-render with updated posters
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
function assignCategories() {
  seriesData.forEach(item => {
    if (item._category) return;
    const p = item.playerData || {};
    if (item.isMovie) {
      item._category = 'Movies';
    } else if (p.finished) {
      item._category = 'Finished';
    } else if (p.season > 1) {
      item._category = 'Ongoing';
    } else {
      item._category = 'Watching';
    }
  });
}

function populateCategories() {
  assignCategories();
  const cats = [...new Set(seriesData.map(x => x._category).filter(Boolean))].sort();
  const sel = document.getElementById('categoryFilter');
  while (sel.options.length > 1) sel.remove(1);
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
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
    const importBtn = el('button', 'btn-secondary', '<i class="fas fa-file-import" style="margin-right:6px"></i>Import');
    importBtn.onclick = () => document.getElementById('fileInput').click();
    container.appendChild(importBtn);

    container.appendChild(makeExportBtn());

    const addBtn = el('button', 'btn-primary', '+ Add Series');
    addBtn.onclick = () => openModal();
    container.appendChild(addBtn);

    const logoutBtn = el('button', 'btn-secondary', '<i class="fas fa-sign-out-alt" style="margin-right:6px"></i>Logout');
    logoutBtn.onclick = logout;
    container.appendChild(logoutBtn);
  } else {
    container.appendChild(makeExportBtn());
    const loginBtn = el('button', 'btn-primary', '<i class="fas fa-lock" style="margin-right:6px"></i>Login');
    loginBtn.onclick = showLoginModal;
    container.appendChild(loginBtn);
  }
}

function makeExportBtn() {
  const btn = el('button', 'btn-secondary', '<i class="fas fa-file-export" style="margin-right:6px"></i>Export');
  btn.onclick = exportFile;
  return btn;
}

function el(tag, className, html) {
  const e = document.createElement(tag);
  e.className = className;
  e.innerHTML = html;
  return e;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('wl_theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
  renderHeader();
}

function applyTheme() {
  document.body.classList.toggle('light-mode', !isDarkMode);
}

// ─── Grid Render ──────────────────────────────────────────────────────────────
function renderGrid(list = seriesData) {
  const grid = document.getElementById('seriesGrid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-tv" style="font-size:3rem;opacity:0.2;display:block;margin-bottom:16px"></i>
      No series found.
    </div>`;
    return;
  }

  list.forEach((item) => {
    const realIdx = seriesData.indexOf(item);
    const p = item.playerData || {};
    const finished = p.finished;
    const isMovie = item.isMovie;

    let badgeHtml = '';
    if (isMovie) badgeHtml = `<span class="badge badge-movie">Movie</span>`;
    else if (finished) badgeHtml = `<span class="badge badge-finished">Finished</span>`;
    else badgeHtml = `<span class="badge badge-watching">S${p.season||1} E${p.episode||0}</span>`;

    const stars = Array(5).fill(0).map((_,n) =>
      `<span style="color:${n < Math.floor(item.rating||0) ? '#f5c518' : 'var(--border)'}">★</span>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="poster-container" style="background:var(--input-bg);overflow:hidden">
        ${item.poster
          ? `<img src="${item.poster}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:var(--text-muted)">📺</div>`
        }
      </div>
      <div style="padding:12px">
        <div style="font-weight:700;font-size:0.9rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px">${item.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px">${item.year || '—'}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          ${badgeHtml}
          <span style="font-size:0.9rem">${stars}</span>
        </div>
      </div>
    `;
    if (isLoggedIn) {
      card.onclick = () => openModal(realIdx);
    }
    grid.appendChild(card);
  });
}

// ─── Filter & Sort ────────────────────────────────────────────────────────────
function filterData() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const cat = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortSelect').value;

  let result = seriesData.filter(item => {
    const matchSearch = !q || item.title.toLowerCase().includes(q);
    const matchCat = !cat || item._category === cat;
    return matchSearch && matchCat;
  });

  result = [...result].sort((a, b) => {
    if (sort === 'name') return a.title.localeCompare(b.title);
    if (sort === 'year-desc') return (b.year||0) - (a.year||0);
    if (sort === 'rating-desc') return (b.rating||0) - (a.rating||0);
    if (sort === 'updated-desc') {
      const da = new Date(a.playerData?.updatedAt || 0);
      const db = new Date(b.playerData?.updatedAt || 0);
      return db - da;
    }
    return 0;
  });

  document.getElementById('count').textContent =
    `${result.length} of ${seriesData.length} titles`;

  renderGrid(result);
}

// ─── Edit / Add Modal ─────────────────────────────────────────────────────────
function openModal(index = -1) {
  const item = index >= 0 ? seriesData[index] : {};
  const p = item.playerData || {};
  currentRating = item.rating || 0;

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-size:1.3rem;font-weight:700;color:var(--text)">${index === -1 ? 'Add New Title' : 'Edit Title'}</h2>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer">✕</button>
    </div>

    <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Title</label>
    <input id="mTitle" value="${escHtml(item.title||'')}" class="input-field" placeholder="Series or movie title" style="margin-bottom:14px">

    <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Year</label>
    <input id="mYear" type="number" value="${item.year||''}" class="input-field" placeholder="e.g. 2024" style="margin-bottom:14px">

    <div style="display:flex;gap:24px;margin-bottom:16px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem">
        <label class="toggle-switch">
          <input type="checkbox" id="mMovie" ${item.isMovie ? 'checked' : ''} onchange="updateProgressSection()">
          <span class="toggle-track"></span>
        </label>
        Movie
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem">
        <label class="toggle-switch">
          <input type="checkbox" id="mFinished" ${p.finished ? 'checked' : ''} onchange="updateProgressSection()">
          <span class="toggle-track"></span>
        </label>
        Finished
      </label>
    </div>

    <div id="progressSection" style="${(p.finished || item.isMovie) ? 'display:none' : ''}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div>
          <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Season</label>
          <input id="mSeason" type="number" min="1" value="${p.season||1}" class="input-field">
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Episode</label>
          <input id="mEpisode" type="number" min="0" value="${p.episode||0}" class="input-field">
        </div>
      </div>
    </div>

    <label style="display:block;margin-bottom:8px;font-size:0.82rem;color:var(--text-muted)">My Rating</label>
    <div class="star-row" id="starRow">
      ${[1,2,3,4,5].map(n => `
        <button class="star-btn ${n <= Math.floor(currentRating) ? 'active' : ''}"
          onmouseover="previewRating(${n})"
          onmouseleave="renderStars()"
          onclick="setRating(${n})"
        >★</button>
      `).join('')}
    </div>
    <div id="ratingLabel" style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;margin-bottom:20px">${currentRating > 0 ? currentRating + ' / 5' : 'Not rated'}</div>

    <div style="display:flex;gap:10px">
      <button onclick="saveModal(${index})" class="btn-primary" style="flex:1;padding:12px">Save</button>
      ${index >= 0 ? `<button onclick="deleteItem(${index})" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px 16px;cursor:pointer;font-weight:600">Delete</button>` : ''}
      <button onclick="closeModal()" class="btn-secondary" style="flex:1;padding:12px">Cancel</button>
    </div>
  `;

  document.getElementById('modal').classList.add('active');
}

function updateProgressSection() {
  const isMovie = document.getElementById('mMovie').checked;
  const finished = document.getElementById('mFinished').checked;
  const sec = document.getElementById('progressSection');
  sec.style.display = (isMovie || finished) ? 'none' : '';
}

function previewRating(n) {
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i < n);
  });
  document.getElementById('ratingLabel').textContent = n + ' / 5';
}

function setRating(n) {
  currentRating = n;
  renderStars();
}

function renderStars() {
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i < currentRating);
  });
  document.getElementById('ratingLabel').textContent =
    currentRating > 0 ? currentRating + ' / 5' : 'Not rated';
}

function saveModal(index) {
  const title = document.getElementById('mTitle').value.trim();
  if (!title) { alert('Please enter a title.'); return; }

  const isMovie = document.getElementById('mMovie').checked;
  const finished = document.getElementById('mFinished').checked;
  const season = parseInt(document.getElementById('mSeason')?.value) || 1;
  const episode = parseInt(document.getElementById('mEpisode')?.value) || 0;
  const year = parseInt(document.getElementById('mYear').value) || null;

  const newItem = {
    ...(index >= 0 ? seriesData[index] : { id: 'user_' + Date.now() }),
    title,
    year,
    rating: currentRating,
    isMovie,
    playerData: {
      ...(index >= 0 ? (seriesData[index].playerData || {}) : {}),
      finished,
      season,
      episode,
      updatedAt: new Date().toISOString()
    }
  };

  // Re-assign category
  delete newItem._category;
  if (isMovie) newItem._category = 'Movies';
  else if (finished) newItem._category = 'Finished';
  else if (season > 1) newItem._category = 'Ongoing';
  else newItem._category = 'Watching';

  // If title changed, clear TMDB cache so it re-fetches on next reload
  if (index >= 0 && seriesData[index].title !== title) {
    delete newItem._tmdbId;
    delete newItem.poster;
  }

  if (index >= 0) {
    seriesData[index] = newItem;
  } else {
    seriesData.push(newItem);
  }

  saveData();
  closeModal();
  populateCategories();
  filterData();
}

function deleteItem(index) {
  if (!confirm(`Delete "${seriesData[index].title}"?`)) return;
  seriesData.splice(index, 1);
  saveData();
  closeModal();
  populateCategories();
  filterData();
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function showLoginModal() {
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-size:1.3rem;font-weight:700;color:var(--text)">Login</h2>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    <div id="loginError" style="display:none;background:rgba(239,68,68,0.1);color:#ef4444;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:0.85rem">
      ❌ Wrong username or password.
    </div>
    <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Username</label>
    <input id="lUser" class="input-field" placeholder="Username" style="margin-bottom:12px" onkeydown="if(event.key==='Enter')doLogin()">
    <label style="display:block;margin-bottom:4px;font-size:0.82rem;color:var(--text-muted)">Password</label>
    <input id="lPass" type="password" class="input-field" placeholder="Password" style="margin-bottom:20px" onkeydown="if(event.key==='Enter')doLogin()">
    <div style="display:flex;gap:10px">
      <button onclick="doLogin()" class="btn-primary" style="flex:1;padding:12px">Login</button>
      <button onclick="closeModal()" class="btn-secondary" style="flex:1;padding:12px">Cancel</button>
    </div>
  `;
  document.getElementById('modal').classList.add('active');
  setTimeout(() => document.getElementById('lUser')?.focus(), 100);
}

async function doLogin() {
  const u = document.getElementById('lUser').value.trim();
  const p = document.getElementById('lPass').value;

  // Disable button while verifying
  const btn = document.querySelector('#modalContent .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }

  const ok = await login(u, p);
  if (ok) {
    closeModal();
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('lPass').value = '';
    if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
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
      if (!Array.isArray(imported)) throw new Error('Not an array');
      seriesData = imported;
      seriesData.forEach(x => delete x._category);
      saveData();
      populateCategories();
      filterData();
      alert(`✅ Imported ${imported.length} titles.`);
      // Kick off TMDB refresh for newly imported items
      refreshFromTMDB();
    } catch {
      alert('❌ Invalid JSON file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function exportFile() {
  const blob = new Blob([JSON.stringify(seriesData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'series.json';
  a.click();
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveData() {
  localStorage.setItem('wl_data', JSON.stringify(seriesData));
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
