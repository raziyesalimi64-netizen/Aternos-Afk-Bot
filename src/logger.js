const COLORS = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

const LEVELS = {
  INFO:    { color: COLORS.cyan,    label: 'INFO   ' },
  SUCCESS: { color: COLORS.green,   label: 'SUCCESS' },
  WARN:    { color: COLORS.yellow,  label: 'WARN   ' },
  ERROR:   { color: COLORS.red,     label: 'ERROR  ' },
  AFKBOT:  { color: COLORS.magenta, label: 'AFK-BOT' },
  MOVE:    { color: COLORS.blue,    label: 'MOVE   ' },
  NET:     { color: COLORS.gray,    label: 'NETWORK' },
  DASH:    { color: COLORS.white,   label: 'DASH   ' },
};

function timestamp() {
  const now = new Date();
  return now.toLocaleTimeString('tr-TR', { hour12: false });
}

function log(level, message) {
  const l = LEVELS[level] || LEVELS.INFO;
  const ts = `${COLORS.gray}[${timestamp()}]${COLORS.reset}`;
  const tag = `${l.color}${COLORS.bright}[${l.label}]${COLORS.reset}`;
  console.log(`${ts} ${tag} ${message}`);
}

function banner() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}`);
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║        MINECRAFT PRO AFK BOT v2.0        ║');
  console.log('  ║        by KAYRAA  •  Node.js             ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log(`${COLORS.reset}\n`);
}

module.exports = { log, banner, COLORS };
