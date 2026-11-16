/*
 * BioOrbit — Health assessment engine
 *  - Threshold classification (color-coded status)
 *  - Personal-baseline drift detection (catches change inside "normal" ranges)
 *  - Multi-signal pattern insights (fatigue, infection, behavioural health)
 *  - Readiness score, routine tracking, gamification
 *  - Delay-aware escalation for deep-space missions
 *
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  const I = A.INDICATORS;
  const DAY = A.DAY;
  const rank = s => A.STATUS[s].rank;
  const worst = (a, b) => (rank(a) >= rank(b) ? a : b);

  const E = {};

  E.classify = function (key, v, crew) {
    if (v == null || isNaN(v)) return 'none';
    const ind = I[key];
    if (ind.relative) {
      const base = crew && crew.baseline && crew.baseline[key];
      if (!base) return 'ok';
      const pct = Math.abs((v - base) / base) * 100;
      return pct < 2 ? 'ok' : pct < 5 ? 'watch' : 'alert';
    }
    for (const [lo, hi, s] of ind.ranges) if (v >= lo && v < hi) return s;
    return 'none';
  };

  E.latest = function (crew, key) {
    for (let i = crew.records.length - 1; i >= 0; i--) {
      const r = crew.records[i];
      if (r.v && r.v[key] != null) return { v: r.v[key], t: r.t, rec: r };
    }
    return null;
  };

  /* one value per day (last of the day) for the last `days` days */
  E.daily = function (crew, key, days) {
    const today = A.dayStart(Date.now());
    const out = [];
    for (let d = days - 1; d >= 0; d--) out.push({ day: today - d * DAY, v: null });
    const first = out[0].day;
    for (const r of crew.records) {
      if (!r.v || r.v[key] == null || r.t < first) continue;
      const idx = Math.floor((A.dayStart(r.t) - first) / DAY);
      if (idx >= 0 && idx < out.length) {
        out[idx].v = (key === 'exercise' || key === 'water') ? (out[idx].v || 0) + r.v[key] : r.v[key];
      }
    }
    return out;
  };

  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const std = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); };

  /* Personal-baseline drift: recent (last 3 days) vs. baseline (days 4–21) */
  E.drift = function (crew, key) {
    const ind = I[key];
    const series = E.daily(crew, key, 21).filter(x => x.v != null).map(x => x.v);
    if (series.length < 8) return null;
    const recent = series.slice(-3), base = series.slice(0, -3);
    const m = mean(base), sd = Math.max(std(base), ind.drift / 3);
    const rm = mean(recent);
    const z = (rm - m) / sd;
    const delta = rm - m;
    let bad = false;
    if (ind.better === 'high') bad = delta < 0;
    else if (ind.better === 'low') bad = delta > 0;
    else bad = true;
    if (Math.abs(delta) >= ind.drift && Math.abs(z) >= 2 && bad) {
      return { key, baseline: m, recent: rm, delta, z };
    }
    return null;
  };

  E.symptomsToday = function (crew) {
    const since = Date.now() - 36 * 3600e3;
    const set = new Set();
    crew.records.forEach(r => { if (r.t >= since && r.sym) r.sym.forEach(s => set.add(s)); });
    return [...set];
  };

  E.missionDose = function (state, crew) {
    const env = A.ENVIRONMENTS[state.envKey];
    const days = Math.max(1, Math.floor((A.dayStart(Date.now()) - A.dayStart(state.missionStart)) / DAY) + 1);
    const mission = days * env.doseDay;
    const total = mission + (crew.priorDose || 0);
    return { mission, total, pct: (total / A.CAREER_LIMIT_MSV) * 100, perDay: env.doseDay, days };
  };

  const STATUS_SCORE = { ok: 100, watch: 72, alert: 40, critical: 8 };
  const WEIGHTS = { hr: 1, sys: 1, dia: .5, spo2: 1.2, temp: 1, rr: .6, glucose: .8, sleep: 1, mood: 1, stress: .7, pvt: 1, exercise: .7, water: .5, weight: .4, co2: .6 };
  const STALE = { weight: 10 * DAY, default: 3 * DAY };

  E.assess = function (state, crew) {
    const env = A.ENVIRONMENTS[state.envKey];
    const ind = {};
    let wsum = 0, ssum = 0;
    Object.keys(I).forEach(k => {
      const l = E.latest(crew, k);
      if (!l) { ind[k] = { status: 'none' }; return; }
      if (k === 'exercise' || k === 'water') {
        // cumulative indicators: use the day total
        const day = E.daily(crew, k, 1)[0];
        if (A.dayStart(l.t) === day.day && day.v != null) l.v = Math.round(day.v * 10) / 10;
      }
      const stale = Date.now() - l.t > (STALE[k] || STALE.default);
      const status = E.classify(k, l.v, crew);
      ind[k] = { v: l.v, t: l.t, status, stale, drift: E.drift(crew, k) };
      if (!stale) { wsum += WEIGHTS[k]; ssum += WEIGHTS[k] * STATUS_SCORE[status]; }
    });

    const sym = E.symptomsToday(crew);
    let symPenalty = 0;
    sym.forEach(s => symPenalty += (A.SYMPTOMS[s] ? A.SYMPTOMS[s].weight : 1) * 4);
    let driftPenalty = 0;
    Object.values(ind).forEach(x => { if (x.drift) driftPenalty += 3; });
    let score = wsum ? ssum / wsum : 0;
    score = Math.max(0, Math.min(100, Math.round(score - Math.min(20, symPenalty) - Math.min(12, driftPenalty))));

    // body regions
    const regions = {};
    Object.entries(A.REGIONS).forEach(([id, r]) => {
      let s = 'none';
      r.indicators.forEach(k => { if (ind[k] && ind[k].status !== 'none' && !ind[k].stale) s = s === 'none' ? ind[k].status : worst(s, ind[k].status); });
      r.indicators.forEach(k => { if (ind[k] && ind[k].drift && s !== 'none') s = worst(s, 'watch'); });
      (r.symptoms || []).forEach(k => {
        if (sym.includes(k)) { const w = A.SYMPTOMS[k].weight; s = s === 'none' ? (w >= 2 ? 'alert' : 'watch') : worst(s, w >= 2 ? 'alert' : 'watch'); }
      });
      if (r.radiation) {
        const dose = E.missionDose(state, crew);
        const rs = dose.pct > 90 ? 'alert' : dose.pct > 70 ? 'watch' : 'ok';
        s = s === 'none' ? rs : worst(s, rs);
      }
      if (s === 'none' && (r.symptoms || []).length && !r.indicators.length) s = 'ok';
      regions[id] = { status: s };
    });
    // symptoms in other regions
    sym.forEach(k => {
      const reg = A.SYMPTOMS[k] && A.SYMPTOMS[k].region;
      if (reg && regions[reg]) {
        const add = k === 'chest' ? 'critical' : A.SYMPTOMS[k].weight >= 2 ? 'alert' : 'watch';
        regions[reg].status = regions[reg].status === 'none' ? add : worst(regions[reg].status, add);
      }
    });

    const alerts = E.alerts(state, crew, ind, sym, env);
    // findings reduce readiness: each alert-level finding weighs more than a watch
    const findPenalty = alerts.reduce((p, al) => p + (al.sev === 'critical' ? 15 : al.sev === 'alert' ? 6 : al.kind === 'drift' ? 0 : 2), 0);
    score = Math.max(0, Math.round(score - Math.min(30, findPenalty)));
    return { ind, regions, score, sym, alerts, env, dose: E.missionDose(state, crew), readiness: E.readinessLabel(score, alerts) };
  };

  E.readinessLabel = function (score, alerts) {
    const crit = alerts.some(a => a.sev === 'critical');
    if (crit || score < 50) return { label: 'Medical attention', status: 'critical' };
    if (score < 70 || alerts.some(a => a.kind === 'pattern' && a.sev === 'alert')) return { label: 'Limited duty', status: 'alert' };
    if (score < 85 || alerts.some(a => a.sev === 'alert')) return { label: 'Ready with caution', status: 'watch' };
    return { label: 'Mission ready', status: 'ok' };
  };

  E.escalation = function (env, sev) {
    if (sev === 'ok' || sev === 'watch') return null;
    const g = env.ground.toLowerCase();
    if (env.delay > 60) {
      return `Communication delay ${env.delayLabel}: follow the onboard protocol now and send a downlink report — the ${g} will reply later.`;
    }
    if (sev === 'critical') return `Contact the ${g} immediately (delay ${env.delayLabel}).`;
    return `Discuss with the ${g} at the next contact window.`;
  };

  E.alerts = function (state, crew, ind, sym, env) {
    const out = [];
    Object.entries(ind).forEach(([k, x]) => {
      if (x.status === 'none' || x.stale) return;
      const def = I[k];
      if (rank(x.status) >= 1) {
        out.push({
          sev: x.status, key: k, kind: 'threshold',
          title: `${def.short} ${fmtVal(k, x.v)} ${def.unit}`,
          detail: `${A.STATUS[x.status].label} — ${!def.normal ? 'outside the expected range' : def.better === 'high' && x.v < def.normal[0] ? `below the recommended minimum (≥ ${def.normal[0]} ${def.unit})` : def.better === 'low' && x.v > def.normal[1] ? `above the recommended maximum (≤ ${def.normal[1]} ${def.unit})` : `outside the reference range (${def.normal[0]}–${def.normal[1]} ${def.unit})`}.`,
          actions: (def.actions && (def.actions[x.status] || def.actions.alert || def.actions.watch)) || [],
          escalate: E.escalation(env, x.status)
        });
      }
      if (x.drift && rank(x.status) < 1) {
        const d = x.drift;
        out.push({
          sev: 'watch', key: k, kind: 'drift',
          title: `${def.short} drifting from your baseline`,
          detail: `Still in the reference range, but your 3-day average (${fmtVal(k, d.recent)} ${def.unit}) changed by ${d.delta > 0 ? '+' : ''}${fmtVal(k, d.delta)} ${def.unit} from your personal baseline (${fmtVal(k, d.baseline)}). Early change detected before it becomes a problem.`,
          actions: (def.actions && def.actions.watch) || [],
          escalate: null
        });
      }
    });

    // multi-signal pattern insights
    const st = k => (ind[k] && !ind[k].stale ? ind[k].status : 'none');
    const sleepDays = E.daily(crew, 'sleep', 3).filter(x => x.v != null).map(x => x.v);
    if (sleepDays.length >= 2 && mean(sleepDays) < 6.2 && (rank(st('pvt')) >= 1 || (ind.pvt && ind.pvt.drift))) {
      out.push({
        sev: 'alert', kind: 'pattern', key: 'sleep',
        title: 'Fatigue pattern: sleep debt + slower reactions',
        detail: `Average sleep ${mean(sleepDays).toFixed(1)} h over the last nights together with slower vigilance. Fatigue raises the risk of errors in critical operations.`,
        actions: ['Avoid EVA, docking or piloting without a cross-check today.', 'Schedule recovery sleep tonight (8 h opportunity).', 'Retake the reaction test after rest.'],
        escalate: E.escalation(env, 'alert')
      });
    }
    if (st('temp') !== 'none' && rank(st('temp')) >= 1 && (rank(st('hr')) >= 1 || sym.includes('rash') || sym.includes('congestion'))) {
      out.push({
        sev: rank(st('temp')) >= 2 ? 'alert' : 'watch', kind: 'pattern', key: 'temp',
        title: 'Possible infection: fever + elevated heart rate / symptoms',
        detail: 'Spaceflight weakens the immune system and latent viruses can reactivate. Early isolation protects the rest of the crew.',
        actions: ['Use a mask and sanitise shared surfaces.', 'Re-measure temperature every 4 h; hydrate.', 'Check medical kit for antipyretics per protocol.'],
        escalate: E.escalation(env, 'alert')
      });
    }
    if (rank(st('co2')) >= 1 && sym.includes('headache')) {
      out.push({
        sev: rank(st('co2')) >= 2 ? 'alert' : 'watch', kind: 'pattern', key: 'co2',
        title: 'Headache with high cabin CO₂',
        detail: `Cabin CO₂ is ${ind.co2.v} mmHg and you reported a headache. On the ISS, headache odds roughly doubled for every 1 mmHg of CO₂ (Law et al., 2014).`,
        actions: ['Move to a better-ventilated module and increase airflow.', 'Hydrate and re-check the headache in 1 hour.', 'Report the CO₂ level to the ground for life-support review.'],
        escalate: E.escalation(env, 'alert')
      });
    }
    const moods = E.daily(crew, 'mood', 5).filter(x => x.v != null).map(x => x.v);
    if (moods.length >= 3 && moods.filter(m => m <= 2).length >= 3) {
      out.push({
        sev: 'alert', kind: 'pattern', key: 'mood',
        title: 'Behavioural health: low mood on 3+ of the last 5 days',
        detail: 'Persistent low mood during isolation and confinement deserves attention, even if you feel you can handle it.',
        actions: ['Book a private behavioural-health conference.', 'Plan a family call and a crew social activity.', 'Try the guided breathing module.'],
        escalate: E.escalation(env, 'alert')
      });
    }
    if (sym.includes('vision')) {
      out.push({
        sev: 'alert', kind: 'symptom', key: 'vision',
        title: 'Vision change reported — possible SANS',
        detail: 'Spaceflight Associated Neuro-ocular Syndrome is linked to the head-ward fluid shift. Track it with eye exams.',
        actions: ['Perform the onboard visual acuity / Amsler grid test.', 'Schedule optical coherence tomography or fundoscopy if available.'],
        escalate: E.escalation(env, 'alert')
      });
    }
    if (sym.includes('chest')) {
      out.push({
        sev: 'critical', kind: 'symptom', key: 'hr',
        title: 'Chest discomfort reported',
        detail: 'Treat as a potential cardiovascular event until proven otherwise.',
        actions: ['Stop activity, stay restrained.', 'Record ECG and vitals now.', 'Notify the medical officer.'],
        escalate: E.escalation(env, 'critical')
      });
    }
    const dose = E.missionDose(state, crew);
    if (dose.pct > 70) {
      out.push({
        sev: dose.pct > 90 ? 'alert' : 'watch', kind: 'radiation', key: null,
        title: `Radiation: ${dose.pct.toFixed(0)} % of career limit`,
        detail: `Estimated cumulative dose ${dose.total.toFixed(0)} mSv of ${A.CAREER_LIMIT_MSV} mSv.`,
        actions: ['Minimise time in low-shielding modules.', 'Review EVA plans with the ground team.'],
        escalate: null
      });
    }
    out.sort((a, b) => rank(b.sev) - rank(a.sev));
    return out;
  };

  function fmtVal(k, v) { return Number(v).toFixed(I[k] ? I[k].dec : 0); }
  E.fmt = fmtVal;

  /* ------------------------- routine + gamification ------------------------- */
  E.taskDone = function (task, recs) {
    const vals = {};
    recs.forEach(r => Object.entries(r.v || {}).forEach(([k, v]) => {
      if (k === 'exercise' || k === 'water') vals[k] = (vals[k] || 0) + v; else vals[k] = v;
    }));
    const has = task.need === 'all' ? task.keys.every(k => vals[k] != null) : task.keys.some(k => vals[k] != null);
    if (!has) return false;
    if (task.min) return Object.entries(task.min).every(([k, m]) => (vals[k] || 0) >= m);
    return true;
  };

  E.recordsOfDay = function (crew, day) {
    return crew.records.filter(r => A.dayStart(r.t) === day);
  };

  E.routineToday = function (crew) {
    const recs = E.recordsOfDay(crew, A.dayStart(Date.now()));
    return A.ROUTINE.map(t => ({ ...t, done: E.taskDone(t, recs) }));
  };

  E.game = function (crew) {
    const byDay = new Map();
    crew.records.forEach(r => { const d = A.dayStart(r.t); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(r); });
    let xp = 0, fullDays = 0;
    const days = [...byDay.keys()].sort();
    days.forEach(d => {
      const recs = byDay.get(d);
      let all = true;
      A.ROUTINE.forEach(t => { if (E.taskDone(t, recs)) xp += t.xp; else all = false; });
      if (all) { xp += 50; fullDays++; }
    });
    // streak
    let streak = 0;
    let d = A.dayStart(Date.now());
    if (!byDay.has(d)) d -= DAY;
    while (byDay.has(d)) { streak++; d -= DAY; }
    let best = 0, run = 0, prev = null;
    days.forEach(x => { run = prev !== null && x - prev === DAY ? run + 1 : 1; best = Math.max(best, run); prev = x; });

    const countDays = (key, test) => days.filter(dd => {
      let tot = null;
      byDay.get(dd).forEach(r => { if (r.v && r.v[key] != null) tot = (key === 'exercise' || key === 'water') ? (tot || 0) + r.v[key] : r.v[key]; });
      return tot != null && test(tot);
    }).length;
    const earned = new Set();
    if (crew.records.length) earned.add('first');
    if (best >= 3) earned.add('streak3');
    if (best >= 7) earned.add('streak7');
    if (best >= 14) earned.add('streak14');
    if (fullDays > 0) earned.add('fullday');
    if (crew.records.some(r => r.v && r.v.pvt != null && r.v.pvt < 280)) earned.add('reflex');
    if (countDays('exercise', v => v >= 90) >= 7) earned.add('bones');
    if (countDays('sleep', v => v >= 7) >= 5) earned.add('sleeper');
    if (crew.camera || crew.records.some(r => r.src === 'camera')) earned.add('pulse');
    if (crew.downlinks && crew.downlinks.length) earned.add('downlink');
    if (countDays('water', v => v >= 2) >= 7) earned.add('hydro');
    if (crew.records.filter(r => r.v && r.v.mood != null).length >= 10) earned.add('mind');
    xp += earned.size * 40;
    // progressive levels: reaching level L needs 200·L·(L−1) XP
    let level = 1;
    while (200 * (level + 1) * level <= xp) level++;
    const floorXp = 200 * level * (level - 1);
    const per = 400 * level;
    const ranks = ['Cadet', 'Candidate', 'Astronaut', 'Flight Specialist', 'Mission Veteran', 'Deep Space Explorer', 'Interplanetary Pioneer'];
    return { xp, level, into: xp - floorXp, per, streak, best, fullDays, earned, rankName: ranks[Math.min(ranks.length - 1, level - 1)] };
  };

  /* ------------------------------ downlink ------------------------------ */
  E.buildReport = function (state, crew) {
    const a = E.assess(state, crew);
    const env = a.env;
    const lines = [];
    const now = new Date();
    lines.push('BIOORBIT HEALTH DOWNLINK REPORT');
    lines.push('='.repeat(40));
    lines.push(`Generated: ${now.toISOString()}`);
    lines.push(`Crew member: ${crew.name} (${crew.callsign}, ${crew.role})`);
    lines.push(`Environment: ${env.name} — ${env.sub} | Mission day ${A.store.missionDay()}`);
    lines.push(`Readiness score: ${a.score}/100 — ${a.readiness.label}`);
    lines.push(`Radiation: ${a.dose.mission.toFixed(1)} mSv this mission, ${a.dose.total.toFixed(0)} mSv career (${a.dose.pct.toFixed(1)} % of limit)`);
    lines.push('');
    lines.push('LATEST INDICATORS');
    Object.entries(a.ind).forEach(([k, x]) => {
      if (x.status === 'none') return;
      lines.push(`- ${I[k].name}: ${fmtVal(k, x.v)} ${I[k].unit} [${A.STATUS[x.status].label}]${x.stale ? ' (stale)' : ''}${x.drift ? ' (baseline drift)' : ''}`);
    });
    lines.push('');
    lines.push('SYMPTOMS (36 h): ' + (a.sym.length ? a.sym.map(s => A.SYMPTOMS[s].name).join(', ') : 'none reported'));
    lines.push('');
    lines.push('FINDINGS & ONBOARD ACTIONS');
    if (!a.alerts.length) lines.push('- No findings. All indicators nominal.');
    a.alerts.forEach(al => {
      lines.push(`- [${A.STATUS[al.sev].label.toUpperCase()}] ${al.title}`);
      lines.push(`    ${al.detail}`);
      al.actions.forEach(x => lines.push(`    • ${x}`));
    });
    lines.push('');
    lines.push('7-DAY TRENDS (daily values, oldest → newest)');
    ['hr', 'sys', 'dia', 'spo2', 'temp', 'sleep', 'mood', 'pvt', 'exercise'].forEach(k => {
      const s = E.daily(crew, k, 7).map(x => (x.v == null ? '—' : fmtVal(k, x.v)));
      lines.push(`- ${I[k].short.padEnd(14)} ${s.join('  ')}`);
    });
    lines.push('');
    lines.push('Decision-support output. Not a diagnosis. Requires review by the ' + env.ground.toLowerCase() + '.');
    const text = lines.join('\n');
    const json = {
      format: 'bioorbit-downlink/1', generated: now.toISOString(), crew: { name: crew.name, callsign: crew.callsign, role: crew.role },
      environment: state.envKey, missionDay: A.store.missionDay(), score: a.score, readiness: a.readiness.label,
      radiation: a.dose, indicators: a.ind, symptoms: a.sym, alerts: a.alerts,
      trends7d: Object.fromEntries(Object.keys(I).map(k => [k, E.daily(crew, k, 7).map(x => x.v)]))
    };
    return { text, json, assessment: a };
  };

  A.engine = E;
})(window.AURORA);
