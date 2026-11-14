/*
 * BioOrbit — Local data store (offline-first, localStorage)
 * Also generates a simulated 30-day mission dataset for demonstration.
 *
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  const KEY = 'aurora-health-v1';
  const DAY = 86400000;

  function dayStart(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  A.dayStart = dayStart;
  A.DAY = DAY;

  // deterministic PRNG so the demo mission always looks the same
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const CREW_TEMPLATE = [
    { id: 'a1', name: 'You', role: 'Mission Specialist', callsign: 'MS-1', color: '#0b6bed', baseWeight: 64.0 },
    { id: 'a2', name: 'L. Moreau', role: 'Commander', callsign: 'CDR', color: '#0ea5e9', baseWeight: 82.0 },
    { id: 'a3', name: 'Y. Tanaka', role: 'Flight Engineer', callsign: 'FE-1', color: '#14b8a6', baseWeight: 70.5 },
    { id: 'a4', name: 'A. Okafor', role: 'Medical Officer', callsign: 'MO', color: '#f59e0b', baseWeight: 68.0 }
  ];

  /* Each profile returns daily "true" values given day index d (0..days-1)
     and progress p (0..1, how close to today). */
  const PROFILES = {
    a1: (d, p, r, last) => ({
      // sleep debt + vigilance decline in the last days → shows drift detection
      hr: 64 + r() * 6 + (last ? 7 : 0),
      sys: 114 + r() * 8, dia: 74 + r() * 6,
      spo2: 97 + Math.round(r() * 2), temp: 36.7 + r() * 0.4, rr: 14 + Math.round(r() * 3),
      glucose: 86 + r() * 10,
      sleep: last ? 5.2 + r() * 0.7 : 6.8 + r() * 1.3,
      pvt: last ? 318 + r() * 30 : 252 + r() * 25,
      mood: last ? 2 + Math.round(r()) : 3 + Math.round(r() * 2),
      stress: last ? 4 : 2 + Math.round(r()),
      exercise: last ? 55 + r() * 20 : 95 + r() * 30,
      water: last ? 1.6 + r() * 0.4 : 2.1 + r() * 0.8,
      weight: 64.0 - p * 1.4 + r() * 0.3,
      sym: last && r() > 0.4 ? ['headache'] : []
    }),
    a2: (d, p, r) => ({
      // gradual blood pressure rise
      hr: 70 + r() * 6, sys: 122 + p * 20 + r() * 6, dia: 78 + p * 11 + r() * 4,
      spo2: 96 + Math.round(r() * 2), temp: 36.8 + r() * 0.3, rr: 15 + Math.round(r() * 2),
      glucose: 94 + p * 12 + r() * 8, sleep: 6.5 + r() * 1.2, pvt: 270 + r() * 30,
      mood: 3 + Math.round(r() * 2), stress: 3 + Math.round(r()), exercise: 85 + r() * 30,
      water: 1.9 + r() * 0.8, weight: 82 + r() * 0.4, sym: r() > 0.85 ? ['vision'] : []
    }),
    a3: (d, p, r) => ({
      // model astronaut — consistent and nominal
      hr: 56 + r() * 5, sys: 112 + r() * 8, dia: 70 + r() * 6,
      spo2: 98 + Math.round(r()), temp: 36.6 + r() * 0.3, rr: 13 + Math.round(r() * 2),
      glucose: 82 + r() * 8, sleep: 7.2 + r() * 1, pvt: 238 + r() * 22,
      mood: 4 + Math.round(r()), stress: 1 + Math.round(r() * 2), exercise: 110 + r() * 30,
      water: 2.4 + r() * 0.6, weight: 70.5 - p * 0.3 + r() * 0.3, sym: []
    }),
    a4: (d, p, r, last, today) => ({
      // developing infection today: fever + rash
      hr: (today ? 92 : 66) + r() * 5, sys: 116 + r() * 8, dia: 75 + r() * 5,
      spo2: (today ? 95 : 97) + Math.round(r()), temp: today ? 38.3 : 36.8 + r() * 0.35, rr: (today ? 19 : 14) + Math.round(r() * 2),
      glucose: 88 + r() * 9, sleep: 6.9 + r() * 1.1, pvt: 260 + r() * 25,
      mood: 3 + Math.round(r() * 2), stress: 2 + Math.round(r()), exercise: today ? 0 : 95 + r() * 25,
      water: 2.2 + r() * 0.6, weight: 68 - p * 0.6 + r() * 0.3, sym: today ? ['rash', 'headache'] : []
    })
  };

  function round(v, dec) { const m = Math.pow(10, dec); return Math.round(v * m) / m; }

  function generateMission(days) {
    days = days || 30;
    const today = dayStart(Date.now());
    const start = today - (days - 1) * DAY;
    const crew = CREW_TEMPLATE.map((c, ci) => {
      const r = mulberry32(1000 + ci * 77);
      const records = [];
      for (let d = 0; d < days; d++) {
        const p = d / (days - 1);
        const isToday = d === days - 1;
        const last = d >= days - 5;
        const v = PROFILES[c.id](d, p, r, last, isToday);
        const base = start + d * DAY;
        const I = A.INDICATORS;
        const fmt = k => round(Math.min(I[k].max, Math.max(I[k].min, v[k])), I[k].dec);
        const missedDay = !isToday && r() < 0.06; // occasional missed day = realism
        if (missedDay) continue;
        // morning
        const morning = { t: base + 7 * 3600e3 + r() * 1800e3, v: {}, sym: v.sym, src: 'manual' };
        ['hr', 'sys', 'dia', 'spo2', 'temp', 'rr', 'sleep'].forEach(k => morning.v[k] = fmt(k));
        if (d % 2 === 0 || isToday) morning.v.glucose = fmt('glucose');
        if (d % 7 === 0) morning.v.weight = fmt('weight');
        records.push(morning);
        // for the user's own profile, leave the rest of TODAY for them to do
        if (isToday && c.id === 'a1') continue;
        records.push({ t: base + 9 * 3600e3 + r() * 3600e3, v: { pvt: fmt('pvt') }, src: 'pvt', pvt: { lapses: v.pvt > 330 ? 3 + Math.round(r() * 3) : Math.round(r() * 2), trials: 30 } });
        if (!isToday) {
          records.push({ t: base + 14 * 3600e3 + r() * 3600e3, v: { exercise: fmt('exercise') }, src: 'manual' });
          records.push({ t: base + 20.5 * 3600e3 + r() * 1800e3, v: { water: fmt('water'), mood: fmt('mood'), stress: fmt('stress') }, src: 'manual' });
        } else {
          records.push({ t: base + 8 * 3600e3, v: { mood: fmt('mood'), stress: fmt('stress') }, src: 'manual' });
        }
      }
      // make sure demo timestamps never land in the future
      const now = Date.now();
      records.forEach(rec => { if (rec.t > now) rec.t = now - 60e3 * (1 + Math.random() * 30); });
      records.sort((a, b) => a.t - b.t);
      return {
        id: c.id, name: c.name, role: c.role, callsign: c.callsign, color: c.color,
        baseline: { weight: c.baseWeight }, priorDose: 40 + ci * 25,
        records, downlinks: [], camera: false
      };
    });
    return { version: 1, envKey: 'iss', missionStart: start, activeId: 'a1', crew, demo: true, createdAt: Date.now() };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === 1 && Array.isArray(s.crew)) {
          s.crew.forEach(m => { const t = CREW_TEMPLATE.find(x => x.id === m.id); if (t) m.color = t.color; });
          return s;
        }
      }
    } catch (e) { /* storage unavailable — fall back to memory */ }
    return generateMission(30);
  }

  A.store = {
    state: load(),
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
    },
    reset() { this.state = generateMission(30); this.save(); },
    blank() {
      const s = generateMission(30);
      s.crew.forEach(c => { c.records = []; });
      s.missionStart = dayStart(Date.now());
      s.demo = false;
      this.state = s; this.save();
    },
    active() { return this.state.crew.find(c => c.id === this.state.activeId) || this.state.crew[0]; },
    env() { return A.ENVIRONMENTS[this.state.envKey] || A.ENVIRONMENTS.iss; },
    missionDay() { return Math.floor((dayStart(Date.now()) - dayStart(this.state.missionStart)) / DAY) + 1; },
    addRecord(rec, crewId) {
      const c = crewId ? this.state.crew.find(x => x.id === crewId) : this.active();
      rec.t = rec.t || Date.now();
      c.records.push(rec);
      c.records.sort((a, b) => a.t - b.t);
      this.save();
      return rec;
    },
    exportAll() { return JSON.stringify(this.state, null, 2); },
    importAll(json) {
      const s = JSON.parse(json);
      if (!s || s.version !== 1 || !Array.isArray(s.crew)) throw new Error('Invalid BioOrbit file');
      this.state = s; this.save();
    }
  };
})(window.AURORA);
