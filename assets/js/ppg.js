/*
 * BioOrbit — Camera Pulse (photoplethysmography, PPG)
 * The fingertip over the camera lens changes brightness with every heartbeat
 * as blood volume pulses through the capillaries. We track the mean red
 * intensity, detrend it, and estimate heart rate by autocorrelation.
 * Everything runs on-device; no image ever leaves the computer.
 *
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  function PPG(opts) {
    this.video = opts.video; this.wave = opts.wave; this.onUpdate = opts.onUpdate || (() => {});
    this.onDone = opts.onDone || (() => {});
    this.duration = opts.duration || 20000;
    this.samples = []; this.estimates = []; this.running = false;
    this.work = document.createElement('canvas'); this.work.width = 48; this.work.height = 48;
    this.wctx = this.work.getContext('2d', { willReadFrequently: true });
  }

  PPG.prototype.start = async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Camera API not available in this browser (requires HTTPS or localhost).');
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 30 } },
      audio: false
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    // try to switch on the flashlight (phones)
    const track = this.stream.getVideoTracks()[0];
    this.track = track;
    try {
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) await track.applyConstraints({ advanced: [{ torch: true }] });
      this.torch = !!caps.torch;
    } catch (e) { this.torch = false; }
    this.samples = []; this.estimates = []; this.running = true;
    this.t0 = performance.now(); this.fingerSince = null;
    const loop = () => { if (!this.running) return; this.tick(); this.raf = requestAnimationFrame(loop); };
    loop();
  };

  PPG.prototype.stop = function () {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
  };

  PPG.prototype.tick = function () {
    const v = this.video;
    if (!v.videoWidth) return;
    const s = Math.min(v.videoWidth, v.videoHeight) * 0.5;
    this.wctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 48, 48);
    const d = this.wctx.getImageData(0, 0, 48, 48).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4; r /= n; g /= n; b /= n;
    const now = performance.now();
    const finger = r > 60 && r > g * 1.4 && r > b * 1.4;
    if (finger) { if (!this.fingerSince) this.fingerSince = now; } else { this.fingerSince = null; this.samples = []; }
    if (finger) this.samples.push({ t: now, v: r });
    // keep last 12 s
    while (this.samples.length && now - this.samples[0].t > 12000) this.samples.shift();

    const res = this.estimate();
    if (res && res.quality > 0.35) this.estimates.push(res.bpm);
    const elapsed = this.fingerSince ? now - this.fingerSince : 0;
    const progress = Math.min(1, elapsed / this.duration);
    this.drawWave(res);
    this.onUpdate({ finger, bpm: res ? res.bpm : null, quality: res ? res.quality : 0, progress, torch: this.torch, rgb: [r, g, b] });
    if (progress >= 1) {
      const good = this.estimates.slice(-Math.max(10, Math.floor(this.estimates.length * 0.6)));
      const final = good.length ? median(good) : null;
      this.stop();
      this.onDone({ bpm: final ? Math.round(final) : null, samples: good.length });
    }
  };

  /* resample to 30 Hz, detrend, autocorrelate */
  PPG.prototype.estimate = function () {
    const S = this.samples;
    if (S.length < 60) return null;
    const span = S[S.length - 1].t - S[0].t;
    if (span < 5000) return null;
    const fs = 30, N = Math.floor((span / 1000) * fs);
    const x = new Float64Array(N);
    let j = 0;
    for (let i = 0; i < N; i++) {
      const t = S[0].t + (i * 1000) / fs;
      while (j < S.length - 2 && S[j + 1].t < t) j++;
      const a = S[j], b = S[j + 1];
      x[i] = a.v + ((b.v - a.v) * (t - a.t)) / Math.max(1, b.t - a.t);
    }
    // detrend with 1 s moving average, smooth with 5-sample average
    const w = fs, y = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let s = 0, c = 0;
      for (let k = Math.max(0, i - w / 2); k < Math.min(N, i + w / 2); k++) { s += x[k]; c++; }
      y[i] = x[i] - s / c;
    }
    const z = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let s = 0, c = 0;
      for (let k = Math.max(0, i - 2); k <= Math.min(N - 1, i + 2); k++) { s += y[k]; c++; }
      z[i] = -s / c; // invert: more blood → darker
    }
    this.filtered = z;
    let e0 = 0; for (let i = 0; i < N; i++) e0 += z[i] * z[i];
    if (e0 < 1e-6) return null;
    const minLag = Math.floor((fs * 60) / 200), maxLag = Math.ceil((fs * 60) / 40);
    let best = -1, bestLag = 0;
    const ac = [];
    for (let lag = minLag; lag <= maxLag && lag < N - 10; lag++) {
      let s = 0;
      for (let i = 0; i < N - lag; i++) s += z[i] * z[i + lag];
      const v = s / e0 * (N / (N - lag));
      ac[lag] = v;
      if (v > best) { best = v; bestLag = lag; }
    }
    if (!bestLag) return null;
    // avoid octave errors: take the first local peak that is nearly as strong as the global one
    for (let lag = minLag + 1; lag < bestLag; lag++) {
      if (ac[lag] != null && ac[lag] >= ac[lag - 1] && ac[lag] >= (ac[lag + 1] ?? -Infinity) && ac[lag] >= 0.8 * best) { bestLag = lag; best = ac[lag]; break; }
    }
    // parabolic interpolation for sub-sample lag
    const a = ac[bestLag - 1], b = ac[bestLag], c = ac[bestLag + 1];
    let lag = bestLag;
    if (a != null && c != null) { const den = a - 2 * b + c; if (den) lag = bestLag + 0.5 * (a - c) / den; }
    return { bpm: (60 * fs) / lag, quality: Math.max(0, Math.min(1, best)) };
  };

  PPG.prototype.drawWave = function () {
    const cv = this.wave; if (!cv) return;
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const z = this.filtered;
    if (!z || !this.samples.length) {
      ctx.strokeStyle = 'rgba(239,68,102,.3)'; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const show = z.slice(-150);
    let lo = Infinity, hi = -Infinity; show.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    const sp = hi - lo || 1;
    ctx.strokeStyle = '#ef4466'; ctx.lineWidth = 2.4; ctx.shadowBlur = 0;
    ctx.beginPath();
    show.forEach((v, i) => { const x = (i / (show.length - 1)) * W, y = H - 10 - ((v - lo) / sp) * (H - 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.shadowBlur = 0;
  };

  function median(a) { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

  /* Fallback: tap along with your pulse */
  function TapPulse() { this.taps = []; }
  TapPulse.prototype.tap = function () {
    const t = performance.now();
    if (this.taps.length && t - this.taps[this.taps.length - 1] > 2500) this.taps = [];
    this.taps.push(t);
    if (this.taps.length > 16) this.taps.shift();
    if (this.taps.length < 5) return { bpm: null, n: this.taps.length };
    const iv = []; for (let i = 1; i < this.taps.length; i++) iv.push(this.taps[i] - this.taps[i - 1]);
    return { bpm: Math.round(60000 / median(iv)), n: this.taps.length };
  };

  A.PPG = PPG;
  A.TapPulse = TapPulse;
})(window.AURORA);
