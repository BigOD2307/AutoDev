/**
 * AutoDev Dashboard — Single-page HTML UI
 * Dark theme, Tailwind CSS via CDN, real-time SSE logs
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
            brand: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95' },
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .log-scroll { max-height: 400px; overflow-y: auto; scroll-behavior: smooth; }
    .log-scroll::-webkit-scrollbar { width: 6px; }
    .log-scroll::-webkit-scrollbar-track { background: #1e1e2e; }
    .log-scroll::-webkit-scrollbar-thumb { background: #45475a; border-radius: 3px; }
    @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
  </style>
</head>
<body class="bg-[#0a0a0f] text-gray-200 min-h-screen">

  <!-- Header -->
  <header class="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">AutoDev</h1>
          <p class="text-xs text-gray-500" id="subtitle">Loading...</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div id="status-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
          <span class="w-2 h-2 rounded-full bg-gray-500"></span>
          Connecting...
        </div>
        <button onclick="triggerRun()" id="run-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
          Run Now
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-8 space-y-6">

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-grid">
      <div class="bg-[#12121a] border border-white/5 rounded-xl p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Runs</p>
        <p class="text-2xl font-bold text-white" id="stat-total">—</p>
      </div>
      <div class="bg-[#12121a] border border-white/5 rounded-xl p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Success Rate</p>
        <p class="text-2xl font-bold text-emerald-400" id="stat-rate">—</p>
      </div>
      <div class="bg-[#12121a] border border-white/5 rounded-xl p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Successes</p>
        <p class="text-2xl font-bold text-emerald-400" id="stat-success">—</p>
      </div>
      <div class="bg-[#12121a] border border-white/5 rounded-xl p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Failed</p>
        <p class="text-2xl font-bold text-red-400" id="stat-failed">—</p>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-6">

      <!-- Left: Projects + Memory -->
      <div class="space-y-6">

        <!-- Projects -->
        <div class="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/5">
            <h2 class="text-sm font-semibold text-white">Projects</h2>
          </div>
          <div id="projects-list" class="p-4 space-y-3">
            <p class="text-xs text-gray-600">Loading...</p>
          </div>
        </div>

        <!-- Memory -->
        <div class="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/5">
            <h2 class="text-sm font-semibold text-white">Agent Memory</h2>
          </div>
          <div id="memory-panel" class="p-4 space-y-2">
            <p class="text-xs text-gray-600">Loading...</p>
          </div>
        </div>
      </div>

      <!-- Center + Right: History + Logs -->
      <div class="md:col-span-2 space-y-6">

        <!-- Recent Improvements -->
        <div class="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-white">Recent Improvements</h2>
            <button onclick="loadHistory()" class="text-xs text-brand-400 hover:text-brand-300">Refresh</button>
          </div>
          <div id="history-list" class="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            <p class="p-4 text-xs text-gray-600">Loading...</p>
          </div>
        </div>

        <!-- Live Logs -->
        <div class="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-white flex items-center gap-2">
              Live Logs
              <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" id="sse-dot"></span>
            </h2>
            <button onclick="clearLogs()" class="text-xs text-gray-500 hover:text-gray-300">Clear</button>
          </div>
          <div id="log-container" class="log-scroll p-4 mono text-xs space-y-0.5 bg-[#0d0d15]">
            <p class="text-gray-600">Waiting for events...</p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/5 mt-12">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <p class="text-xs text-gray-600">AutoDev Agent by <a href="https://dickenai.com" class="text-brand-400 hover:text-brand-300">Dicken AI</a></p>
      <p class="text-xs text-gray-600" id="uptime">—</p>
    </div>
  </footer>

<script>
// ─── State ────────────────────────────────────────
let logs = [];
const MAX_LOGS = 200;

// ─── SSE Connection ───────────────────────────────
function connectSSE() {
  const sse = new EventSource('/api/events');
  const dot = document.getElementById('sse-dot');

  sse.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.type === 'log') addLog(payload.data);
      if (payload.type === 'status') updateStatus(payload.status);
      if (payload.type === 'connected') updateStatus(payload.status);
    } catch {}
  };

  sse.onerror = () => {
    dot.className = 'w-2 h-2 rounded-full bg-red-500';
    setTimeout(connectSSE, 3000);
  };

  sse.onopen = () => {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 pulse-dot';
  };
}

// ─── Logs ─────────────────────────────────────────
function addLog(text) {
  logs.push(text);
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
  renderLogs();
}

function renderLogs() {
  const el = document.getElementById('log-container');
  el.innerHTML = logs.map(l => {
    let cls = 'text-gray-400';
    if (l.includes('[ERROR]')) cls = 'text-red-400';
    else if (l.includes('[SUCCESS]')) cls = 'text-emerald-400';
    else if (l.includes('[WARN]')) cls = 'text-amber-400';
    else if (l.includes('[DEBUG]')) cls = 'text-gray-600';
    return '<div class="' + cls + ' leading-5 fade-in">' + escapeHtml(l) + '</div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function clearLogs() { logs = []; renderLogs(); }

// ─── Status ───────────────────────────────────────
function updateStatus(status) {
  const badge = document.getElementById('status-badge');
  const btn = document.getElementById('run-btn');
  const colors = {
    idle: { bg:'bg-emerald-500/10', text:'text-emerald-400', dot:'bg-emerald-500', label:'Idle' },
    running: { bg:'bg-amber-500/10', text:'text-amber-400', dot:'bg-amber-500 pulse-dot', label:'Running...' },
    error: { bg:'bg-red-500/10', text:'text-red-400', dot:'bg-red-500', label:'Error' },
  };
  const c = colors[status] || colors.idle;
  badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ' + c.bg + ' ' + c.text;
  badge.innerHTML = '<span class="w-2 h-2 rounded-full ' + c.dot + '"></span>' + c.label;
  btn.disabled = status === 'running';
}

// ─── API Calls ────────────────────────────────────
async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    document.getElementById('stat-total').textContent = data.stats.total;
    document.getElementById('stat-rate').textContent = data.stats.successRate + '%';
    document.getElementById('stat-success').textContent = data.stats.successes;
    document.getElementById('stat-failed').textContent = data.stats.failures;
    document.getElementById('subtitle').textContent = data.agent.schedule + (data.agent.dryRun ? ' (dry run)' : '');
    updateStatus(data.agent.status);
    renderProjects(data.projects);
    updateUptime(data.agent.uptime);
  } catch {}
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history?limit=20');
    const data = await res.json();
    renderHistory(data);
  } catch {}
}

async function loadMemory() {
  try {
    const res = await fetch('/api/memory');
    const data = await res.json();
    renderMemory(data);
  } catch {}
}

async function triggerRun() {
  try {
    await fetch('/api/run', { method: 'POST' });
    updateStatus('running');
  } catch {}
}

// ─── Renderers ────────────────────────────────────
function renderProjects(projects) {
  const el = document.getElementById('projects-list');
  if (!projects || projects.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-600">No projects configured</p>';
    return;
  }
  el.innerHTML = projects.map(p =>
    '<div class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">' +
      '<div>' +
        '<p class="text-sm font-medium text-white">' + escapeHtml(p.name) + '</p>' +
        '<p class="text-xs text-gray-500 mt-0.5">' + escapeHtml(p.framework) + '</p>' +
      '</div>' +
      '<div class="flex gap-1">' +
        p.modules.map(m =>
          '<span class="px-2 py-0.5 text-[10px] font-medium rounded-full ' + moduleColor(m) + '">' + m + '</span>'
        ).join('') +
      '</div>' +
    '</div>'
  ).join('');
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  if (!items || items.length === 0) {
    el.innerHTML = '<p class="p-4 text-xs text-gray-600">No improvements yet</p>';
    return;
  }
  el.innerHTML = items.map(h => {
    const statusCls = h.status === 'success' ? 'text-emerald-400 bg-emerald-500/10' :
                      h.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                      'text-gray-400 bg-gray-500/10';
    const time = new Date(h.timestamp).toLocaleString();
    return '<div class="px-5 py-3 hover:bg-white/[0.02] transition-colors">' +
      '<div class="flex items-center justify-between">' +
        '<div class="flex items-center gap-2">' +
          '<span class="px-2 py-0.5 text-[10px] font-medium rounded-full ' + statusCls + '">' + h.status + '</span>' +
          '<span class="px-2 py-0.5 text-[10px] font-medium rounded-full ' + moduleColor(h.module) + '">' + h.module + '</span>' +
          '<span class="text-xs text-gray-500">' + escapeHtml(h.project) + '</span>' +
        '</div>' +
        '<span class="text-[10px] text-gray-600 mono">' + time + '</span>' +
      '</div>' +
      '<p class="text-sm text-gray-300 mt-1">' + escapeHtml(h.summary.slice(0, 120)) + '</p>' +
      (h.branch ? '<p class="text-[10px] text-brand-400/60 mono mt-1">' + escapeHtml(h.branch) + '</p>' : '') +
    '</div>';
  }).join('');
}

function renderMemory(store) {
  const el = document.getElementById('memory-panel');
  if (!store || !store.projects || Object.keys(store.projects).length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-600">No memory yet — run the agent first</p>';
    return;
  }
  let html = '';
  for (const [name, project] of Object.entries(store.projects)) {
    html += '<div class="p-3 bg-white/[0.02] rounded-lg">';
    html += '<p class="text-sm font-medium text-white">' + escapeHtml(name) + '</p>';
    html += '<p class="text-[10px] text-gray-500 mt-1">Runs: ' + project.totalRuns + '</p>';
    for (const [mod, mem] of Object.entries(project.modules || {})) {
      const rate = mem.totalAttempts > 0 ? Math.round((mem.totalSuccesses / mem.totalAttempts) * 100) : 0;
      const rateCls = rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400';
      html += '<div class="flex items-center justify-between mt-1">';
      html += '<span class="text-[10px] ' + moduleColor(mod) + ' px-2 py-0.5 rounded-full">' + mod + '</span>';
      html += '<span class="text-[10px] mono ' + rateCls + '">' + rate + '% (' + mem.totalSuccesses + '/' + mem.totalAttempts + ')</span>';
      html += '</div>';
      if (mem.fragileFiles && mem.fragileFiles.length > 0) {
        html += '<p class="text-[10px] text-red-400/60 mt-0.5">Fragile: ' + mem.fragileFiles.slice(0,2).join(', ') + '</p>';
      }
    }
    html += '</div>';
  }
  el.innerHTML = html;
}

function moduleColor(mod) {
  const colors = {
    security: 'text-red-300 bg-red-500/10',
    performance: 'text-amber-300 bg-amber-500/10',
    seo: 'text-blue-300 bg-blue-500/10',
    content: 'text-emerald-300 bg-emerald-500/10',
    quality: 'text-purple-300 bg-purple-500/10',
  };
  return colors[mod] || 'text-gray-300 bg-gray-500/10';
}

function updateUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  document.getElementById('uptime').textContent = 'Uptime: ' + h + 'h ' + m + 'm';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Init ─────────────────────────────────────────
connectSSE();
loadStatus();
loadHistory();
loadMemory();
setInterval(loadStatus, 30000);
setInterval(loadHistory, 60000);
setInterval(loadMemory, 60000);
</script>
</body>
</html>`
}
