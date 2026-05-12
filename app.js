// === AI Repo Radar — Paginated by Date ===
const ARCHIVE_INDEX_URL = '/data/archive/index.json';
let archiveDates = [];      // [{date, count}, ...] sorted newest first
let currentPageRepos = [];   // repos for current page's date
let allReposCache = null;    // all repos loaded for search mode
let activeCategory = 'all';
let activeSearch = '';
let isSearchMode = false;

// Velocity tiers
function getVelocityClass(score) {
  if (score >= 50) return 'velocity-explosive';
  if (score >= 25) return 'velocity-hot';
  if (score >= 10) return 'velocity-warm';
  return 'velocity-moderate';
}
function getVelocityEmoji(score) {
  if (score >= 50) return '🚀';
  if (score >= 25) return '🔥';
  if (score >= 10) return '📈';
  return '✨';
}

// Get current page from URL (?page=N)
function getPageNum() {
  const p = new URLSearchParams(window.location.search).get('page');
  const n = parseInt(p, 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

function setPageNum(n) {
  const url = new URL(window.location);
  if (n === 1) url.searchParams.delete('page');
  else url.searchParams.set('page', n);
  window.history.replaceState({}, '', url);
}

// Date formatting
function formatDateHeader(dateStr, pageIndex) {
  const d = new Date(dateStr + 'T00:00:00');
  const fmt = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return `📅 Today — ${fmt}`;
  if (dateStr === yesterday) return `📅 Yesterday — ${fmt}`;
  return `📅 ${fmt}`;
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Load data
async function loadData() {
  try {
    const res = await fetch(ARCHIVE_INDEX_URL);
    archiveDates = await res.json();
    if (!archiveDates.length) throw new Error('Empty archive');
    await loadPage(getPageNum());
  } catch {
    loadSampleData();
  }
}

async function loadPage(pageNum) {
  const idx = pageNum - 1;
  if (idx < 0 || idx >= archiveDates.length) {
    // Out of range — redirect to last page
    setPageNum(archiveDates.length);
    return loadPage(archiveDates.length);
  }

  const dateEntry = archiveDates[idx];
  try {
    const r = await fetch(`/data/archive/${dateEntry.date}.json`);
    currentPageRepos = await r.json();
  } catch {
    currentPageRepos = [];
  }

  // Sort by velocity
  currentPageRepos.sort((a, b) => b.velocity_score - a.velocity_score);

  // Update URL
  setPageNum(pageNum);

  init();
}

// Preload all repos for search mode
async function preloadAllRepos() {
  if (allReposCache) return allReposCache;
  const entries = [];
  for (const item of archiveDates) {
    try {
      const r = await fetch(`/data/archive/${item.date}.json`);
      const repos = await r.json();
      entries.push({ date: item.date, repos });
    } catch {
      entries.push({ date: item.date, repos: [] });
    }
  }
  allReposCache = entries;
  return entries;
}

function loadSampleData() {
  archiveDates = [{ date: new Date().toISOString().split('T')[0], count: 8 }];
  currentPageRepos = [
    { id: 1, name: "gpt-pilot", full_name: "Pythagora-io/gpt-pilot",
      url: "https://github.com/Pythagora-io/gpt-pilot",
      description: "The first real AI developer — builds production apps from scratch",
      stars: 31200, stars_this_week: 2840, velocity_score: 9.1,
      language: "Python", topics: ["ai", "coding-agent", "llm"],
      summary: "AI coding agent that builds full production applications from natural language specs." },
    { id: 2, name: "sglang", full_name: "sgl-project/sglang",
      url: "https://github.com/sgl-project/sglang",
      description: "SGLang is a fast serving framework for large language models",
      stars: 15200, stars_this_week: 1890, velocity_score: 12.4,
      language: "Python", topics: ["llm", "inference", "serving"],
      summary: "High-performance LLM serving framework with structured generation." },
    { id: 3, name: "smolagents", full_name: "huggingface/smolagents",
      url: "https://github.com/huggingface/smolagents",
      description: "Minimal framework for building powerful agents",
      stars: 8900, stars_this_week: 3200, velocity_score: 36.0,
      language: "Python", topics: ["agents", "llm", "huggingface"],
      summary: "Lightweight agent framework from Hugging Face." },
    { id: 4, name: "open-reasoner-zero", full_name: "Open-Reasoner-Zero/Open-Reasoner-Zero",
      url: "https://github.com/Open-Reasoner-Zero/Open-Reasoner-Zero",
      description: "Open source DeepSeek-R1 style reasoning with RL",
      stars: 6200, stars_this_week: 4100, velocity_score: 66.1,
      language: "Python", topics: ["reasoning", "llm", "reinforcement-learning"],
      summary: "Open reproduction of DeepSeek-R1 reasoning capabilities." },
    { id: 5, name: "llama-cpp-agent", full_name: "Maximilian-Winter/llama-cpp-agent",
      url: "https://github.com/Maximilian-Winter/llama-cpp-agent",
      description: "Easy-to-use AI agent framework built on llama-cpp-python",
      stars: 3400, stars_this_week: 980, velocity_score: 28.8,
      language: "Python", topics: ["agents", "llm", "local"],
      summary: "Agent framework for local LLMs." },
    { id: 6, name: "whisper-turbo", full_name: "FL33TW00D/whisper-turbo",
      url: "https://github.com/FL33TW00D/whisper-turbo",
      description: "50x faster Whisper inference with speculative decoding",
      stars: 2800, stars_this_week: 2100, velocity_score: 75.0,
      language: "Python", topics: ["audio", "speech-to-text", "whisper"],
      summary: "Radically faster Whisper speech recognition." },
    { id: 7, name: "agentmemory", full_name: "rohitg00/agentmemory",
      url: "https://github.com/rohitg00/agentmemory",
      description: "Persistent memory for AI coding agents",
      stars: 5100, stars_this_week: 1400, velocity_score: 27.5,
      language: "TypeScript", topics: ["memory", "agents", "mcp"],
      summary: "Cross-session memory engine for AI coding agents." },
    { id: 8, name: "jan-ai", full_name: "janhq/jan",
      url: "https://github.com/janhq/jan",
      description: "Open source ChatGPT alternative that runs 100% offline",
      stars: 24200, stars_this_week: 890, velocity_score: 3.7,
      language: "TypeScript", topics: ["llm", "desktop", "local"],
      summary: "Desktop app for running LLMs locally." }
  ];
  init();
}

function init() {
  isSearchMode = !!(activeCategory !== 'all' || activeSearch);

  // Build filter tabs
  const filterTabs = document.getElementById('filterTabs');
  const displayCats = [
    { key: 'all', label: 'All' },
    { key: 'llm', label: 'LLM' },
    { key: 'agents', label: 'Agents' },
    { key: 'reasoning', label: 'Reasoning' },
    { key: 'vision', label: 'Vision' },
    { key: 'audio', label: 'Audio' },
    { key: 'tools', label: 'Tools' },
    { key: 'local', label: 'Local' },
    { key: 'framework', label: 'Framework' },
    { key: 'memory', label: 'Memory' }
  ];

  filterTabs.innerHTML = '';
  displayCats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-tab${cat.key === activeCategory ? ' active' : ''}`;
    btn.dataset.category = cat.key;
    btn.textContent = cat.label;
    btn.onclick = () => filterBy(cat.key);
    filterTabs.appendChild(btn);
  });

  // Update stats
  const pageNum = getPageNum();
  const dateEntry = archiveDates[pageNum - 1];
  const totalStars = currentPageRepos.reduce((s, r) => s + (r.stars || 0), 0);
  const hottest = currentPageRepos.length ? currentPageRepos.reduce((a, b) => a.velocity_score > b.velocity_score ? a : b) : null;

  document.getElementById('statCount').textContent = dateEntry ? `${currentPageRepos.length} · pg ${pageNum}/${archiveDates.length}` : '—';
  document.getElementById('statStars').textContent = formatNum(totalStars);
  document.getElementById('statHot').textContent = hottest?.name || '—';

  // Render
  if (isSearchMode) {
    renderSearch();
  } else {
    renderPage(pageNum);
  }

  initBackground();
}

function filterBy(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-category="${cat}"]`)?.classList.add('active');
  isSearchMode = !!(activeCategory !== 'all' || activeSearch);
  if (isSearchMode) {
    renderSearch();
  } else {
    renderPage(getPageNum());
  }
}

function matchesFilters(r) {
  if (activeCategory !== 'all') {
    if (!(r.topics || []).includes(activeCategory)) return false;
  }
  if (activeSearch) {
    const hay = [
      r.name, r.description, (r.topics || []).join(' '), r.language, r.full_name
    ].join(' ').toLowerCase();
    if (!hay.includes(activeSearch)) return false;
  }
  return true;
}

function repoCardHTML(r) {
  return `
    <div class="repo-card" onclick="window.open('/repo.html?id=${r.id}', '_self')">
      <div class="repo-card-header">
        <div>
          <div class="repo-name">${r.full_name.split('/')[1]}</div>
          <div class="repo-owner">${r.full_name.split('/')[0]}</div>
        </div>
        <span class="velocity-badge ${getVelocityClass(r.velocity_score)}">
          ${getVelocityEmoji(r.velocity_score)} ${r.velocity_score.toFixed(1)}x
        </span>
      </div>
      <div class="repo-desc">${r.description}</div>
      ${r.summary ? `<div class="repo-summary">${r.summary}</div>` : ''}
      <div class="repo-meta">
        <div class="repo-stat">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${formatNum(r.stars)}
        </div>
        <div class="repo-stat">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          +${formatNum(r.stars_this_week)}/wk
        </div>
        <div class="repo-tags">
          <span class="tag tag-lang">${r.language || 'N/A'}</span>
          ${(r.topics || []).slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render paginated view (one date per page)
function renderPage(pageNum) {
  const container = document.getElementById('dateSections');
  const pagination = document.getElementById('pagination');
  const empty = document.getElementById('emptyState');

  const idx = pageNum - 1;
  const dateEntry = archiveDates[idx];

  if (!dateEntry || currentPageRepos.length === 0) {
    container.innerHTML = '';
    pagination.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Date header
  const filtered = currentPageRepos.filter(matchesFilters);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="page-date-header">${formatDateHeader(dateEntry.date, idx)}</div>
      <div class="page-divider"></div>
      <div class="empty-state" style="display:block;position:static;background:transparent;border:none;">
        <div class="empty-icon">🔍</div>
        <h2>No matching repos</h2>
        <p>Try a different filter or search term</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="page-date-header">${formatDateHeader(dateEntry.date, idx)}</div>
      <div class="page-divider"></div>
      <div class="repo-grid">
        ${filtered.map(repoCardHTML).join('')}
      </div>
    `;
  }

  // Pagination
  renderPagination(pageNum);
}

// Render search results (all dates, grouped)
async function renderSearch() {
  const container = document.getElementById('dateSections');
  const pagination = document.getElementById('pagination');
  const empty = document.getElementById('emptyState');

  pagination.innerHTML = '';

  const allEntries = await preloadAllRepos();
  let hasAny = false;
  let html = '';

  allEntries.forEach((entry, idx) => {
    const filtered = entry.repos.filter(matchesFilters);
    if (filtered.length === 0) return;
    hasAny = true;

    html += `
      <section class="date-section">
        <h2 class="date-header">${formatDateHeader(entry.date, idx)}</h2>
        <div class="date-divider"></div>
        <div class="repo-grid">
          ${filtered.map(repoCardHTML).join('')}
        </div>
      </section>
    `;
  });

  if (!hasAny) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = html;
}

// Pagination controls
function renderPagination(currentPage) {
  const pagination = document.getElementById('pagination');
  const total = archiveDates.length;
  if (total <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '<div class="pagination">';

  // Previous
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Prev</button>`;
  } else {
    html += `<button class="page-btn disabled" disabled>← Prev</button>`;
  }

  // Page numbers
  const maxVisible = 7;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  if (start > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span class="page-ellipsis">…</span>`;
  }

  for (let i = start; i <= end; i++) {
    const active = i === currentPage ? ' active' : '';
    html += `<button class="page-btn${active}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (end < total) {
    if (end < total - 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="goToPage(${total})">${total}</button>`;
  }

  // Next
  if (currentPage < total) {
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next →</button>`;
  } else {
    html += `<button class="page-btn disabled" disabled>Next →</button>`;
  }

  html += '</div>';
  pagination.innerHTML = html;
}

window.goToPage = function(n) {
  activeSearch = '';
  document.getElementById('searchInput').value = '';
  isSearchMode = false;
  activeCategory = 'all';
  loadPage(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Search handler
document.getElementById('searchInput').addEventListener('input', e => {
  activeSearch = e.target.value.toLowerCase().trim();
  isSearchMode = !!(activeCategory !== 'all' || activeSearch);
  if (isSearchMode) {
    renderSearch();
  } else {
    renderPage(getPageNum());
  }
});

// Newsletter
function subscribeNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  alert(`✅ Thanks! We'll send daily digests to ${input.value}`);
  input.value = '';
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('light');
  const icon = document.querySelector('.theme-icon');
  icon.textContent = document.body.classList.contains('light') ? '☾' : '☀';
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.querySelector('.theme-icon').textContent = '☾';
}

// Background canvas
function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const count = Math.min(60, Math.floor(w * h / 15000));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.body.classList.contains('light');
    const color = isLight ? '150,150,170' : '100,120,160';

    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${0.15 + p.r * 0.05})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${color},${0.03 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Start
loadData();
