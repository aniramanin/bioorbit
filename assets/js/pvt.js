/*
 * BioOrbit — Psychomotor Vigilance Test (PVT-B style)
 * Brief 3-minute PVT as validated by Basner, Mollicone & Dinges (2011):
 * inter-stimulus interval 1–4 s, lapse threshold 355 ms, false start < 100 ms.
 *
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  function PVT(opts) {
    this.el = opts.target; this.counter = opts.counter;
    this.duration = opts.duration || 180000;
    this.onTick = opts.onTick || (() => {});
    this.onDone = opts.onDone || (() => {});
    this.state = 'idle';
  }

  PVT.prototype.start = function () {
    this.rts = []; this.falseStarts = 0; this.t0 = performance.now(); this.state = 'wait';
    this.schedule();
    this.timer = setInterval(() => {
      const el = performance.now() - this.t0;
      this.onTick(Math.min(1, el / this.duration), this.rts.length);
      if (el >= this.duration && this.state === 'wait') this.finish();
    }, 100);
  };

  PVT.prototype.schedule = function () {
    const isi = 1000 + Math.random() * 3000;
    this.el.classList.remove('go');
    this.counter.textContent = '';
    this.to = setTimeout(() => this.stimulus(), isi);
  };

  PVT.prototype.stimulus = function () {
    this.state = 'go'; this.ts = performance.now();
    this.el.classList.add('go');
    const step = () => {
      if (this.state !== 'go') return;
      this.counter.textContent = Math.round(performance.now() - this.ts);
      this.raf = requestAnimationFrame(step);
    };
    step();
    // no response after 30 s counts as a lapse and moves on
    this.lapseTo = setTimeout(() => { if (this.state === 'go') this.respond(); }, 30000);
  };

  PVT.prototype.respond = function () {
    if (this.state === 'idle' || this.state === 'done') return null;
    if (this.state === 'wait') {
      this.falseStarts++;
      clearTimeout(this.to);
      this.counter.textContent = 'too early';
      this.el.classList.add('early');
      setTimeout(() => { this.el.classList.remove('early'); if (this.state === 'wait') this.schedule(); }, 600);
      return { early: true };
    }
    const rt = performance.now() - this.ts;
    cancelAnimationFrame(this.raf); clearTimeout(this.lapseTo);
    this.state = 'wait';
    if (rt < 100) { this.falseStarts++; } else { this.rts.push(rt); }
    this.counter.textContent = Math.round(rt) + ' ms';
    this.el.classList.remove('go'); this.el.classList.add('hit');
    setTimeout(() => {
      this.el.classList.remove('hit');
      if (performance.now() - this.t0 >= this.duration) this.finish(); else this.schedule();
    }, 450);
    return { rt };
  };

  PVT.prototype.abort = function () {
    clearTimeout(this.to); clearTimeout(this.lapseTo); clearInterval(this.timer); cancelAnimationFrame(this.raf);
    this.state = 'idle'; this.el.classList.remove('go', 'hit', 'early');
  };

  PVT.prototype.finish = function () {
    if (this.state === 'done') return;
    this.abort(); this.state = 'done';
    const r = this.rts.slice().sort((a, b) => a - b);
    const n = r.length;
    const mean = n ? r.reduce((s, x) => s + x, 0) / n : null;
    const med = n ? (n % 2 ? r[n >> 1] : (r[n / 2 - 1] + r[n / 2]) / 2) : null;
    const lapses = r.filter(x => x > 355).length;
    const fastest = n ? r.slice(0, Math.max(1, Math.round(n * 0.1))) : [];
    const fast10 = fastest.length ? fastest.reduce((s, x) => s + x, 0) / fastest.length : null;
    // performance score 0–100 (100 = no lapses or false starts)
    const score = n ? Math.round(100 * (1 - (lapses + this.falseStarts) / (n + this.falseStarts))) : 0;
    this.onDone({ mean, median: med, lapses, falseStarts: this.falseStarts, trials: n, fast10, score, rts: this.rts.slice() });
  };

  A.PVT = PVT;
})(window.AURORA);
