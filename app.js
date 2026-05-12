// === AI Repo Radar — Paginated by Date ===
const ARCHIVE_INDEX_URL = '/data/archive/index.json';

let dateIndex = [];        // [{date, count}, ...] sorted newest first
let currentPage = 1;       // From URL param
let currentDateRepos = []; // Repos for current page's date
let allReposByDate = [];   // All repos (loaded in search mode)
let activeCategory = 'all';
let activeSearch = '';
let isSearchMode = false;
let isLoadingAll = false;

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

function getPageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const p = parseInt(params.get('page')) || 1;
  return Math.max(1, p);
}

function setPageURL(page) {
  const url = new URL(window.location);
  if (page === 1) {
    url.searchParams.delete('page');
  } else {
    url.searchParams.set('page', page);
  }
  window.history.replaceState({}, '', url);
}

function getYesterdayStr(todayStr) {
  const d = new Date(todayStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

async function loadData() {
  try {
    const res = await fetch(ARCHIVE_INDEX_URL);
    dateIndex = await res.json();
    if (!dateIndex.length) throw new Error('Empty archive');
    currentPage = getPageFromURL();
    await loadCurrentDate();
    init();
  } catch {
    loadSampleData();
  }
}

async function loadCurrentDate() {
  const idx = currentPage - 1;
  if (idx < 0 || idx >= dateIndex.length) {
    currentDateRepos = [];
    return;
  }
  const date = dateIndex[idx].date;
  try {
    const res = await fetch(`/data/archive/${date}.json`);
    currentDateRepos = await res.json();
    currentDateRepos.sort((a, b) => b.velocity_score - a.velocity_score);
  } catch {
    currentDateRepos = [];
  }
}

async function loadAllDates() {
  if (isLoadingAll || allReposByDate.length) return;
  isLoadingAll = true;
  allReposByDate = [];
  for (const item of dateIndex) {
    try {
      const res = await fetch(`/data/archive/${item.date}.json`);
      const repos = await res.json();
      repos.sort((a, b) => b.velocity_score - a.velocity_score);
      allReposByDate.push({ date: item.date, repos });
    } catch (e) {
      console.warn('Failed to load', item.date, e);
    }
  }
  isLoadingAll = false;
}

function loadSampleData() {
  const today = new Date().toISOString().split('T')[0];
  dateIndex = [{ date: today, count: 8 }];
  currentDateRepos = [
    {
      id: 1, name: "gpt-pilot", full_name: "Pythagora-io/gpt-pilot",
      url: "https://github.com/Pythagora-io/gpt-pilot",
      description: "The first real AI developer — builds production apps from scratch",
      stars: 31200, stars_this_week: 2840, velocity_score: 9.1,
      language: "Python", topics: ["ai", "coding-agent", "llm"],
      summary: "AI coding agent that builds full production applications from natural language specs. Uses LLMs to plan, code, debug, and deploy complete apps with minimal human input."
    },
    {
      id: 2, name: "sglang", full_name: "sgl-project/sglang",
      url: "https://github.com/sgl-project/sglang",
      description: "SGLang is a fast serving framework for large language models and vision-language models",
      stars: 15200, stars_this_week: 1890, velocity_score: 12.4,
      language: "Python", topics: ["llm", "inference", "serving"],
      summary: "High-performance LLM serving framework with structured generation. Achieves 5x faster inference than vLLM on certain workloads with its RadixAttention mechanism."
    },
    {
      id: 3, name: "smolagents", full_name: "huggingface/smolagents",
      url: "https://github.com/huggingface/smolagents",
      description: "Minimal framework for building powerful agents with code execution",
      stars: 8900, stars_this_week: 3200, velocity_score: 36.0,
      language: "Python", topics: ["agents", "llm", "huggingface"],
      summary: "Lightweight agent framework from Hugging Face. Agents write and execute Python code to solve tasks. Supports any LLM backend. Code-first design means agents actually work."
    },
    {
      id: 4, name: "open-reasoner-zero", full_name: "Open-Reasoner-Zero/Open-Reasoner-Zero",
      url: "https://github.com/Open-Reasoner-Zero/Open-Reasoner-Zero",
      description: "Open source implementation of DeepSeek-R1 style reasoning with RL",
      stars: 6200, stars_this_week: 4100, velocity_score: 66.1,
      language: "Python", topics: ["reasoning", "llm", "reinforcement-learning"],
      summary: "Open reproduction of DeepSeek-R1's reasoning capabilities using reinforcement learning. Achieves strong reasoning with open models, narrowing the gap with proprietary systems."
    },
    {
      id: 5, name: "llama-cpp-agent", full_name: "Maximilian-Winter/llama-cpp-agent",
      url: "https://github.com/Maximilian-Winter/llama-cpp-agent",
      description: "Easy-to-use AI agent framework built on llama-cpp-python",
      stars: 3400, stars_this_week: 980, velocity_score: 28.8,
      language: "Python", topics: ["agents", "llm", "local"],
      summary: "Agent framework for local LLMs. Function calling, memory, RAG, and web search — all running locally with quantized models on consumer hardware."
    },
    {
      id: 6, name: "whisper-turbo", full_name: "FL33TW00D/whisper-turbo",
      url: "https://github.com/FL33TW00D/whisper-turbo",
      description: "50x faster Whisper inference with speculative decoding",
      stars: 2800, stars_this_week: 2100, velocity_score: 75.0,
      language: "Python", topics: ["audio", "speech-to-text", "whisper"],
      summary: "Radically faster Whisper speech recognition using speculative decoding. Real-time transcription on consumer GPUs. Drop-in replacement for OpenAI Whisper."
    },
    {
      id: 7, name: "agentmemory", full_name: "rohitg00/agentmemory",
      url: "https://github.com/rohitg00/agentmemory",
      description: "Persistent memory for AI coding agents — 95.2% retrieval accuracy",
      stars: 5100, stars_this_week: 1400, velocity_score: 27.5,
      language: "TypeScript", topics: ["memory", "agents", "mcp"],
      summary: "Cross-session memory engine for AI coding agents. Works with Claude Code, Cursor, Gemini CLI, and OpenClaw. BM25+Vector+Graph hybrid search with auto-forget."
    },
    {
      id: 8, name: "jan-ai", full_name: "janhq/jan",
      url: "https://github.com/janhq/jan",
      description: "Open source ChatGPT alternative that runs 100% offline",
      stars: 24200, stars_this_week: 890, velocity_score: 3.7,
      language: "TypeScript", topics: ["llm", "desktop", "local"],
      summary: "Desktop app for running LLMs locally. Clean UI, model library, and inference engine. Supports GGUF models. Open source alternative to ChatGPT desktop."
    }
  ];
  init();
}

function init() {
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
    btn.className = `filter-tab${cat.key === 'all' ? ' active' : ''}`;
    btn.dataset.category = cat.key;
    btn.textContent = cat.label;
    btn.onclick = () => filterBy(cat.key);
    filterTabs.appendChild(btn);
  });

  // Search handler
  document.getElementById('searchInput').addEventListener('input', e => {
    activeSearch = e.target.value.toLowerCase();
    updateMode();
  });

  // Initial render
  render();

  // Background canvas
  initBackground();
}

function updateMode() {
  const wasSearchMode = isSearchMode;
  isSearchMode = activeSearch !== '' || activeCategory !== 'all';

  if (isSearchMode && !wasSearchMode) {
    // Switched to search mode — need to load all dates
    renderLoading();
    loadAllDates().then(() => render());
  } else if (!isSearchMode && wasSearchMode) {
    // Switched back to paginated mode
    render();
  } else {
    // Same mode, just re-render
    render();
  }
}

function filterBy(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-category="${cat}"]`)?.classList.add('active');
  updateMode();
}

function matchesFilters(r) {
  if (activeCategory !== 'all') {
    if (!(r.topics || []).includes(activeCategory)) return false;
  }
  if (activeSearch) {
    const hay = [r.name, r.description, (r.topics || []).join(' '), r.language, r.full_name].join(' ').toLowerCase();
    if (!hay.includes(activeSearch)) return false;
  }
  return true;
}

// Exposed globally for onclick handlers
window.goToPage = function(page) {
  currentPage = page;
  setPageURL(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderLoading();
  loadCurrentDate().then(() => render());
};

function renderLoading() {
  document.getElementById('dateSections').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">Loading...</p>';
  document.getElementById('emptyState').style.display = 'none';
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return '';

  let html = '<div class="pagination">';

  // Previous
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Prev</button>`;
  } else {
    html += `<button class="page-btn disabled" disabled>← Prev</button>`;
  }

  // Page numbers
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span class="page-ellipsis">…</span>`;
  }

  for (let i = start; i <= end; i++) {
    if (i === currentPage) {
      html += `<button class="page-btn active">${i}</button>`;
    } else {
      html += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
    }
  }

  if (end < totalPages) {
    if (end < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // Next
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next →</button>`;
  } else {
    html += `<button class="page-btn disabled" disabled>Next →</button>`;
  }

  html += '</div>';
  return html;
}

function formatDateLabel(dateStr, isToday, isYesterday) {
  const d = new Date(dateStr + 'T00:00:00');
  const fmt = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (isToday) return `📅 Today — ${fmt}`;
  if (isYesterday) return `📅 Yesterday — ${fmt}`;
  return `📅 ${fmt}`;
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

function render() {
  const container = document.getElementById('dateSections');
  const empty = document.getElementById('emptyState');
  const todayStr = new Date().toISOString().split('T')[0];

  if (isSearchMode) {
    // Search mode: show filtered results from all dates
    if (!allReposByDate.length && isLoadingAll) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">Loading all dates...</p>';
      empty.style.display = 'none';
      return;
    }

    let hasAny = false;
    let html = '';

    allReposByDate.forEach((entry, idx) => {
      const filtered = entry.repos.filter(matchesFilters);
      if (!filtered.length) return;
      hasAny = true;

      const isToday = entry.date === todayStr;
      const isYesterday = entry.date === getYesterdayStr(todayStr);

      html += `
        <section class="date-section">
          <h2 class="date-header">${formatDateLabel(entry.date, isToday, isYesterday)}</h2>
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

  } else {
    // Paginated mode: show current date only
    const idx = currentPage - 1;
    if (idx < 0 || idx >= dateIndex.length) {
      container.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    const date = dateIndex[idx].date;
    const isToday = date === todayStr;
    const isYesterday = date === getYesterdayStr(todayStr);

    // Update stats for this date
    const totalStars = currentDateRepos.reduce((s, r) => s + (r.stars || 0), 0);
    let hottest = null;
    currentDateRepos.forEach(r => {
      if (!hottest || r.velocity_score > hottest.velocity_score) hottest = r;
    });

    document.getElementById('statCount').textContent = currentDateRepos.length;
    document.getElementById('statStars').textContent = formatNum(totalStars);
    document.getElementById('statHot').textContent = hottest?.name || '—';

    let html = `
      <section class="date-section">
        <h2 class="date-header">${formatDateLabel(date, isToday, isYesterday)}</h2>
        <div class="date-divider"></div>
        <div class="repo-grid">
          ${currentDateRepos.map(repoCardHTML).join('')}
        </div>
      </section>
      ${renderPagination(dateIndex.length)}
    `;

    container.innerHTML = html;
    empty.style.display = 'none';
  }
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Newsletter
function subscribeNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const email = input.value;
  alert(`✅ Thanks! We'll send daily digests to ${email}`);
  input.value = '';
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('light');
  const icon = document.querySelector('.theme-icon');
  icon.textContent = document.body.classList.contains('light') ? '☾' : '☀';
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.querySelector('.theme-icon').textContent = '☾';
}

// Background canvas — subtle particle network
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
