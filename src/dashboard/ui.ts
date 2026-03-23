/**
 * AutoDev Dashboard — shadcn/ui + HeroUI inspired design
 * Single-page embedded dashboard with real-time SSE
 * Dark theme, glassmorphism, smooth animations
 */

export function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoDev — Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: '#09090b',
            card: '#0c0c10',
            'card-foreground': '#fafafa',
            border: 'rgba(255,255,255,0.06)',
            muted: '#18181b',
            'muted-foreground': '#71717a',
            accent: '#27272a',
            ring: '#7c3aed',
            brand: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95' },
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#f59e0b',
          },
          borderRadius: { 'xl': '0.75rem', '2xl': '1rem' },
          boxShadow: {
            'glow': '0 0 20px rgba(124,58,237,0.15)',
            'glow-lg': '0 0 40px rgba(124,58,237,0.2)',
            'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
    * { font-family: 'Inter', system-ui, sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }

    /* shadcn/ui card style */
    .sh-card {
      background: linear-gradient(145deg, rgba(12,12,16,0.9), rgba(15,15,20,0.95));
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 0.75rem;
      backdrop-filter: blur(12px);
      transition: all 0.2s ease;
    }
    .sh-card:hover { border-color: rgba(255,255,255,0.1); }

    /* HeroUI glass effect */
    .hero-glass {
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.05);
    }

    /* HeroUI button */
    .hero-btn {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .hero-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .hero-btn:hover::before { opacity: 1; }
    .hero-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(124,58,237,0.3); }

    /* Badge pill */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    /* Log terminal */
    .log-terminal {
      max-height: 420px;
      overflow-y: auto;
      scroll-behavior: smooth;
      background: #06060a;
      border-radius: 0 0 0.75rem 0.75rem;
    }
    .log-terminal::-webkit-scrollbar { width: 5px; }
    .log-terminal::-webkit-scrollbar-track { background: transparent; }
    .log-terminal::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }

    /* Animations */
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 6px transparent; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }

    .fade-up { animation: fadeUp 0.4s ease-out; }
    .pulse-ring { animation: pulse-ring 2s infinite; }
    .shimmer {
      background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.03) 50%, transparent 75%);
      background-size: 200% 100%;
      animation: shimmer 3s infinite;
    }
    .float { animation: float 3s ease-in-out infinite; }

    /* Stat card gradient borders */
    .stat-card {
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
      opacity: 0.6;
    }

    /* Module color vars */
    .mod-security { --accent-color: #ef4444; }
    .mod-performance { --accent-color: #f59e0b; }
    .mod-seo { --accent-color: #3b82f6; }
    .mod-content { --accent-color: #22c55e; }
    .mod-quality { --accent-color: #a78bfa; }

    /* Progress ring */
    .progress-ring { transform: rotate(-90deg); }

    /* Tooltip */
    [data-tip] { position: relative; cursor: help; }
    [data-tip]:hover::after {
      content: attr(data-tip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 10px;
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 50;
      color: #a1a1aa;
    }

    /* Scrollbar for history */
    .history-scroll { max-height: 500px; overflow-y: auto; }
    .history-scroll::-webkit-scrollbar { width: 4px; }
    .history-scroll::-webkit-scrollbar-track { background: transparent; }
    .history-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px; }
  </style>
</head>
<body class="bg-background text-zinc-200 min-h-screen antialiased">

  <!-- Ambient background glow -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-brand-700/5 rounded-full blur-[120px]"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[35%] h-[35%] bg-brand-500/5 rounded-full blur-[100px]"></div>
  </div>

  <!-- Header -->
  <header class="relative border-b border-border hero-glass sticky top-0 z-50">
    <div class="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3.5">
        <div class="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow float">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <h1 class="text-[15px] font-semibold text-white tracking-tight">AutoDev</h1>
          <p class="text-[11px] text-muted-foreground leading-none mt-0.5" id="header-sub">Agent</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div id="status-badge" class="badge bg-zinc-800/50 text-zinc-500">
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          Loading
        </div>
        <div class="h-5 w-px bg-border"></div>
        <button onclick="triggerRun()" id="run-btn"
          class="hero-btn px-4 py-2 bg-brand-600 text-white text-[13px] font-medium rounded-xl
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
          <span class="relative z-10 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Now
          </span>
        </button>
      </div>
    </div>
  </header>

  <main class="relative max-w-[1400px] mx-auto px-6 py-7 space-y-6">

    <!-- Stats Row -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3" id="stats-row">
      <div class="sh-card stat-card mod-brand p-5" style="--accent-color:#8b5cf6">
        <p class="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Total Runs</p>
        <p class="text-[28px] font-bold text-white mt-1 tracking-tight" id="s-total">0</p>
      </div>
      <div class="sh-card stat-card mod-content p-5">
        <p class="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Success Rate</p>
        <div class="flex items-end gap-2 mt-1">
          <p class="text-[28px] font-bold text-success tracking-tight" id="s-rate">0%</p>
          <div id="rate-ring" class="mb-1.5"></div>
        </div>
      </div>
      <div class="sh-card stat-card p-5" style="--accent-color:#22c55e">
        <p class="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Successes</p>
        <p class="text-[28px] font-bold text-success mt-1 tracking-tight" id="s-ok">0</p>
      </div>
      <div class="sh-card stat-card p-5" style="--accent-color:#ef4444">
        <p class="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Failed</p>
        <p class="text-[28px] font-bold text-danger mt-1 tracking-tight" id="s-fail">0</p>
      </div>
      <div class="sh-card stat-card p-5" style="--accent-color:#f59e0b">
        <p class="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Skipped</p>
        <p class="text-[28px] font-bold text-warning mt-1 tracking-tight" id="s-skip">0</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid lg:grid-cols-12 gap-5">

      <!-- Left Column: Projects + Memory -->
      <div class="lg:col-span-4 space-y-5">

        <!-- Projects Card -->
        <div class="sh-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <h2 class="text-[13px] font-semibold text-white">Projects</h2>
            </div>
            <span class="text-[10px] text-muted-foreground" id="proj-count">0</span>
          </div>
          <div id="projects-list" class="p-3 space-y-2">
            <div class="shimmer rounded-lg h-16"></div>
          </div>
        </div>

        <!-- Memory Card -->
        <div class="sh-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M20 12a8 8 0 1 1-16 0"/></svg>
            <h2 class="text-[13px] font-semibold text-white">Agent Memory</h2>
          </div>
          <div id="memory-panel" class="p-3 space-y-2 max-h-[360px] overflow-y-auto">
            <div class="shimmer rounded-lg h-20"></div>
          </div>
        </div>

        <!-- Config Card -->
        <div class="sh-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <h2 class="text-[13px] font-semibold text-white">Configuration</h2>
          </div>
          <div id="config-panel" class="p-3 space-y-2">
            <div class="shimmer rounded-lg h-16"></div>
          </div>
        </div>
      </div>

      <!-- Right Column: History + Logs -->
      <div class="lg:col-span-8 space-y-5">

        <!-- History Card -->
        <div class="sh-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <h2 class="text-[13px] font-semibold text-white">Improvement History</h2>
            </div>
            <button onclick="loadHistory()" class="text-[11px] text-brand-400 hover:text-brand-300 transition-colors">Refresh</button>
          </div>
          <div id="history-list" class="history-scroll divide-y divide-border">
            <div class="p-5"><div class="shimmer rounded-lg h-12"></div></div>
          </div>
        </div>

        <!-- Logs Card -->
        <div class="sh-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              <h2 class="text-[13px] font-semibold text-white">Live Terminal</h2>
              <span class="w-1.5 h-1.5 rounded-full bg-success pulse-ring" id="sse-indicator"></span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[10px] text-muted-foreground mono" id="log-count">0 lines</span>
              <button onclick="clearLogs()" class="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
            </div>
          </div>
          <div id="log-container" class="log-terminal p-4 mono text-[12px] leading-[1.7] space-y-0">
            <div class="text-zinc-700">Connecting to agent...</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="relative border-t border-border mt-8">
    <div class="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
        </div>
        <span class="text-[11px] text-zinc-600">AutoDev by <a href="https://dickenai.com" class="text-brand-400/80 hover:text-brand-300 transition-colors">Dicken AI</a></span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[11px] text-zinc-700 mono" id="uptime-display">--</span>
        <a href="https://github.com/BigOD2307/AutoDev" target="_blank" class="text-zinc-600 hover:text-zinc-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </div>
  </footer>

<script>
const MAX_LOGS = 300;
let logs = [];

// ── SSE ──────────────────────────────
function connectSSE() {
  const sse = new EventSource('/api/events');
  const dot = document.getElementById('sse-indicator');

  sse.onmessage = (e) => {
    try {
      const p = JSON.parse(e.data);
      if (p.type === 'log') addLog(p.data);
      if (p.type === 'status') setStatus(p.status);
      if (p.type === 'connected') setStatus(p.status);
    } catch {}
  };
  sse.onerror = () => { dot.className = 'w-1.5 h-1.5 rounded-full bg-danger'; setTimeout(connectSSE, 3000); };
  sse.onopen = () => { dot.className = 'w-1.5 h-1.5 rounded-full bg-success pulse-ring'; };
}

// ── Logs ─────────────────────────────
function addLog(text) {
  logs.push(text);
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
  renderLogs();
}

function renderLogs() {
  const el = document.getElementById('log-container');
  el.innerHTML = logs.map(l => {
    let c = 'text-zinc-500';
    if (l.includes('[ERROR]')) c = 'text-red-400';
    else if (l.includes('[SUCCESS]')) c = 'text-emerald-400';
    else if (l.includes('[WARN]')) c = 'text-amber-400';
    else if (l.includes('[DEBUG]')) c = 'text-zinc-700';
    else if (l.includes('[INFO]')) c = 'text-zinc-400';
    return '<div class="'+c+' fade-up hover:bg-white/[0.01] px-1 rounded">' + esc(l) + '</div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
  document.getElementById('log-count').textContent = logs.length + ' lines';
}

function clearLogs() { logs = []; renderLogs(); }

// ── Status ───────────────────────────
function setStatus(s) {
  const el = document.getElementById('status-badge');
  const btn = document.getElementById('run-btn');
  const map = {
    idle:    { bg:'bg-success/10', text:'text-success', dot:'bg-success', label:'Idle' },
    running: { bg:'bg-warning/10', text:'text-warning', dot:'bg-warning pulse-ring', label:'Running' },
    error:   { bg:'bg-danger/10', text:'text-danger', dot:'bg-danger', label:'Error' },
  };
  const c = map[s] || map.idle;
  el.className = 'badge ' + c.bg + ' ' + c.text;
  el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full '+c.dot+'"></span>'+c.label;
  btn.disabled = s === 'running';
}

// ── API ──────────────────────────────
async function loadStatus() {
  try {
    const d = await (await fetch('/api/status')).json();
    document.getElementById('s-total').textContent = d.stats.total;
    document.getElementById('s-rate').textContent = d.stats.successRate + '%';
    document.getElementById('s-ok').textContent = d.stats.successes;
    document.getElementById('s-fail').textContent = d.stats.failures;
    document.getElementById('s-skip').textContent = d.stats.skipped;
    document.getElementById('header-sub').textContent = d.agent.schedule + (d.agent.dryRun ? ' (dry run)' : '');
    setStatus(d.agent.status);
    renderProjects(d.projects);
    document.getElementById('proj-count').textContent = d.projects.length + ' project' + (d.projects.length !== 1 ? 's' : '');
    renderRing(d.stats.successRate);
    renderUptime(d.agent.uptime);
  } catch {}
}

async function loadHistory() {
  try {
    const d = await (await fetch('/api/history?limit=30')).json();
    renderHistory(d);
  } catch {}
}

async function loadMemory() {
  try {
    const d = await (await fetch('/api/memory')).json();
    renderMemory(d);
  } catch {}
}

async function loadConfig() {
  try {
    const d = await (await fetch('/api/config')).json();
    renderConfig(d);
  } catch {}
}

async function triggerRun() {
  try { await fetch('/api/run', { method:'POST' }); setStatus('running'); } catch {}
}

// ── Renderers ────────────────────────
function renderProjects(projects) {
  const el = document.getElementById('projects-list');
  if (!projects?.length) { el.innerHTML = '<p class="text-[11px] text-zinc-700 p-2">No projects configured</p>'; return; }
  el.innerHTML = projects.map(p =>
    '<div class="hero-glass rounded-xl p-3.5 fade-up">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-[13px] font-semibold text-white">'+esc(p.name)+'</span>' +
        '<span class="badge bg-zinc-800 text-zinc-400">'+esc(p.framework)+'</span>' +
      '</div>' +
      '<div class="flex flex-wrap gap-1.5">' +
        p.modules.map(m => '<span class="badge '+modCls(m)+'">'+m+'</span>').join('') +
      '</div>' +
    '</div>'
  ).join('');
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  if (!items?.length) { el.innerHTML = '<p class="p-5 text-[11px] text-zinc-700">No improvements yet. Run the agent to get started.</p>'; return; }
  el.innerHTML = items.map(h => {
    const sc = h.status === 'success' ? 'text-success bg-success/10' : h.status === 'failed' ? 'text-danger bg-danger/10' : 'text-zinc-400 bg-zinc-800';
    const icon = h.status === 'success' ? '\\u2713' : h.status === 'failed' ? '\\u2717' : '\\u2014';
    const time = timeAgo(h.timestamp);
    return '<div class="px-5 py-3.5 hover:bg-white/[0.015] transition-colors fade-up">' +
      '<div class="flex items-center justify-between mb-1.5">' +
        '<div class="flex items-center gap-2">' +
          '<span class="badge '+sc+'">'+icon+' '+h.status+'</span>' +
          '<span class="badge '+modCls(h.module)+'">'+h.module+'</span>' +
          '<span class="text-[11px] text-zinc-600">'+esc(h.project)+'</span>' +
        '</div>' +
        '<span class="text-[10px] text-zinc-700 mono" data-tip="'+new Date(h.timestamp).toLocaleString()+'">'+time+'</span>' +
      '</div>' +
      '<p class="text-[13px] text-zinc-300 leading-snug">'+esc(h.summary?.slice(0,140))+'</p>' +
      (h.branch ? '<p class="text-[10px] text-brand-400/50 mono mt-1.5">'+esc(h.branch)+'</p>' : '') +
    '</div>';
  }).join('');
}

function renderMemory(store) {
  const el = document.getElementById('memory-panel');
  if (!store?.projects || Object.keys(store.projects).length === 0) {
    el.innerHTML = '<div class="hero-glass rounded-xl p-4 text-center"><p class="text-[11px] text-zinc-600">No memory yet</p><p class="text-[10px] text-zinc-700 mt-1">Run the agent to start building memory</p></div>';
    return;
  }
  let html = '';
  for (const [name, proj] of Object.entries(store.projects)) {
    html += '<div class="hero-glass rounded-xl p-3.5 fade-up">';
    html += '<div class="flex items-center justify-between mb-2.5">';
    html += '<span class="text-[13px] font-semibold text-white">'+esc(name)+'</span>';
    html += '<span class="text-[10px] text-zinc-600 mono">'+proj.totalRuns+' runs</span>';
    html += '</div>';
    for (const [mod, m] of Object.entries(proj.modules || {})) {
      const rate = m.totalAttempts > 0 ? Math.round((m.totalSuccesses/m.totalAttempts)*100) : 0;
      const rc = rate >= 70 ? 'text-success' : rate >= 40 ? 'text-warning' : 'text-danger';
      const barW = Math.max(4, rate);
      html += '<div class="mb-2">';
      html += '<div class="flex items-center justify-between mb-1">';
      html += '<span class="badge '+modCls(mod)+'">'+mod+'</span>';
      html += '<span class="text-[10px] mono '+rc+'">'+rate+'%</span>';
      html += '</div>';
      html += '<div class="h-1 bg-zinc-800 rounded-full overflow-hidden"><div class="h-full rounded-full transition-all" style="width:'+barW+'%;background:'+modColor(mod)+'"></div></div>';
      if (m.fragileFiles?.length) {
        html += '<p class="text-[9px] text-danger/50 mt-1 flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'+m.fragileFiles.slice(0,2).join(', ')+'</p>';
      }
      html += '</div>';
    }
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderConfig(cfg) {
  const el = document.getElementById('config-panel');
  el.innerHTML =
    '<div class="space-y-2 text-[11px]">' +
    row('Agent', cfg.agent?.name || 'AutoDev') +
    row('Schedule', cfg.agent?.schedule || '—') +
    row('Dry Run', cfg.agent?.dryRun ? '<span class="text-warning">Yes</span>' : '<span class="text-success">No</span>') +
    row('LLM', cfg.llm?.defaultModel || 'Smart Router') +
    row('Notifications', cfg.notifications?.channels + ' channel(s)') +
    row('Git Author', cfg.git?.authorName || '—') +
    '</div>';
}

function row(label, val) {
  return '<div class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">' +
    '<span class="text-zinc-500">'+label+'</span>' +
    '<span class="text-zinc-300 mono text-[10px]">'+val+'</span></div>';
}

function renderRing(pct) {
  const el = document.getElementById('rate-ring');
  const r = 14, c = 2 * Math.PI * r, offset = c - (pct/100)*c;
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  el.innerHTML = '<svg width="36" height="36" class="progress-ring"><circle cx="18" cy="18" r="'+r+'" fill="none" stroke="#27272a" stroke-width="3"/><circle cx="18" cy="18" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+offset+'" style="transition:stroke-dashoffset 1s ease"/></svg>';
}

function renderUptime(s) {
  if (!s) return;
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  document.getElementById('uptime-display').textContent = 'Uptime: '+h+'h '+m+'m';
}

// ── Helpers ──────────────────────────
function modCls(m) {
  return { security:'text-red-300 bg-red-500/10', performance:'text-amber-300 bg-amber-500/10', seo:'text-blue-300 bg-blue-500/10', content:'text-emerald-300 bg-emerald-500/10', quality:'text-purple-300 bg-purple-500/10' }[m] || 'text-zinc-300 bg-zinc-800';
}
function modColor(m) {
  return { security:'#ef4444', performance:'#f59e0b', seo:'#3b82f6', content:'#22c55e', quality:'#a78bfa' }[m] || '#71717a';
}
function timeAgo(ts) {
  const s = Math.floor((Date.now()-new Date(ts).getTime())/1000);
  if (s < 60) return s+'s ago';
  if (s < 3600) return Math.floor(s/60)+'m ago';
  if (s < 86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Init ─────────────────────────────
connectSSE();
loadStatus();
loadHistory();
loadMemory();
loadConfig();
setInterval(loadStatus, 15000);
setInterval(loadHistory, 30000);
setInterval(loadMemory, 60000);
</script>
</body>
</html>`
}
