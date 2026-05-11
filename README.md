# Minecraft AFK Bot Pro v2.0

Professional Minecraft AFK bot with Anti-Kick engine and real-time web dashboard.  
Designed for **24/7 deployment on Railway.app**.

---

## Features

- **Anti-AFK Engine** — 9 different movement patterns, auto-rotates every 30s
- **Auto Reconnect** — reconnects automatically on kick or disconnect
- **Web Dashboard** — real-time status panel (health, position, uptime, logs)
- **Chat Commands** — `!status`, `!ping`, `!pos`
- **Death Handler** — auto respawns on death
- **Ping Tracker** — live latency monitoring

---

## Configuration (`config.json`)

```json
{
  "bot": {
    "ip":   "your.server.ip",
    "port": 25565,
    "name": "YourBotName"
  },
  "reconnect": {
    "enabled":     true,
    "delay":       5000,
    "maxAttempts": 0
  },
  "antiAfk": {
    "enabled":  true,
    "interval": 30000
  },
  "dashboard": {
    "enabled": true,
    "port":    3000
  },
  "chat": {
    "respondToCommands": true,
    "prefix": "!"
  }
}
```

---

## Local Usage (Windows)

1. Install [Node.js LTS](https://nodejs.org)
2. Edit `config.json` with your server IP and bot name
3. Double-click `START.BAT`
4. Open `http://localhost:3000` for the dashboard

---

## Deploy to Railway (7/24 Free Hosting)

> Railway runs your bot as a persistent process — unlike Vercel (serverless).

### Step 1 — Create account
Go to [railway.app](https://railway.app) and sign up with GitHub.

### Step 2 — New Project
Click **New Project** → **Deploy from GitHub repo**  
(or use **Deploy from local** and upload this folder)

### Step 3 — Upload files
If deploying from local:
- Click **New Project** → **Empty Project**
- Click **+ New Service** → **GitHub Repo** or drag & drop

### Step 4 — Set environment (optional)
Railway auto-detects `package.json` and runs `npm start`.  
No extra config needed — `railway.json` handles everything.

### Step 5 — Get your dashboard URL
In your Railway project → **Settings** → **Networking** → **Generate Domain**  
Your dashboard will be live at `https://your-app.up.railway.app`

### Step 6 — Done
Bot starts automatically. Check the Railway logs tab to verify connection.

---

## Chat Commands (in-game)

| Command   | Response                              |
|-----------|---------------------------------------|
| `!status` | HP, hunger, total anti-AFK moves      |
| `!ping`   | Current latency in ms                 |
| `!pos`    | Current X/Y/Z position                |

---

## File Structure

```
├── index.js          — Main bot logic
├── config.json       — All settings
├── railway.json      — Railway deployment config
├── Procfile          — Process definition
├── START.BAT         — Local Windows launcher
└── src/
    ├── logger.js     — Color-coded console logger
    ├── antiafk.js    — Anti-AFK movement engine
    └── dashboard.js  — Express web dashboard
```

---

## License

ISC — Free to use and modify.
