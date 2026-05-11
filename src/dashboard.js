const express = require('express');
const { log }  = require('./logger');

class Dashboard {
  constructor(config) {
    this.config  = config;
    this.app     = express();
    this.server  = null;
    this.startedAt = Date.now();
    this.state   = {
      online:      false,
      username:    config.bot.name,
      server:      `${config.bot.ip}:${config.bot.port}`,
      connectedAt: null,
      reconnects:  0,
      health:      0,
      food:        0,
      ping:        0,
      position:    { x: 0, y: 0, z: 0 },
      antiAfk:     { active: false, totalMoves: 0, lastMove: '-', intervalSec: 30 },
      logs:        [],
    };
  }

  setStatus(data) { Object.assign(this.state, data); }

  addLog(level, msg) {
    this.state.logs.unshift({
      ts:    new Date().toLocaleTimeString('tr-TR', { hour12: false }),
      level, msg,
    });
    if (this.state.logs.length > 80) this.state.logs.length = 80;
  }

  start() {
    this.app.use(express.json());

    this.app.get('/api/status', (_, res) => {
      let uptime = '00:00:00';
      if (this.state.connectedAt) {
        const s = Math.floor((Date.now() - this.state.connectedAt) / 1000);
        uptime = [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
          .map(n => String(n).padStart(2,'0')).join(':');
      }
      res.json({ ...this.state, uptime });
    });

    this.app.get('/', (_, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(HTML);
    });

    const port = this.config.dashboard.port;
    this.server = this.app.listen(port, '0.0.0.0', () =>
      log('DASH', `Dashboard → http://localhost:${port}`)
    );
  }
}

const HTML = /* html */`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AFK Bot — Control Panel</title>
<style>
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

:root {
  --bg0: #07090f;
  --bg1: #0d111c;
  --bg2: #121828;
  --bg3: #1a2235;
  --border: #1f2d45;
  --accent: #3b82f6;
  --accent2: #6366f1;
  --green: #22c55e;
  --red:   #ef4444;
  --amber: #f59e0b;
  --text:  #e2e8f0;
  --muted: #64748b;
  --mono:  'JetBrains Mono', 'Fira Code', monospace;
}

body {
  background: var(--bg0);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

/* ── Topbar ─────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 56px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 7px;
  display: grid; place-items: center;
  font-size: 15px; font-weight: 900;
  color: #fff;
  letter-spacing: -.05em;
}
.brand-name { font-weight: 700; font-size: 15px; letter-spacing: -.01em; }
.brand-ver  { font-size: 11px; color: var(--muted); margin-left: 4px; }

.status-pill {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .02em;
  border: 1px solid transparent;
  transition: all .3s;
}
.status-pill.online  { background:#16a34a18; border-color:#16a34a40; color:var(--green); }
.status-pill.offline { background:#dc262618; border-color:#dc262640; color:var(--red); }
.status-pill.connecting { background:#d9770618; border-color:#d9770640; color:var(--amber); }

.indicator {
  width: 7px; height: 7px; border-radius: 50%;
  background: currentColor;
}
.indicator.pulse { animation: pulse 2s infinite; }
@keyframes pulse {
  0%,100% { opacity:1; box-shadow: 0 0 0 0 currentColor; }
  50% { opacity:.6; box-shadow: 0 0 0 4px transparent; }
}

/* ── Layout ─────────────────────────────────────────── */
.page { max-width: 1180px; margin: 0 auto; padding: 28px 24px; }

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--muted);
  margin-bottom: 14px;
}

/* ── Stat Row ───────────────────────────────────────── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--bg1);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
}
.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--muted);
  margin-bottom: 8px;
}
.stat-value {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}
.stat-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 5px;
}
.stat-accent { color: var(--accent); }

/* ── Main Grid ──────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.panel {
  background: var(--bg1);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--muted);
}
.panel-body { padding: 20px; }

/* ── Bar ────────────────────────────────────────────── */
.bar-group { margin-bottom: 14px; }
.bar-group:last-child { margin-bottom: 0; }
.bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--muted);
}
.bar-meta strong { color: var(--text); }
.bar-track {
  background: var(--bg3);
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

/* ── Position ───────────────────────────────────────── */
.pos-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 10px;
  margin-top: 16px;
}
.pos-cell {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.pos-axis {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--muted);
  margin-bottom: 4px;
}
.pos-val {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
}

/* ── AntiAFK ────────────────────────────────────────── */
.afk-stat-row {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.afk-stat {
  background: var(--bg3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.afk-stat-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing:.08em; margin-bottom:5px; }
.afk-stat-val { font-family: var(--mono); font-size: 18px; font-weight:700; }
.afk-last {
  background: var(--bg3);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--muted);
}
.afk-last span { color: var(--text); font-weight: 600; }

/* ── Log ────────────────────────────────────────────── */
.log-panel { grid-column: span 2; }
.log-list {
  font-family: var(--mono);
  font-size: 12px;
  height: 240px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.log-list::-webkit-scrollbar { width: 5px; }
.log-list::-webkit-scrollbar-track { background: transparent; }
.log-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
.log-row {
  display: grid;
  grid-template-columns: 70px 70px 1fr;
  gap: 0;
  padding: 5px 20px;
  border-bottom: 1px solid var(--border);
  transition: background .15s;
}
.log-row:hover { background: var(--bg2); }
.log-ts   { color: var(--muted); }
.log-lvl  { font-weight: 700; }
.log-lvl.INFO    { color: #60a5fa; }
.log-lvl.SUCCESS { color: var(--green); }
.log-lvl.WARN    { color: var(--amber); }
.log-lvl.ERROR   { color: var(--red); }
.log-lvl.MOVE    { color: #a78bfa; }
.log-lvl.NET     { color: var(--muted); }
.log-msg  { color: #94a3b8; }

/* ── Footer ─────────────────────────────────────────── */
.footer {
  padding: 20px 0 8px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 860px) {
  .stat-row  { grid-template-columns: repeat(2,1fr); }
  .main-grid { grid-template-columns: 1fr; }
  .log-panel { grid-column: span 1; }
}
@media (max-width: 520px) {
  .stat-row { grid-template-columns: 1fr 1fr; }
  .topbar   { padding: 0 16px; }
  .page     { padding: 16px 12px; }
}
</style>
</head>
<body>

<nav class="topbar">
  <div class="topbar-brand">
    <div class="logo">MC</div>
    <div>
      <span class="brand-name">AFK Bot</span>
      <span class="brand-ver">v2.0</span>
    </div>
  </div>
  <div id="pill" class="status-pill connecting">
    <div class="indicator pulse"></div>
    <span id="pill-text">Connecting...</span>
  </div>
</nav>

<main class="page">

  <p class="section-title">Overview</p>
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-label">Uptime</div>
      <div class="stat-value stat-accent" id="s-uptime">--:--:--</div>
      <div class="stat-sub">connected duration</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Username</div>
      <div class="stat-value" id="s-user" style="font-size:16px">—</div>
      <div class="stat-sub" id="s-server">—</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Reconnects</div>
      <div class="stat-value" id="s-reconnects">0</div>
      <div class="stat-sub">total reconnect count</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Anti-AFK Moves</div>
      <div class="stat-value" id="s-moves">0</div>
      <div class="stat-sub">total actions taken</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ping</div>
      <div class="stat-value" id="s-ping">—</div>
      <div class="stat-sub">ms latency</div>
    </div>
  </div>

  <p class="section-title">Details</p>
  <div class="main-grid">

    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Bot Health</span>
      </div>
      <div class="panel-body">
        <div class="bar-group">
          <div class="bar-meta"><strong>Health</strong><span id="hp-val">0 / 20</span></div>
          <div class="bar-track">
            <div class="bar-fill" id="hp-bar" style="width:0%;background:#ef4444;"></div>
          </div>
        </div>
        <div class="bar-group">
          <div class="bar-meta"><strong>Hunger</strong><span id="fd-val">0 / 20</span></div>
          <div class="bar-track">
            <div class="bar-fill" id="fd-bar" style="width:0%;background:#f59e0b;"></div>
          </div>
        </div>
        <div class="pos-grid">
          <div class="pos-cell"><div class="pos-axis">X</div><div class="pos-val" id="pos-x">0</div></div>
          <div class="pos-cell"><div class="pos-axis">Y</div><div class="pos-val" id="pos-y">0</div></div>
          <div class="pos-cell"><div class="pos-axis">Z</div><div class="pos-val" id="pos-z">0</div></div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Anti-AFK Engine</span>
        <span id="afk-badge" style="font-size:11px;font-weight:700;color:var(--muted)">INACTIVE</span>
      </div>
      <div class="panel-body">
        <div class="afk-stat-row">
          <div class="afk-stat">
            <div class="afk-stat-lbl">Total Moves</div>
            <div class="afk-stat-val" id="afk-moves">0</div>
          </div>
          <div class="afk-stat">
            <div class="afk-stat-lbl">Interval</div>
            <div class="afk-stat-val" id="afk-interval">30s</div>
          </div>
          <div class="afk-stat">
            <div class="afk-stat-lbl">Status</div>
            <div class="afk-stat-val" id="afk-status" style="font-size:13px">—</div>
          </div>
        </div>
        <div class="afk-last">Last action: <span id="afk-last">—</span></div>
      </div>
    </div>

    <div class="panel log-panel">
      <div class="panel-header">
        <span class="panel-title">Live Log</span>
        <span style="font-size:11px;color:var(--muted)" id="log-count">0 entries</span>
      </div>
      <div class="log-list" id="log-list">
        <div class="log-row">
          <span class="log-ts">—</span>
          <span class="log-lvl INFO">INFO</span>
          <span class="log-msg">Waiting for connection...</span>
        </div>
      </div>
    </div>

  </div>
</main>

<footer class="footer">AFK Bot Pro v2.0 &mdash; Powered by Node.js &amp; Mineflayer</footer>

<script>
const $ = id => document.getElementById(id);

async function refresh() {
  try {
    const d = await fetch('/api/status').then(r => r.json());

    // Pill
    const pill = $('pill');
    if (d.online) {
      pill.className = 'status-pill online';
      pill.innerHTML = '<div class="indicator pulse"></div><span>' + d.username + ' &mdash; Online</span>';
    } else {
      pill.className = 'status-pill offline';
      pill.innerHTML = '<div class="indicator"></div><span>Offline</span>';
    }

    $('s-uptime').textContent     = d.uptime || '--:--:--';
    $('s-user').textContent       = d.username || '—';
    $('s-server').textContent     = d.server   || '—';
    $('s-reconnects').textContent = d.reconnects ?? 0;
    $('s-moves').textContent      = d.antiAfk?.totalMoves ?? 0;
    $('s-ping').textContent       = d.ping ? d.ping + ' ms' : '—';

    const hp = d.health ?? 0, fd = d.food ?? 0;
    $('hp-val').textContent = hp.toFixed(1) + ' / 20';
    $('hp-bar').style.width = (hp / 20 * 100) + '%';
    $('fd-val').textContent = fd + ' / 20';
    $('fd-bar').style.width = (fd / 20 * 100) + '%';

    const pos = d.position || {};
    $('pos-x').textContent = (pos.x ?? 0).toFixed(1);
    $('pos-y').textContent = (pos.y ?? 0).toFixed(1);
    $('pos-z').textContent = (pos.z ?? 0).toFixed(1);

    const afk = d.antiAfk || {};
    $('afk-badge').textContent  = afk.active ? 'ACTIVE' : 'INACTIVE';
    $('afk-badge').style.color  = afk.active ? 'var(--green)' : 'var(--muted)';
    $('afk-moves').textContent    = afk.totalMoves ?? 0;
    $('afk-interval').textContent = (afk.intervalSec ?? 30) + 's';
    $('afk-status').textContent   = afk.active ? 'Running' : 'Stopped';
    $('afk-last').textContent     = afk.lastMove || '—';

    if (d.logs?.length) {
      $('log-count').textContent = d.logs.length + ' entries';
      $('log-list').innerHTML = d.logs.map(l =>
        '<div class="log-row">' +
        '<span class="log-ts">' + l.ts + '</span>' +
        '<span class="log-lvl ' + l.level + '">' + l.level + '</span>' +
        '<span class="log-msg">' + l.msg + '</span>' +
        '</div>'
      ).join('');
    }
  } catch(e) {}
}

refresh();
setInterval(refresh, 2000);
</script>
</body>
</html>`;

module.exports = Dashboard;
