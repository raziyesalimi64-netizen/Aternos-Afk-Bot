const mineflayer       = require('mineflayer');
const fs               = require('fs');
const { log, banner }  = require('./src/logger');
const AntiAFK          = require('./src/antiafk');
const Dashboard        = require('./src/dashboard');

// ── Config ────────────────────────────────────────────────────────────────────
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
const dash = new Dashboard(config);
if (config.dashboard.enabled) dash.start();

// ── State ─────────────────────────────────────────────────────────────────────
let reconnectCount  = 0;
let reconnectTimer  = null;
let antiAfk         = null;
let pingInterval    = null;
let trackerInterval = null;

// ── Create Bot ────────────────────────────────────────────────────────────────
function createBot() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  banner();
  log('INFO', `Target  : ${config.bot.ip}:${config.bot.port}`);
  log('INFO', `Username: ${config.bot.name}`);
  log('INFO', 'Initiating connection...\n');

  const bot = mineflayer.createBot({
    host:     config.bot.ip,
    port:     parseInt(config.bot.port),
    username: config.bot.name,
    version:  config.bot.version  || false,
    auth:     config.bot.auth     || 'offline',
    keepAlive: true,
    checkTimeoutInterval: 30000,
  });

  // ── login ─────────────────────────────────────────────────────────────────
  bot.on('login', () => {
    log('SUCCESS', `Connected → ${config.bot.name} on ${config.bot.ip}:${config.bot.port}`);
    dash.setStatus({ online: true, connectedAt: Date.now(), reconnects: reconnectCount });
    dash.addLog('SUCCESS', `Connected to ${config.bot.ip}:${config.bot.port}`);
  });

  // ── spawn ─────────────────────────────────────────────────────────────────
  bot.on('spawn', () => {
    log('SUCCESS', 'Spawned in world — starting Anti-AFK engine...');
    dash.addLog('SUCCESS', 'Spawned in world');

    // Anti-AFK
    if (config.antiAfk.enabled) {
      antiAfk = new AntiAFK(bot, config.antiAfk);
      antiAfk.start();
    }

    // Position + health tracker (every 4s)
    trackerInterval = setInterval(() => {
      try {
        const pos = bot.entity?.position || { x:0, y:0, z:0 };
        dash.setStatus({
          health:   bot.health   ?? 0,
          food:     bot.food     ?? 0,
          position: { x: pos.x, y: pos.y, z: pos.z },
          antiAfk:  antiAfk?.getStats() ?? {},
        });
      } catch (_) {}
    }, 4000);

    // Ping tracker (every 10s)
    pingInterval = setInterval(() => {
      try {
        const ping = bot._client?.latency ?? 0;
        dash.setStatus({ ping });
      } catch (_) {}
    }, 10000);
  });

  // ── health ────────────────────────────────────────────────────────────────
  bot.on('health', () => {
    const hp = (bot.health ?? 0).toFixed(1);
    const fd = bot.food ?? 0;
    log('INFO', `Health: ${hp}/20  |  Hunger: ${fd}/20`);
    dash.addLog('INFO', `Health: ${hp}/20  Hunger: ${fd}/20`);
  });

  // ── chat ──────────────────────────────────────────────────────────────────
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    log('INFO', `[CHAT] <${username}> ${message}`);
    dash.addLog('INFO', `<${username}> ${message}`);

    if (!config.chat.respondToCommands) return;
    const pfx = config.chat.prefix;
    if (!message.startsWith(pfx)) return;
    const cmd = message.slice(pfx.length).trim().toLowerCase();

    switch (cmd) {
      case 'status':
        bot.chat(`[AFK Bot] Online | HP: ${(bot.health??0).toFixed(1)}/20 | Moves: ${antiAfk?.totalMoves ?? 0}`);
        break;
      case 'ping':
        bot.chat(`[AFK Bot] Pong! Latency: ${bot._client?.latency ?? '?'}ms`);
        break;
      case 'pos': {
        const p = bot.entity?.position;
        if (p) bot.chat(`[AFK Bot] Pos: X${p.x.toFixed(0)} Y${p.y.toFixed(0)} Z${p.z.toFixed(0)}`);
        break;
      }
    }
  });

  // ── death ─────────────────────────────────────────────────────────────────
  bot.on('death', () => {
    log('WARN', 'Bot died — attempting respawn...');
    dash.addLog('WARN', 'Bot died — respawning');
    bot.respawn();
  });

  // ── error ─────────────────────────────────────────────────────────────────
  bot.on('error', (err) => {
    log('ERROR', `Socket error: ${err.message}`);
    dash.addLog('ERROR', err.message);
  });

  // ── kicked ────────────────────────────────────────────────────────────────
  bot.on('kicked', (reason) => {
    let msg = reason;
    try { msg = JSON.parse(reason)?.text ?? reason; } catch (_) {}
    log('WARN', `Kicked from server: ${msg}`);
    dash.addLog('WARN', `Kicked: ${msg}`);
    cleanup();
    scheduleReconnect();
  });

  // ── end ───────────────────────────────────────────────────────────────────
  bot.on('end', (reason) => {
    log('NET', `Connection ended${reason ? ': ' + reason : ''}`);
    dash.addLog('NET', `Disconnected${reason ? ': ' + reason : ''}`);
    dash.setStatus({ online: false });
    cleanup();
    scheduleReconnect();
  });

  function cleanup() {
    if (antiAfk)         { antiAfk.stop(); antiAfk = null; }
    if (trackerInterval) { clearInterval(trackerInterval); trackerInterval = null; }
    if (pingInterval)    { clearInterval(pingInterval);    pingInterval    = null; }
    try { bot.quit(); } catch (_) {}
  }
}

// ── Reconnect Scheduler ───────────────────────────────────────────────────────
function scheduleReconnect() {
  if (!config.reconnect.enabled || reconnectTimer) return;
  const max = config.reconnect.maxAttempts;
  if (max > 0 && reconnectCount >= max) {
    log('ERROR', `Max reconnect attempts (${max}) reached. Stopping.`);
    return;
  }
  reconnectCount++;
  const delay = config.reconnect.delay;
  log('NET', `Reconnecting in ${delay / 1000}s... (attempt #${reconnectCount})`);
  dash.addLog('NET', `Reconnect in ${delay/1000}s (attempt #${reconnectCount})`);
  reconnectTimer = setTimeout(() => { reconnectTimer = null; createBot(); }, delay);
}

// ── Start ─────────────────────────────────────────────────────────────────────
createBot();
