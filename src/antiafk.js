const { log } = require('./logger');

const MOVEMENTS = [
  {
    name: 'İleri Yürüyüş',
    fn: (bot) => {
      bot.setControlState('forward', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('forward', false); r(); }, 1800));
    }
  },
  {
    name: 'Geri Yürüyüş',
    fn: (bot) => {
      bot.setControlState('back', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('back', false); r(); }, 1800));
    }
  },
  {
    name: 'Sağa Hareket',
    fn: (bot) => {
      bot.setControlState('right', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('right', false); r(); }, 1200));
    }
  },
  {
    name: 'Sola Hareket',
    fn: (bot) => {
      bot.setControlState('left', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('left', false); r(); }, 1200));
    }
  },
  {
    name: 'Zıplama',
    fn: (bot) => {
      bot.setControlState('jump', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('jump', false); r(); }, 600));
    }
  },
  {
    name: 'Sprint + Zıplama',
    fn: async (bot) => {
      bot.setControlState('sprint', true);
      bot.setControlState('forward', true);
      bot.setControlState('jump', true);
      await new Promise(r => setTimeout(r, 1400));
      bot.setControlState('sprint', false);
      bot.setControlState('forward', false);
      bot.setControlState('jump', false);
    }
  },
  {
    name: 'Çömelme (Sneak)',
    fn: (bot) => {
      bot.setControlState('sneak', true);
      return new Promise(r => setTimeout(() => { bot.setControlState('sneak', false); r(); }, 1000));
    }
  },
  {
    name: 'Kamera Döndürme',
    fn: async (bot) => {
      const yaw = bot.entity.yaw;
      await bot.look(yaw + Math.PI / 2, 0, true);
      await new Promise(r => setTimeout(r, 500));
      await bot.look(yaw - Math.PI / 2, 0, true);
      await new Promise(r => setTimeout(r, 500));
      await bot.look(yaw, 0, true);
    }
  },
  {
    name: 'Tam Tur (360°)',
    fn: async (bot) => {
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        await bot.look(bot.entity.yaw + (Math.PI * 2) / steps, 0, true);
        await new Promise(r => setTimeout(r, 150));
      }
    }
  },
];

class AntiAFK {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.interval = null;
    this.moveIndex = 0;
    this.totalMoves = 0;
    this.active = false;
  }

  start() {
    if (this.interval) this.stop();
    this.active = true;
    log('MOVE', `Anti-AFK motoru başlatıldı. (Her ${this.config.interval / 1000}sn'de bir)`);

    this.interval = setInterval(async () => {
      if (!this.active) return;
      try {
        // Tüm kontrol state'lerini önce temizle
        ['forward','back','left','right','jump','sneak','sprint'].forEach(s =>
          this.bot.setControlState(s, false)
        );

        const move = MOVEMENTS[this.moveIndex % MOVEMENTS.length];
        log('MOVE', `Hareket yapılıyor: ${move.name}`);
        await move.fn(this.bot);

        // Hareketten sonra temizle
        ['forward','back','left','right','jump','sneak','sprint'].forEach(s =>
          this.bot.setControlState(s, false)
        );

        this.moveIndex++;
        this.totalMoves++;
      } catch (err) {
        log('WARN', `Hareket hatası: ${err.message}`);
      }
    }, this.config.interval);
  }

  stop() {
    this.active = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    ['forward','back','left','right','jump','sneak','sprint'].forEach(s => {
      try { this.bot.setControlState(s, false); } catch (_) {}
    });
    log('MOVE', 'Anti-AFK motoru durduruldu.');
  }

  getStats() {
    return {
      active: this.active,
      totalMoves: this.totalMoves,
      lastMove: MOVEMENTS[(this.moveIndex - 1 + MOVEMENTS.length) % MOVEMENTS.length]?.name || '-',
      intervalSec: this.config.interval / 1000,
    };
  }
}

module.exports = AntiAFK;
