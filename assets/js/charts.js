/*
 * BioOrbit — Dependency-free charts (works fully offline)
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const statusColor = s => css('--' + (s === 'none' ? 'muted' : s));

  /* Sparkline as inline SVG string */
  A.sparkline = function (values, opts) {
    opts = opts || {};
    const w = opts.w || 120, h = opts.h || 34, pad = 3;
    const pts = values.map((v, i) => ({ i, v })).filter(p => p.v != null);
    if (pts.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
    let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
    if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
    const x = i => pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = v => h - pad - ((v - lo) / (hi - lo)) * (h - pad * 2);
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const area = d + ` L${x(pts[pts.length - 1].i).toFixed(1)},${h} L${x(pts[0].i).toFixed(1)},${h} Z`;
    const id = 'sg' + Math.random().toString(36).slice(2, 8);
    const c = opts.color || 'var(--accent)';
    const last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/>
      <path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${x(last.i).toFixed(1)}" cy="${y(last.v).toFixed(1)}" r="2.4" fill="${c}"/>
    </svg>`;
  };

  /* Interactive line chart on canvas
     series: [{label, color, data:[{day, v}], key}]  */
  A.LineChart = function (canvas, tooltip) {
    this.c = canvas; this.tip = tooltip; this.series = []; this.hover = -1;
    const ctx = canvas.getContext('2d'); this.ctx = ctx;
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      this.hover = this.indexAt(px);
      this.draw();
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });
    canvas.addEventListener('mouseleave', () => { this.hover = -1; this.draw(); });
    this._ro = new ResizeObserver(() => this.draw());
    this._ro.observe(canvas.parentElement);
  };

  A.LineChart.prototype.set = function (cfg) { Object.assign(this, cfg); this.hover = -1; this.draw(); };

  A.LineChart.prototype.indexAt = function (px) {
    if (!this.series.length) return -1;
    const n = this.series[0].data.length;
    const L = this.layout; if (!L) return -1;
    const i = Math.round(((px - L.x0) / (L.x1 - L.x0)) * (n - 1));
    return i < 0 || i >= n ? -1 : i;
  };

  A.LineChart.prototype.draw = function () {
    const c = this.c, ctx = this.ctx, dpr = window.devicePixelRatio || 1;
    const W = c.parentElement.clientWidth, H = this.height || 300;
    if (!W) return;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!this.series.length) return;

    const all = this.series.flatMap(s => s.data.map(d => d.v)).filter(v => v != null);
    let lo = this.min != null ? this.min : Math.min(...all);
    let hi = this.max != null ? this.max : Math.max(...all);
    if (all.length) { lo = Math.min(lo, ...all); hi = Math.max(hi, ...all); }
    if (this.band) { lo = Math.min(lo, this.band[0]); hi = Math.max(hi, this.band[1]); }
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    const span = hi - lo || 1; lo -= span * 0.08; hi += span * 0.08;

    const L = { x0: 44, x1: W - 14, y0: 14, y1: H - 30 };
    this.layout = L;
    const n = this.series[0].data.length;
    const X = i => L.x0 + (n === 1 ? 0.5 : i / (n - 1)) * (L.x1 - L.x0);
    const Y = v => L.y1 - ((v - lo) / (hi - lo)) * (L.y1 - L.y0);

    const grid = css('--line'), muted = css('--muted'), text = css('--text');
    ctx.font = '600 11px "Open Sans", system-ui, sans-serif';

    // normal band
    if (this.band) {
      const y1 = Y(Math.min(hi, this.band[1])), y0 = Y(Math.max(lo, this.band[0]));
      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.fillRect(L.x0, y1, L.x1 - L.x0, y0 - y1);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)'; ctx.setLineDash([4, 4]);
      [y0, y1].forEach(y => { ctx.beginPath(); ctx.moveTo(L.x0, y); ctx.lineTo(L.x1, y); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.textAlign = 'right';
      ctx.fillText('reference', L.x1 - 4, y1 + 12);
    }
    // y grid
    ctx.strokeStyle = grid; ctx.fillStyle = muted; ctx.textAlign = 'right'; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = lo + (k / 4) * (hi - lo), y = Y(v);
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(L.x0, y); ctx.lineTo(L.x1, y); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText(v.toFixed(hi - lo < 10 ? 1 : 0), L.x0 - 6, y + 4);
    }
    // x labels
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(n / 7));
    this.series[0].data.forEach((d, i) => {
      if (i % step && i !== n - 1) return;
      const dt = new Date(d.day);
      ctx.fillText(i === n - 1 ? 'today' : `${dt.getDate()}/${dt.getMonth() + 1}`, X(i), H - 10);
    });

    // series
    this.series.forEach(s => {
      const pts = s.data.map((d, i) => ({ i, v: d.v })).filter(p => p.v != null);
      if (!pts.length) return;
      // gradient fill
      const g = ctx.createLinearGradient(0, L.y0, 0, L.y1);
      g.addColorStop(0, hexA(s.color, 0.28)); g.addColorStop(1, hexA(s.color, 0));
      ctx.beginPath();
      pts.forEach((p, k) => k ? ctx.lineTo(X(p.i), Y(p.v)) : ctx.moveTo(X(p.i), Y(p.v)));
      if (this.series.length === 1) {
        ctx.lineTo(X(pts[pts.length - 1].i), L.y1); ctx.lineTo(X(pts[0].i), L.y1); ctx.closePath();
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(X(p.i), Y(p.v)) : ctx.moveTo(X(p.i), Y(p.v)));
      }
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
      ctx.stroke();
      // points coloured by status
      pts.forEach(p => {
        const st = s.classify ? s.classify(p.v) : 'ok';
        ctx.beginPath(); ctx.arc(X(p.i), Y(p.v), p.i === this.hover ? 5.5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = this.series.length === 1 ? statusColor(st) : s.color; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      });
    });

    // hover
    if (this.hover >= 0 && this.tip) {
      const i = this.hover, x = X(i);
      ctx.strokeStyle = 'rgba(15, 28, 63, 0.15)'; ctx.beginPath(); ctx.moveTo(x, L.y0); ctx.lineTo(x, L.y1); ctx.stroke();
      const dt = new Date(this.series[0].data[i].day);
      const rows = this.series.map(s => {
        const v = s.data[i].v;
        return `<div><i style="background:${s.color}"></i>${s.label}: <b>${v == null ? '—' : (s.fmt ? s.fmt(v) : v)}</b></div>`;
      }).join('');
      this.tip.innerHTML = `<div class="tt-date">${dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>${rows}`;
      this.tip.style.display = 'block';
      const tw = this.tip.offsetWidth;
      this.tip.style.left = Math.min(W - tw - 4, Math.max(4, x - tw / 2)) + 'px';
      this.tip.style.top = '8px';
    } else if (this.tip) this.tip.style.display = 'none';
    void text;
  };

  function hexA(hex, a) {
    if (hex.startsWith('var(')) hex = css(hex.slice(4, -1));
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  A.hexA = hexA;
})(window.AURORA);
