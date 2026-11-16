/*
 * BioOrbit — Application UI
 * SI disclosure: written with the assistance of an AI coding assistant
 * (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 */
(function (A) {
  'use strict';
  const S = A.store, E = A.engine, I = A.INDICATORS;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const col = s => `var(--${s === 'none' || !s ? 'muted' : s})`;
  const pill = (s, txt) => `<span class="pill ${s}">${esc(txt || A.STATUS[s].label)}</span>`;
  const initials = n => n.split(/[\s.]+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const ago = t => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    return Math.round(h / 24) + ' d ago';
  };
  const fmt = (k, v) => (v == null ? '—' : E.fmt(k, v));
  const ENV_ICON = { iss: '🛰', moon: '🌕', transit: '🚀', mars: '🔴', earth: '🌍' };
  const TILE_ORDER = ['hr', 'bp', 'spo2', 'temp', 'rr', 'glucose', 'sleep', 'pvt', 'mood', 'stress', 'exercise', 'water', 'weight'];

  const ICON = {
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    alert: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    body: '<circle cx="12" cy="4.5" r="2.2"/><path d="M5 8.5h14M12 8.5V15M8.5 21.5 12 15l3.5 6.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    tap: '<path d="M9 11V5.5a2 2 0 0 1 4 0V11l4.5 1a2 2 0 0 1 1.5 2.3L18 20H9.5L6 15.5a1.6 1.6 0 0 1 2.4-2.1L9 14"/>',
    file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.5 18-4-7.5L3 9.5z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
  };
  const ico = k => `<svg class="i" viewBox="0 0 24 24">${ICON[k]}</svg>`;
  const chIco = k => `<span class="ch-ico">${ico(k)}</span>`;

  let current = 'bridge';
  let selRegion = null;
  let trend = { key: 'hr', range: 14, crew: false };
  let chart = null;
  let ppg = null, pvt = null, pvtDur = 180000;

  /* =========================== STARFIELD =========================== */
  (function stars() {
    return; // clean light theme: no starfield
    const c = $('#stars'), ctx = c.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, pts = [], shoot = null;
    function size() {
      const dpr = window.devicePixelRatio || 1;
      W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round((W * H) / 7000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.005, v: Math.random() * 0.06 + 0.01 }));
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const s of pts) {
        s.p += s.s; s.x -= s.v; if (s.x < 0) s.x = W;
        ctx.globalAlpha = 0.35 + Math.sin(s.p) * 0.3 + 0.3;
        ctx.fillStyle = s.r > 1.2 ? '#bfe9ff' : '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
      }
      if (!shoot && Math.random() < 0.003) shoot = { x: Math.random() * W, y: Math.random() * H * 0.4, l: 0 };
      if (shoot) {
        shoot.l += 1;
        const x = shoot.x + shoot.l * 9, y = shoot.y + shoot.l * 4;
        const g = ctx.createLinearGradient(x - 80, y - 36, x, y);
        g.addColorStop(0, 'rgba(56,225,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
        ctx.globalAlpha = 1 - shoot.l / 40; ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 80, y - 36); ctx.lineTo(x, y); ctx.stroke();
        if (shoot.l > 40) shoot = null;
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', size); frame();
  })();

  /* =========================== UTIL UI =========================== */
  function toast(html, cls) {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s, transform .4s'; t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; }, 3800);
    setTimeout(() => t.remove(), 4300);
  }
  function modal(html, wide) {
    const m = $('#modal');
    m.className = 'modal' + (wide ? ' wide' : '');
    m.innerHTML = html;
    $('#modalBack').hidden = false;
    $$('[data-close]', m).forEach(b => b.addEventListener('click', closeModal));
    return m;
  }
  function closeModal() { $('#modalBack').hidden = true; $('#modal').innerHTML = ''; if (A._breathTimer) { clearTimeout(A._breathTimer); A._breathTimer = null; } }
  $('#modalBack').addEventListener('click', e => { if (e.target.id === 'modalBack') closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function ringSVG(score, status, size, stroke) {
    size = size || 170; stroke = stroke || 12;
    const r = (size - stroke) / 2 - 2, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 ${size} ${size}"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="bar" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col(status)}" style="color:${col(status)}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${c * (1 - score / 100)}"/></svg>`;
  }
  function animateRings(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => $$('circle.bar[data-target]', root).forEach(b => b.style.strokeDashoffset = b.dataset.target)));
  }

  /* =========================== GAME HOOK =========================== */
  function withGame(fn) {
    const crew = S.active();
    const before = E.game(crew);
    const res = fn();
    const after = E.game(crew);
    const gained = after.xp - before.xp;
    const newBadges = [...after.earned].filter(b => !before.earned.has(b));
    if (gained > 0) toast(`<span style="font-size:20px">✨</span><div><b>+${gained} XP</b> · ${esc(after.rankName)} — level ${after.level}</div>`, 'xp');
    newBadges.forEach((id, i) => {
      const b = A.BADGES.find(x => x.id === id);
      setTimeout(() => toast(`<span style="font-size:24px">${b.icon}</span><div>Badge unlocked: <b>${esc(b.name)}</b><br><small>${esc(b.desc)}</small></div>`, 'xp'), 600 + i * 500);
    });
    if (after.level > before.level) setTimeout(() => toast(`<span style="font-size:24px">🏅</span><div>Level up! You are now <b>${esc(after.rankName)}</b></div>`, 'xp'), 400);
    return { res, gained, newBadges };
  }

  /* =========================== TOPBAR =========================== */
  function renderTop() {
    const env = S.env(), crew = S.active();
    $('#envName').textContent = `${ENV_ICON[S.state.envKey]} ${env.name}`;
    $('#envSub').textContent = env.sub;
    $('#mDay').textContent = String(S.missionDay()).padStart(3, '0');
    $('#mGrav').textContent = env.gLabel.split(' (')[0];
    $('#mDelay').innerHTML = `<i class="sig ${env.delay > 60 ? 'delay' : ''}"></i>${esc(env.delayLabel)}`;
    $('#whoAvatar').textContent = initials(crew.name);
    $('#whoAvatar').style.background = crew.color;
    $('#whoName').textContent = crew.name;
    $('#whoRole').textContent = `${crew.callsign} · ${crew.role}`;
    const a = E.assess(S.state, crew);
    const n = a.alerts.filter(x => x.sev === 'alert' || x.sev === 'critical').length;
    const link = $('#nav a[data-view="bridge"]');
    let b = $('.badge-dot', link);
    if (n) { if (!b) { b = document.createElement('span'); b.className = 'badge-dot'; link.appendChild(b); } b.textContent = n; }
    else if (b) b.remove();
  }
  function tickMET() {
    const ms = Date.now() - S.state.missionStart;
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    $('#met').textContent = `${String(d).padStart(3, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  setInterval(tickMET, 1000);

  $('#whoBtn').addEventListener('click', e => {
    e.stopPropagation();
    const m = $('#whoMenu');
    m.innerHTML = S.state.crew.map(c => `<button role="option" data-id="${c.id}" aria-selected="${c.id === S.state.activeId}"><span class="avatar" style="background:${c.color}">${initials(c.name)}</span><span><b>${esc(c.name)}</b><br><small class="small">${esc(c.callsign)} · ${esc(c.role)}</small></span></button>`).join('');
    m.hidden = !m.hidden;
    $$('button', m).forEach(b => b.addEventListener('click', () => { S.state.activeId = b.dataset.id; S.save(); m.hidden = true; selRegion = null; refresh(); toast(`Viewing <b>${esc(S.active().name)}</b>`); }));
  });
  document.addEventListener('click', () => { $('#whoMenu').hidden = true; });

  $('#moreBtn').addEventListener('click', e => { e.stopPropagation(); $('#sidebar').classList.toggle('open'); });
  document.addEventListener('click', e => { if (!e.target.closest('#sidebar') && !e.target.closest('#moreBtn')) $('#sidebar').classList.remove('open'); });
  $('#envCard').addEventListener('click', () => openEnvModal());
  $('#settingsBtn').addEventListener('click', () => openSettings());

  /* =========================== ROUTING =========================== */
  const VIEWS = { bridge: renderBridge, log: renderLog, trends: renderTrends, pulse: renderPulse, reaction: renderReaction, crew: renderCrew, downlink: renderDownlink, library: renderLibrary, nasa: renderNasa, achievements: renderAchievements };
  function route() {
    let v = (location.hash || '#bridge').slice(1).split('?')[0];
    if (!VIEWS[v]) v = 'bridge';
    if (current === 'pulse' && v !== 'pulse' && ppg) { ppg.stop(); ppg = null; }
    if (current === 'reaction' && v !== 'reaction' && pvt) { pvt.abort(); pvt = null; }
    current = v;
    $$('.view').forEach(x => x.classList.toggle('active', x.id === 'view-' + v));
    $$('#nav a, #tabbar a').forEach(a => a.classList.toggle('active', a.dataset.view === v));
    $('#sidebar').classList.remove('open');
    VIEWS[v]();
    updatePrompt();
    window.scrollTo({ top: 0 });
  }
  function refresh() { renderTop(); VIEWS[current](); updatePrompt(); }
  addEventListener('hashchange', route);
  const go = v => { if (location.hash === '#' + v) route(); else location.hash = v; };

  /* =========================== PROMPT BAR =========================== */
  function updatePrompt() {
    const bar = $('#promptBar');
    const tasks = E.routineToday(S.active());
    const now = new Date(); const hm = now.getHours() * 60 + now.getMinutes();
    const due = tasks.find(t => !t.done && (parseInt(t.time) * 60 + parseInt(t.time.slice(3))) <= hm);
    if (!due || current === 'log' || current === 'reaction' || current === 'pulse') { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="pb-ico">${ico('clock')}</span><div class="pb-txt"><b>${esc(due.name)}</b> is due (scheduled ${due.time})<small>${esc(due.desc)} · +${due.xp} XP</small></div><button class="btn sm" id="pbGo">Start now</button>`;
    $('#pbGo').onclick = () => openTask(due.id);
  }
  function openTask(id) {
    if (id === 'pvt') return go('reaction');
    A._focusField = { vitals: 'hr', sleep: 'sleep', glucose: 'glucose', exercise: 'exercise', water: 'water', mood: 'mood' }[id];
    go('log');
  }

  /* =========================== BRIDGE =========================== */
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

  function renderBridge() {
    const el = $('#view-bridge');
    const crew = S.active(), env = S.env();
    const a = E.assess(S.state, crew);
    const tasks = E.routineToday(crew);
    const doneN = tasks.filter(t => t.done).length;
    const g = E.game(crew);
    const sleep7 = E.daily(crew, 'sleep', 7).filter(x => x.v != null).map(x => x.v);
    const debt = sleep7.reduce((s, v) => s + Math.max(0, 8 - v), 0);
    if (!selRegion) {
      // auto-select the worst region
      selRegion = Object.entries(a.regions).sort((x, y) => A.STATUS[y[1].status].rank - A.STATUS[x[1].status].rank)[0][0];
    }
    const name = crew.name === 'You' ? 'astronaut' : crew.name;
    const hm = new Date().getHours() * 60 + new Date().getMinutes();

    el.innerHTML = `
      <div class="hero">
        <div>
          <div class="eyebrow">Health bridge · ${esc(env.name)} · Day ${S.missionDay()}</div>
          <h1>${greeting()}, ${esc(name)}</h1>
          <p>${a.alerts.length ? `BioOrbit found <b>${a.alerts.length}</b> item${a.alerts.length > 1 ? 's' : ''} that need your attention. Tap any body region or indicator to understand it and see what to do.` : 'All monitored indicators are within reference ranges. Keep up your routine.'}</p>
          <div class="hero-stats">
            <div class="hstat"><div class="k">Radiation</div><div class="v">${a.dose.mission.toFixed(1)} <small>mSv</small></div></div>
            <div class="hstat"><div class="k">Career dose</div><div class="v">${a.dose.pct.toFixed(1)} <small>% limit</small></div></div>
            <div class="hstat"><div class="k">Sleep debt</div><div class="v">${debt.toFixed(1)} <small>h / 7 d</small></div></div>
            <div class="hstat"><div class="k">Streak</div><div class="v">🔥 ${g.streak} <small>days</small></div></div>
          </div>
          <div class="row">
            <a class="btn white" href="#log">${ico('plus')} Log health</a>
            <button class="btn light" id="breathBtn">${ico('wind')} Breathing</button>
          </div>
        </div>
        <div class="hero-ring">
          <div class="ring">${ringSVG(a.score, a.readiness.status)}
            <div class="ring-center"><div class="ring-val">${a.score}</div><div class="ring-lbl">Readiness</div></div>
          </div>
          ${pill(a.readiness.status, a.readiness.label)}
        </div>
      </div>

      <div class="grid g-hero mt">
        <div class="card">
          <div class="card-head"><h3>${chIco('cal')} Today's routine</h3><span class="sub mono">${doneN}/${tasks.length}</span></div>
          <div class="progress" style="margin-bottom:12px"><i style="width:${(doneN / tasks.length) * 100}%"></i></div>
          <div class="routine">
            ${tasks.map(t => {
              const due = !t.done && (parseInt(t.time) * 60 + parseInt(t.time.slice(3))) <= hm;
              return `<div class="task ${t.done ? 'done' : ''} ${due ? 'due' : ''}" data-task="${t.id}">
                <span class="chk">${t.done ? '✓' : ''}</span>
                <div><div class="t-name">${esc(t.name)}</div><div class="t-desc">${esc(t.desc)}</div></div>
                <div style="margin-left:auto;text-align:right"><div class="t-time">${t.time}</div><div class="t-xp">+${t.xp} XP</div></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>${chIco('alert')} Findings & guidance</h3><span class="sub">${esc(env.ground)}: ${esc(env.delayLabel)}</span></div>
          <div class="alerts">${alertsHTML(a.alerts.slice(0, 5), true)}</div>
          ${a.alerts.length > 5 ? `<p class="small" style="margin-top:8px">+${a.alerts.length - 5} more in the downlink report</p>` : ''}
        </div>
      </div>

      <div class="grid g-body mt">
        <div class="card">
          <div class="card-head"><h3>${chIco('body')} Body status</h3><span class="sub">tap a region</span></div>
          <div class="body-wrap">${bodySVG(a.regions, selRegion)}</div>
          <div class="body-legend">${['ok', 'watch', 'alert', 'critical', 'none'].map(s => `<span><i style="background:${col(s)}"></i>${A.STATUS[s].label}</span>`).join('')}</div>
        </div>
        <div class="card region-panel" id="regionPanel">${regionHTML(selRegion, a)}</div>
      </div>

      <div class="section-title"><h3>Health indicators</h3><span class="line"></span><span class="small">last 14 days · tap for trends</span></div>
      <div class="tiles">${TILE_ORDER.map(k => tileHTML(k, a, crew)).join('')}</div>
    `;
    animateRings(el);
    bindAlerts(el);
    $$('.task', el).forEach(t => t.addEventListener('click', () => openTask(t.dataset.task)));
    $$('[data-region]', el).forEach(r => r.addEventListener('click', () => {
      selRegion = r.dataset.region;
      $$('.hs, .organ', el).forEach(x => x.classList.toggle('sel', x.dataset.region === selRegion));
      $('#regionPanel').innerHTML = regionHTML(selRegion, a);
      bindRegion(el);
    }));
    bindRegion(el);
    $$('.tile', el).forEach(t => t.addEventListener('click', () => { trend.key = t.dataset.key; go('trends'); }));
    $('#breathBtn').addEventListener('click', openBreathing);
  }

  function alertsHTML(alerts, collapsible) {
    if (!alerts.length) return `<div class="allgood"><span style="font-size:22px">✓</span><div><b>All clear</b><br><small style="color:var(--text2)">No findings. Indicators nominal.</small></div></div>`;
    return alerts.map((al, i) => `
      <div class="alert-item ${al.sev} ${!collapsible || i === 0 ? 'open' : ''}">
        <div class="a-top"><span class="a-title">${esc(al.title)}</span>${pill(al.sev)}</div>
        <div class="a-body">
          <div class="a-detail">${esc(al.detail)}</div>
          ${al.actions.length ? `<ul>${al.actions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          ${al.escalate ? `<div class="esc">📡 ${esc(al.escalate)}</div>` : ''}
        </div>
      </div>`).join('');
  }
  function bindAlerts(root) { $$('.alert-item', root).forEach(x => x.addEventListener('click', () => x.classList.toggle('open'))); }

  function tileHTML(k, a, crew) {
    let st, val, unit, name, icon, spark, key = k, meta = '', drift = false, stale = false;
    if (k === 'bp') {
      const s = a.ind.sys, d = a.ind.dia;
      st = s.status === 'none' ? 'none' : (A.STATUS[s.status].rank >= A.STATUS[d.status].rank ? s.status : d.status);
      val = s.status === 'none' ? '—' : `${fmt('sys', s.v)}/${fmt('dia', d.v)}`;
      unit = 'mmHg'; name = 'Blood pressure'; icon = '◎'; key = 'sys';
      spark = E.daily(crew, 'sys', 14).map(x => x.v); meta = s.t ? ago(s.t) : 'no data';
      drift = !!(s.drift || d.drift); stale = s.stale;
    } else {
      const x = a.ind[k], def = I[k];
      st = x.status; val = x.status === 'none' ? '—' : fmt(k, x.v); unit = def.unit; name = def.short; icon = def.icon;
      spark = E.daily(crew, k, 14).map(y => y.v); meta = x.t ? ago(x.t) : 'no data'; drift = !!x.drift; stale = x.stale;
      if (k === 'weight' && x.v != null && crew.baseline.weight) {
        const pct = ((x.v - crew.baseline.weight) / crew.baseline.weight) * 100;
        meta = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs pre-flight`;
      }
    }
    return `<div class="tile ${stale ? 'stale' : ''}" data-key="${key}" style="--st:${col(st)}">
      <div class="t-top"><span class="t-name">${esc(name)}</span><span class="t-ico">${icon}</span></div>
      <div class="t-val">${val}<small>${esc(unit)}</small></div>
      <div class="t-meta"><span>${esc(meta)}${stale ? ' · stale' : ''}</span>${drift && (st === 'ok' || st === 'none') ? '<span class="drift-badge">DRIFT</span>' : pill(st)}</div>
      ${A.sparkline(spark, { color: col(st === 'none' ? 'none' : st) })}
    </div>`;
  }

  /* --------------------------- body map --------------------------- */
  function bodySVG(regions, sel) {
    const st = id => (regions[id] ? regions[id].status : 'none');
    const fillOrg = id => col(st(id));
    const arms = ['M54,98 C36,140 28,190 24,252', 'M146,98 C164,140 172,190 176,252'];
    const legs = ['M84,240 C80,300 80,360 82,418', 'M116,240 C120,300 120,360 118,418'];
    const torso = 'M66,86 C84,80 116,80 134,86 C148,90 154,100 152,116 C150,150 140,180 138,206 C137,226 140,240 136,252 C116,262 84,262 64,252 C60,240 63,226 62,206 C60,180 50,150 48,116 C46,100 52,90 66,86 Z';
    const neck = 'M90,62 L110,62 L113,88 L87,88 Z';
    const HS = { brain: [100, 26, 'Brain', 1], eyes: [109, 45, 'Eyes', 1], lungs: [80, 118, 'Lungs', -1], heart: [108, 140, 'Heart', 1], metabolism: [90, 186, 'Metabolism', -1], immune: [124, 172, 'Immune', 1], muscles: [35, 162, 'Muscles', -1], bones: [117, 330, 'Skeleton', 1] };
    const limb = (d, w, cls, extra) => `<path d="${d}" class="${cls}" stroke-width="${w}" stroke-linecap="round" ${extra || ''}/>`;
    const selc = id => (id === sel ? 'sel' : '');
    return `<svg class="body-svg" viewBox="-10 0 220 440" role="img" aria-label="Interactive body map">
      <defs>
        <linearGradient id="scanG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity="0"/><stop offset=".5" stop-color="#3b82f6" stop-opacity=".22"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></linearGradient>
        <radialGradient id="padG"><stop offset="0" stop-color="#3b82f6" stop-opacity=".25"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient>
        <mask id="bodyMask" maskUnits="userSpaceOnUse" x="-10" y="0" width="220" height="440">
          ${arms.map(d => limb(d, 21, '', 'stroke="#fff" fill="none"')).join('')}
          ${legs.map(d => limb(d, 27, '', 'stroke="#fff" fill="none"')).join('')}
          <path d="${torso}" fill="#fff"/><path d="${neck}" fill="#fff"/><ellipse cx="100" cy="38" rx="24" ry="28" fill="#fff"/>
        </mask>
      </defs>
      <ellipse cx="100" cy="428" rx="78" ry="9" fill="url(#padG)"/>
      <ellipse cx="100" cy="428" rx="60" ry="5" fill="none" stroke="rgba(37,99,235,.3)"/>
      <g fill="none">
        ${arms.map(d => limb(d, 21, 'sil-out')).join('')}${legs.map(d => limb(d, 27, 'sil-out')).join('')}
        ${arms.map(d => limb(d, 18, 'sil-in')).join('')}${legs.map(d => limb(d, 24, 'sil-in')).join('')}
      </g>
      <path d="${neck}" class="torso"/>
      <path d="${torso}" class="torso"/>
      <ellipse cx="100" cy="38" rx="24" ry="28" class="torso"/>
      <!-- anatomical hints -->
      <g stroke="rgba(37,99,235,.16)" fill="none" stroke-width="1">
        <path d="M100,92 L100,248" stroke-dasharray="3 4"/>
        <path d="M76,104 Q100,112 124,104 M74,114 Q100,124 126,114 M74,124 Q100,134 126,124"/>
        <path d="M70,236 Q100,250 130,236"/>
      </g>
      <!-- organs -->
      <ellipse class="organ ${selc('brain')}" data-region="brain" cx="100" cy="30" rx="17" ry="14" fill="${fillOrg('brain')}"/>
      <g class="organ ${selc('eyes')}" data-region="eyes" fill="${fillOrg('eyes')}"><ellipse cx="91" cy="45" rx="4.5" ry="2.6"/><ellipse cx="109" cy="45" rx="4.5" ry="2.6"/></g>
      <g class="organ ${selc('lungs')}" data-region="lungs" fill="${fillOrg('lungs')}"><ellipse cx="84" cy="130" rx="13" ry="24"/><ellipse cx="116" cy="130" rx="13" ry="24"/></g>
      <path class="organ ${selc('heart')}" data-region="heart" fill="${fillOrg('heart')}" d="M106,152 C96,144 92,138 95,132 C98,127 104,128 106,133 C108,128 114,127 117,132 C120,138 116,144 106,152 Z"/>
      <ellipse class="organ ${selc('metabolism')}" data-region="metabolism" cx="94" cy="186" rx="17" ry="12" fill="${fillOrg('metabolism')}"/>
      <ellipse class="organ ${selc('immune')}" data-region="immune" cx="124" cy="174" rx="7" ry="10" fill="${fillOrg('immune')}"/>
      <g class="organ ${selc('muscles')}" data-region="muscles" fill="${fillOrg('muscles')}"><ellipse cx="36" cy="162" rx="6.5" ry="18" transform="rotate(14 36 162)"/><ellipse cx="164" cy="162" rx="6.5" ry="18" transform="rotate(-14 164 162)"/><ellipse cx="83" cy="300" rx="8" ry="26"/><ellipse cx="117" cy="300" rx="8" ry="26" opacity="0"/></g>
      <g class="organ ${selc('bones')}" data-region="bones" stroke="${fillOrg('bones')}" stroke-width="5" stroke-linecap="round"><line x1="85" y1="262" x2="82" y2="384"/><line x1="115" y1="262" x2="118" y2="384"/></g>
      <!-- scan line -->
      <g mask="url(#bodyMask)" pointer-events="none"><rect class="scan" x="-10" y="0" width="220" height="40" fill="url(#scanG)"/></g>
      <!-- hotspots -->
      ${Object.entries(HS).map(([id, [x, y, label, side]]) => `
        <g class="hs ${st(id)} ${selc(id)}" data-region="${id}" tabindex="0" role="button" aria-label="${label}: ${A.STATUS[st(id)].label}">
          <circle class="halo" cx="${x}" cy="${y}" r="7" fill="none" stroke="${col(st(id))}" stroke-width="1.5"/>
          <circle class="dot" cx="${x}" cy="${y}" r="6.5" fill="${col(st(id))}"/>
          <text class="hs-label" x="${x + side * 12}" y="${y + 3}" text-anchor="${side > 0 ? 'start' : 'end'}">${label}</text>
        </g>`).join('')}
    </svg>`;
  }

  function regionHTML(id, a) {
    const r = A.REGIONS[id], st = a.regions[id].status, crew = S.active();
    const inds = r.indicators.map(k => {
      const x = a.ind[k];
      return `<div class="r-ind" data-key="${k}"><div class="n">${esc(I[k].short)}</div><div class="val">${x.status === 'none' ? '—' : fmt(k, x.v)} <small>${esc(I[k].unit)}</small></div>${x.drift && x.status === 'ok' ? '<span class="drift-badge">DRIFT</span>' : pill(x.status)}</div>`;
    }).join('');
    const syms = (r.symptoms || []).filter(s => a.sym.includes(s)).concat(Object.keys(A.SYMPTOMS).filter(s => A.SYMPTOMS[s].region === id && a.sym.includes(s) && !(r.symptoms || []).includes(s)));
    // actions: from the worst indicator in this region
    let actions = [];
    const worstK = r.indicators.filter(k => a.ind[k].status !== 'none').sort((x, y) => A.STATUS[a.ind[y].status].rank - A.STATUS[a.ind[x].status].rank)[0];
    if (worstK && A.STATUS[a.ind[worstK].status].rank >= 1) actions = I[worstK].actions[a.ind[worstK].status] || I[worstK].actions.watch || [];
    else if (worstK && a.ind[worstK].drift) actions = I[worstK].actions.watch || [];
    const pat = a.alerts.filter(al => al.kind === 'pattern' && r.indicators.includes(al.key));
    if (pat.length) actions = pat[0].actions;
    if (id === 'eyes' && a.sym.includes('vision')) actions = ['Perform the onboard visual acuity / Amsler grid test.', 'Report to the flight surgeon for SANS follow-up.'];
    const dose = r.radiation ? `<div class="r-sec"><h4>Radiation exposure</h4><p>${a.dose.mission.toFixed(1)} mSv this mission (${a.dose.perDay} mSv/day in ${esc(a.env.name)}), ${a.dose.total.toFixed(0)} mSv career — ${a.dose.pct.toFixed(1)} % of the ${A.CAREER_LIMIT_MSV} mSv limit.</p><div class="dose-bar"><i style="width:${Math.min(100, a.dose.pct)}%"></i></div></div>` : '';
    void crew;
    return `
      <div class="eyebrow">Body region</div>
      <h2>${esc(r.name)} ${pill(st)}</h2>
      <div class="r-sec"><h4>Function</h4><p>${esc(r.func)}</p></div>
      <div class="r-sec"><h4>What spaceflight does</h4><p>${esc(r.space)}</p></div>
      ${inds ? `<div class="r-sec"><h4>Indicators</h4><div class="r-inds">${inds}</div></div>` : ''}
      ${dose}
      <div class="r-sec"><h4>Symptoms (36 h)</h4><p>${syms.length ? syms.map(s => `<span class="pill alert plain" style="margin-right:6px">${esc(A.SYMPTOMS[s].name)}</span>`).join('') : 'None reported.'}</p></div>
      <div class="r-sec"><h4>What to do now</h4>${actions.length ? `<ul class="r-actions">${actions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>No action needed — keep your routine and keep logging.</p>'}</div>
    `;
  }
  function bindRegion(root) { $$('#regionPanel .r-ind', root).forEach(x => x.addEventListener('click', () => { trend.key = x.dataset.key; go('trends'); })); }

  /* =========================== LOG =========================== */
  const MOODS = ['😣', '🙁', '😐', '🙂', '😄'];
  function fieldHTML(k) {
    const d = I[k];
    return `<div class="field" data-k="${k}">
      <label for="f-${k}"><span>${d.icon} ${esc(d.name)}</span><button type="button" class="help-btn" aria-label="How to measure">?</button></label>
      <div class="in-row"><input id="f-${k}" type="number" inputmode="decimal" step="${d.step}" min="${d.min}" max="${d.max}" placeholder="${d.normal ? d.normal[0] : ''}"><span class="unit">${esc(d.unit)}</span></div>
      <div class="f-st"></div>
      ${k === 'hr' ? '<button type="button" class="cam-link" data-cam>📷 Measure with camera</button>' : ''}
      <div class="howto"><b>Why it matters:</b> ${esc(d.why)}<br><br><b>How to measure:</b><ol>${d.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${d.normal ? `<br>Reference range: <b>${d.normal[0]}–${d.normal[1]} ${esc(d.unit)}</b>` : ''}</div>
    </div>`;
  }
  function scaleField(k, labels, emoji) {
    const d = I[k];
    return `<div class="field" data-k="${k}">
      <label><span>${d.icon} ${esc(d.name)}</span><button type="button" class="help-btn" aria-label="Help">?</button></label>
      <div class="scale ${emoji ? '' : 'num'}" data-scale="${k}">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" title="${esc(labels[i - 1])}">${emoji ? emoji[i - 1] : i}</button>`).join('')}</div>
      <div class="f-st"></div>
      <div class="howto"><b>Why it matters:</b> ${esc(d.why)}<br><br>${esc(d.how[0])}</div>
    </div>`;
  }

  function renderLog() {
    const el = $('#view-log'), crew = S.active();
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Log health · ${esc(crew.name)}</div><h1>How are you today?</h1>
        <p>Fill in what you measured — anything is optional. Each field turns green, amber or red as you type, and the <b>?</b> explains why it matters and how to measure it in space.</p></div>
      </div>
      <form id="logForm" autocomplete="off">
        <div class="section-title"><h3>Vital signs</h3><span class="line"></span></div>
        <div class="form-grid">${['hr', 'sys', 'dia', 'spo2', 'temp', 'rr', 'glucose'].map(fieldHTML).join('')}</div>
        <div class="section-title"><h3>Body & countermeasures</h3><span class="line"></span></div>
        <div class="form-grid">${['exercise', 'water', 'weight'].map(fieldHTML).join('')}</div>
        <div class="section-title"><h3>Sleep & mind</h3><span class="line"></span></div>
        <div class="form-grid">
          ${fieldHTML('sleep')}
          ${scaleField('mood', ['Very low', 'Low', 'Okay', 'Good', 'Great'], MOODS)}
          ${scaleField('stress', ['Calm', 'Light', 'Manageable', 'High', 'Overwhelmed'])}
        </div>
        <div class="section-title"><h3>Symptoms</h3><span class="line"></span><span class="small">last 24 h</span></div>
        <div class="sym-grid">${Object.entries(A.SYMPTOMS).map(([k, s]) => `<label class="sym"><input type="checkbox" value="${k}"> ${esc(s.name)}</label>`).join('')}</div>
        <div class="section-title"><h3>Notes</h3><span class="line"></span></div>
        <div class="field"><textarea id="f-note" placeholder="Anything else the medical team should know?"></textarea></div>
        <div class="form-actions">
          <span class="fa-info" id="faInfo">Nothing entered yet</span>
          <button type="reset" class="btn sec">Clear</button>
          <button type="submit" class="btn">Save & assess</button>
        </div>
      </form>`;
    const form = $('#logForm');
    const scales = {};
    const update = () => {
      let n = 0;
      $$('.field[data-k]', form).forEach(f => {
        const k = f.dataset.k; const inp = $('input', f);
        const v = inp ? (inp.value === '' ? null : parseFloat(inp.value)) : scales[k];
        const stEl = $('.f-st', f);
        if (v == null || isNaN(v)) { f.removeAttribute('data-st'); stEl.textContent = ''; return; }
        n++;
        if (v < I[k].min || v > I[k].max) { f.dataset.st = 'critical'; stEl.style.color = 'var(--critical)'; stEl.textContent = `Check value (${I[k].min}–${I[k].max})`; return; }
        const s = E.classify(k, v, crew);
        f.dataset.st = s; stEl.style.color = col(s); stEl.textContent = '● ' + A.STATUS[s].label;
      });
      const sy = $$('.sym input:checked', form).length;
      $('#faInfo').textContent = n || sy ? `${n} value${n === 1 ? '' : 's'}${sy ? `, ${sy} symptom${sy > 1 ? 's' : ''}` : ''} ready to save` : 'Nothing entered yet';
    };
    form.addEventListener('input', update);
    $$('.help-btn', form).forEach(b => b.addEventListener('click', () => b.closest('.field').classList.toggle('help')));
    $$('.scale', form).forEach(sc => $$('button', sc).forEach(b => b.addEventListener('click', () => {
      const k = sc.dataset.scale, v = +b.dataset.v;
      scales[k] = scales[k] === v ? null : v;
      $$('button', sc).forEach(x => x.classList.toggle('on', +x.dataset.v === scales[k]));
      update();
    })));
    $$('.sym input', form).forEach(c => c.addEventListener('change', () => c.closest('.sym').classList.toggle('on', c.checked)));
    $('[data-cam]', form).addEventListener('click', () => go('pulse'));
    form.addEventListener('reset', () => { Object.keys(scales).forEach(k => scales[k] = null); setTimeout(() => { $$('.scale button', form).forEach(b => b.classList.remove('on')); $$('.sym', form).forEach(s => s.classList.remove('on')); update(); }); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = {};
      let bad = null;
      $$('.field[data-k]', form).forEach(f => {
        const k = f.dataset.k, inp = $('input', f);
        const val = inp ? (inp.value === '' ? null : parseFloat(inp.value)) : scales[k];
        if (val == null || isNaN(val)) return;
        if (val < I[k].min || val > I[k].max) { bad = I[k].name; return; }
        v[k] = val;
      });
      if (bad) { toast(`⚠ Please check <b>${esc(bad)}</b> — value out of possible range.`); return; }
      const sym = $$('.sym input:checked', form).map(c => c.value);
      const note = $('#f-note').value.trim();
      if (!Object.keys(v).length && !sym.length && !note) { toast('Enter at least one value to save.'); return; }
      const rec = { v, sym, note, src: 'manual' };
      withGame(() => S.addRecord(rec));
      renderTop();
      showAssessment(rec);
      form.reset();
    });
    if (A._focusField) {
      const f = $(`.field[data-k="${A._focusField}"]`, form);
      A._focusField = null;
      if (f) { setTimeout(() => { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = $('input', f); if (i) i.focus(); f.classList.add('help'); }, 250); }
    }
  }

  function showAssessment(rec) {
    const crew = S.active();
    const a = E.assess(S.state, crew);
    const keys = Object.keys(rec.v);
    const rel = a.alerts.filter(al => !al.key || keys.includes(al.key) || al.kind === 'pattern' || al.kind === 'symptom');
    const m = modal(`
      <div class="modal-head"><div><div class="eyebrow">Assessment</div><h2>Saved — here is what BioOrbit sees</h2></div><button class="x-btn" data-close>✕</button></div>
      <div class="result-score">
        <div class="mini-ring" style="width:84px;height:84px">${ringSVG(a.score, a.readiness.status, 84, 8)}<b style="font-size:22px">${a.score}</b></div>
        <div><div>${pill(a.readiness.status, a.readiness.label)}</div><div class="small" style="margin-top:6px">Readiness score updated with your new data.</div></div>
      </div>
      ${keys.length ? `<div class="r-inds" style="margin-bottom:14px">${keys.map(k => { const s = E.classify(k, rec.v[k], crew); return `<div class="r-ind"><div class="n">${esc(I[k].short)}</div><div class="val">${fmt(k, rec.v[k])} <small>${esc(I[k].unit)}</small></div>${pill(s)}</div>`; }).join('')}</div>` : ''}
      <div class="alerts">${alertsHTML(rel, false)}</div>
      <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn sec" data-close>Log more</button><a class="btn" href="#bridge" data-close>Back to bridge</a></div>`);
    animateRings(m);
  }

  /* =========================== TRENDS =========================== */
  function renderTrends() {
    const el = $('#view-trends'), crew = S.active();
    const keys = Object.keys(I);
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Trends</div><h1>How your body is adapting</h1>
        <p>Dynamic charts of each indicator over the mission. The green band is the reference range; points are colour-coded by status. BioOrbit also compares each value with <b>your own baseline</b> to catch early drift.</p></div>
        <div class="row">
          <div class="seg" id="rangeSeg">${[7, 14, 30].map(r => `<button data-r="${r}" class="${trend.range === r ? 'on' : ''}">${r} d</button>`).join('')}</div>
          <div class="seg" id="crewSeg"><button data-c="0" class="${!trend.crew ? 'on' : ''}">Me</button><button data-c="1" class="${trend.crew ? 'on' : ''}">Whole crew</button></div>
        </div>
      </div>
      <div class="chips" id="trendChips">${keys.map(k => `<button class="chip ${trend.key === k ? 'on' : ''}" data-k="${k}">${I[k].icon} ${esc(I[k].short)}</button>`).join('')}</div>
      <div class="card mt">
        <div class="card-head"><h3 id="trendTitle"></h3><span class="sub" id="trendSub"></span></div>
        <div class="chart-wrap"><canvas id="trendCanvas"></canvas><div class="chart-tip" id="trendTip"></div></div>
      </div>
      <div class="grid g-2 mt">
        <div class="card"><div class="card-head"><h3>${chIco('chart')} Statistics</h3></div><div class="stats" id="trendStats"></div><div class="insight" id="trendInsight"></div></div>
        <div class="card"><div class="card-head"><h3>${chIco('info')} Why this indicator matters</h3></div><div id="trendWhy" style="color:var(--text2);font-size:14px"></div></div>
      </div>`;
    chart = new A.LineChart($('#trendCanvas'), $('#trendTip'));
    chart.height = 320;
    $$('#trendChips .chip').forEach(c => c.addEventListener('click', () => { trend.key = c.dataset.k; $$('#trendChips .chip').forEach(x => x.classList.toggle('on', x === c)); drawTrend(); }));
    $$('#rangeSeg button').forEach(b => b.addEventListener('click', () => { trend.range = +b.dataset.r; $$('#rangeSeg button').forEach(x => x.classList.toggle('on', x === b)); drawTrend(); }));
    $$('#crewSeg button').forEach(b => b.addEventListener('click', () => { trend.crew = b.dataset.c === '1'; $$('#crewSeg button').forEach(x => x.classList.toggle('on', x === b)); drawTrend(); }));
    drawTrend();
    void crew;
  }

  function drawTrend() {
    const k = trend.key, d = I[k], crew = S.active();
    const people = trend.crew ? S.state.crew : [crew];
    const series = people.map(c => ({
      label: c.name, color: trend.crew ? c.color : '#0b6bed', data: E.daily(c, k, trend.range),
      classify: v => E.classify(k, v, c), fmt: v => `${fmt(k, v)} ${d.unit}`
    }));
    let band = d.normal;
    if (d.relative && crew.baseline[k]) band = [crew.baseline[k] * 0.98, crew.baseline[k] * 1.02];
    chart.set({ series, band, min: d.chartMin, max: d.chartMax });
    $('#trendTitle').innerHTML = `${d.icon} ${esc(d.name)}`;
    $('#trendSub').textContent = `${trend.crew ? 'All crew' : crew.name} · last ${trend.range} days · ${d.unit}`;
    const vals = series[0].data.filter(x => x.v != null);
    const vs = vals.map(x => x.v);
    const st = $('#trendStats');
    if (!vs.length) { st.innerHTML = '<div class="empty">No data yet for this indicator. Log a value to start your trend.</div>'; $('#trendInsight').textContent = ''; }
    else {
      const avg = vs.reduce((s, x) => s + x, 0) / vs.length;
      const inRange = vals.filter(x => E.classify(k, x.v, crew) === 'ok').length / vals.length * 100;
      // linear regression slope per 7 days
      const xs = vals.map(x => (x.day - vals[0].day) / A.DAY);
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
      let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (vs[i] - avg); den += (x - mx) * (x - mx); });
      const slope = den ? (num / den) * 7 : 0;
      st.innerHTML = [
        ['Latest', fmt(k, vs[vs.length - 1])], ['Average', fmt(k, avg)], ['Min', fmt(k, Math.min(...vs))], ['Max', fmt(k, Math.max(...vs))],
        ['In range', inRange.toFixed(0) + '%'], ['Trend / week', (slope > 0 ? '+' : '') + slope.toFixed(d.dec || 1)]
      ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join('');
      const dr = E.drift(crew, k);
      let txt;
      if (dr) txt = `⚠ <b>Baseline drift detected.</b> Your recent 3-day average (${fmt(k, dr.recent)} ${d.unit}) differs from your personal baseline (${fmt(k, dr.baseline)} ${d.unit}) by ${dr.delta > 0 ? '+' : ''}${fmt(k, dr.delta)} ${d.unit}. ${(d.actions.watch || [])[0] || ''}`;
      else if (Math.abs(slope) >= (d.drift || 1) * 0.5) txt = `↗ This indicator is ${slope > 0 ? 'rising' : 'falling'} by about ${Math.abs(slope).toFixed(d.dec || 1)} ${d.unit} per week. BioOrbit keeps watching it against your personal baseline.`;
      else txt = `✓ Stable: ${inRange.toFixed(0)} % of the readings in this period are within the reference range, with no meaningful drift from your personal baseline.`;
      $('#trendInsight').innerHTML = txt;
    }
    $('#trendWhy').innerHTML = `<p>${esc(d.why)}</p><h4 class="small" style="margin:14px 0 6px;text-transform:uppercase;letter-spacing:.14em">How to measure in space</h4><ol style="margin:0;padding-left:18px">${d.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      <h4 class="small" style="margin:14px 0 6px;text-transform:uppercase;letter-spacing:.14em">Related NASA hazards</h4><div class="chips">${d.hazards.map(h => `<span class="tag">${A.HAZARDS[h].icon} ${esc(A.HAZARDS[h].name)}</span>`).join('')}</div>`;
  }

  /* =========================== NASA DATA (real data) =========================== */
  // Two real data sources: live NOAA GOES proton flux (space weather) and NASA OSDR Inspiration4 crew blood tests.
  const nasa = { analyte: 'Lymphocytes' };
  const SW_URL = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json';
  const SW_KEY = 'bioorbit-spaceweather-v1';
  function sScale(pfu) { // NOAA Solar Radiation Storm scale, >=10 MeV integral proton flux
    if (pfu >= 1e5) return { s: 'S5', label: 'Extreme', lvl: 'critical' };
    if (pfu >= 1e4) return { s: 'S4', label: 'Severe', lvl: 'critical' };
    if (pfu >= 1e3) return { s: 'S3', label: 'Strong', lvl: 'alert' };
    if (pfu >= 1e2) return { s: 'S2', label: 'Moderate', lvl: 'alert' };
    if (pfu >= 10) return { s: 'S1', label: 'Minor', lvl: 'watch' };
    return { s: 'S0', label: 'Quiet', lvl: 'ok' };
  }
  function swAdvice(sc, envKey) {
    const deep = envKey === 'transit' || envKey === 'mars' || envKey === 'moon';
    if (sc.lvl === 'ok') return 'No solar radiation storm. Normal operations; EVAs can proceed as planned.';
    if (sc.lvl === 'watch') return deep ? 'Minor storm: keep EVAs short, carry a personal dosimeter and review the route to the storm shelter.' : 'Minor storm: little effect inside the station. Ground teams watch for escalation.';
    return deep ? 'Solar particle event: postpone EVAs, move to the radiation storm shelter (water/polyethylene-shielded area), log dosimeter readings every hour and notify Earth.'
                : 'Solar particle event: postpone EVAs and follow the station shelter plan in the most shielded module.';
  }
  async function loadSpaceWeather(force) {
    let cached = null; try { cached = JSON.parse(localStorage.getItem(SW_KEY) || 'null'); } catch (e) {}
    if (!force && cached && Date.now() - cached.fetched < 10 * 60 * 1000) return { ...cached, from: 'cache' };
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(SW_URL, { signal: ctl.signal }); clearTimeout(tm);
      const rows = (await r.json()).filter(x => x.energy === '>=10 MeV' && x.flux != null);
      const pts = rows.map(x => ({ t: Date.parse(x.time_tag), v: +x.flux }));
      const data = { fetched: Date.now(), pts: pts.filter((p, i) => i % 3 === 0 || i === pts.length - 1) };
      try { localStorage.setItem(SW_KEY, JSON.stringify(data)); } catch (e) {}
      return { ...data, from: 'live' };
    } catch (e) { return cached ? { ...cached, from: 'offline' } : null; }
  }
  function swChart(pts) {
    const W = 600, H = 150, lo = -1, hi = 5; // log10 pfu axis 0.1 .. 1e5
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1;
    const X = t => ((t - t0) / Math.max(1, t1 - t0)) * W, Y = v => H - ((Math.log10(Math.max(v, 0.1)) - lo) / (hi - lo)) * H;
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
    const thr = [10, 100, 1000].map((v, i) => `<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="${['#f59e0b', '#ef6c00', '#dc2626'][i]}" stroke-dasharray="4 6" stroke-width="1.2"/><text x="${W - 4}" y="${Y(v) - 4}" text-anchor="end" font-size="11" fill="${['#b45309', '#c2410c', '#b91c1c'][i]}">S${i + 1}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:150px;display:block">${thr}<path d="${line}" fill="none" stroke="#0b6bed" stroke-width="2.2"/></svg>`;
  }
  function osdrChart(a) {
    const O = A.OSDR, tps = O.timepoints, W = 640, H = 260, pad = 34;
    const vals = Object.values(a.series).flatMap(s => Object.values(s)).concat([a.lo, a.hi]).filter(v => v != null);
    let mn = Math.min(...vals), mx = Math.max(...vals); const sp = (mx - mn) || 1; mn -= sp * 0.12; mx += sp * 0.12;
    const X = i => pad + (i / (tps.length - 1)) * (W - pad * 2), Y = v => H - 26 - ((v - mn) / (mx - mn)) * (H - 46);
    const cols = ['#0b6bed', '#0ea5e9', '#14b8a6', '#f59e0b'];
    const band = a.lo != null && a.hi != null ? `<rect x="${pad}" width="${W - pad * 2}" y="${Y(a.hi)}" height="${Math.max(0, Y(a.lo) - Y(a.hi))}" fill="rgba(34,197,94,.10)"/>` : '';
    const launchX = (X(2) + X(3)) / 2;
    const lines = Object.entries(a.series).map(([c, s], k) => {
      const p = tps.map((t, i) => s[t] != null ? [X(i), Y(s[t])] : null).filter(Boolean);
      return `<path d="${p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')}" fill="none" stroke="${cols[k]}" stroke-width="2.4"/>` +
        p.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="3.6" fill="#fff" stroke="${cols[k]}" stroke-width="2"/>`).join('');
    }).join('');
    const xl = tps.map((t, i) => `<text x="${X(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#5b6b82">${t}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${band}
      <line x1="${launchX}" x2="${launchX}" y1="8" y2="${H - 24}" stroke="#94a3b8" stroke-dasharray="3 5"/><text x="${launchX}" y="16" text-anchor="middle" font-size="11" fill="#475569">3-day flight</text>
      ${lines}${xl}</svg>
      <div class="chips" style="margin-top:8px">${Object.keys(a.series).map((c, k) => `<span class="tag" style="background:${cols[k]}1a;color:${cols[k]}">● ${c}</span>`).join('')}<span class="tag" style="background:rgba(34,197,94,.12);color:#15803d">▇ lab reference range</span></div>`;
  }
  function osdrTable(name, a) {
    // Apply BioOrbit's personal-baseline idea to the real data: pre-flight mean (L-92, L-44, L-3) vs R+1.
    const rows = Object.entries(a.series).map(([c, s]) => {
      const pre = ['L-92', 'L-44', 'L-3'].map(t => s[t]).filter(v => v != null);
      const base = pre.reduce((x, y) => x + y, 0) / pre.length, r1 = s['R+1'];
      const d = r1 != null ? (r1 - base) / base * 100 : null;
      const inRange = r1 != null && (a.lo == null || r1 >= a.lo) && (a.hi == null || r1 <= a.hi);
      const drift = d != null && Math.abs(d) >= 15;
      return { c, base, r1, d, inRange, drift };
    });
    const hidden = rows.filter(r => r.drift && r.inRange).length, flagged = rows.filter(r => r.drift).length;
    const dec = a.lo != null && a.lo < 10 ? 2 : 0;
    const f = v => v == null ? '–' : (+v).toFixed(dec);
    const html = `<table class="tbl" style="width:100%;min-width:600px;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em"><th style="padding:8px 6px">Crew</th><th>Pre-flight baseline</th><th>R+1</th><th>Change</th><th>Earth range</th><th>Personal baseline</th></tr></thead><tbody>${rows.map(r => `<tr style="border-top:1px solid var(--line)"><td style="padding:9px 6px;font-weight:700">${r.c}</td><td>${f(r.base)}</td><td>${f(r.r1)}</td><td>${r.d == null ? '–' : (r.d > 0 ? '+' : '') + r.d.toFixed(0) + '%'}</td><td>${r.r1 == null ? '–' : r.inRange ? '<span class="tag" style="background:rgba(34,197,94,.12);color:#15803d">in range</span>' : '<span class="tag" style="background:rgba(239,68,68,.12);color:#b91c1c">out of range</span>'}</td><td>${r.d == null ? '–' : r.drift ? '<span class="tag" style="background:rgba(245,158,11,.15);color:#b45309">drift ≥15%</span>' : '<span class="tag">stable</span>'}</td></tr>`).join('')}</tbody></table>`;
    const msg = flagged === 0 ? `No crew member changed by 15% or more from their own pre-flight baseline the day after landing.`
      : `${flagged} of ${rows.length} crew members changed by ≥15% from their <b>own</b> pre-flight baseline the day after landing${hidden ? `, and <b>${hidden}</b> of them were still inside the Earth reference range, so a population-range check alone would have called them normal` : ''}. This is exactly the gap BioOrbit's personal-baseline engine is built to close.`;
    return { html, msg };
  }
  function renderNasa() {
    const el = $('#view-nasa'), O = A.OSDR, env = S.env();
    const names = Object.keys(O.analytes);
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Real data · NASA OSDR &amp; NOAA</div><h1>Real space data, not just simulations</h1>
      <p>The crew in the rest of the app is simulated. This page uses <b>real data</b>: live solar-radiation measurements from NOAA's GOES satellite and blood tests from the four civilian astronauts of SpaceX <b>Inspiration4</b>, published by NASA's Open Science Data Repository.</p></div></div>
      <div class="card"><div class="card-head"><h3>${chIco('alert')} Space weather now · solar radiation storms</h3><span class="sub" id="swSrc">loading…</span></div>
        <div id="swBody"><div class="empty">Fetching GOES ≥10 MeV proton flux…</div></div></div>
      <div class="card mt"><div class="card-head"><h3>${chIco('chart')} Inspiration4 crew blood tests</h3><span class="sub">OSD-569 · OSD-575 · C001–C004</span></div>
        <div class="chips" id="osdrChips">${names.map(n => `<button class="chip ${nasa.analyte === n ? 'on' : ''}" data-a="${esc(n)}">${esc(n)}</button>`).join('')}</div>
        <div id="osdrChart" class="mt" style="max-width:760px"></div>
        <div class="insight" id="osdrMsg"></div>
        <div id="osdrTable" class="mt" style="overflow-x:auto"></div>
        <p class="small" style="color:var(--muted);margin-top:12px">Source: NASA OSDR <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-569" target="_blank" rel="noopener">OSD-569</a> (complete blood count) and <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noopener">OSD-575</a> (metabolic panel), SpaceX Inspiration4, 2021. L-n = days before launch, R+n = days after return. Educational use only, not a diagnosis.</p></div>`;
    const drawA = () => {
      const a = O.analytes[nasa.analyte];
      $('#osdrChart').innerHTML = `<div class="small" style="color:var(--muted);margin-bottom:6px">${esc(nasa.analyte)} · ${esc(a.unit)} · ${a.src}</div>` + osdrChart(a);
      const t = osdrTable(nasa.analyte, a); $('#osdrTable').innerHTML = t.html; $('#osdrMsg').innerHTML = t.msg;
    };
    $$('#osdrChips .chip').forEach(c => c.addEventListener('click', () => { nasa.analyte = c.dataset.a; $$('#osdrChips .chip').forEach(x => x.classList.toggle('on', x === c)); drawA(); }));
    drawA();
    loadSpaceWeather(false).then(sw => {
      if (current !== 'nasa') return;
      if (!sw || !sw.pts || !sw.pts.length) { $('#swSrc').textContent = 'offline'; $('#swBody').innerHTML = '<div class="empty">No connection and no cached reading yet. BioOrbit keeps working offline; the radiation card uses the onboard dose model until a link is available.</div>'; return; }
      const last = sw.pts[sw.pts.length - 1], sc = sScale(last.v);
      const ago = Math.round((Date.now() - last.t) / 60000);
      $('#swSrc').textContent = sw.from === 'live' ? 'live · NOAA SWPC' : sw.from === 'cache' ? 'cached · NOAA SWPC' : 'offline · last known';
      const color = { ok: '#15803d', watch: '#b45309', alert: '#c2410c', critical: '#b91c1c' }[sc.lvl];
      $('#swBody').innerHTML = `<div class="grid g-2" style="align-items:center">
        <div><div style="font-size:44px;font-weight:800;color:${color};letter-spacing:-.02em">${sc.s} · ${sc.label}</div>
          <div style="color:var(--text2);margin-top:4px">≥10 MeV protons: <b>${last.v < 1 ? last.v.toFixed(2) : last.v.toFixed(1)} pfu</b> · ${ago <= 1 ? 'just now' : ago + ' min ago'} · GOES-${'primary'}</div>
          <div class="insight" style="margin-top:12px"><b>${esc(env.name)}:</b> ${swAdvice(sc, S.state.envKey)}</div></div>
        <div>${swChart(sw.pts)}<div class="small" style="color:var(--muted);text-align:right">last 24 h · log scale · NOAA storm thresholds S1–S3</div></div></div>`;
    });
  }

  /* =========================== PULSE =========================== */
  function renderPulse() {
    const el = $('#view-pulse');
    const C = 2 * Math.PI * 138;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Camera pulse · photoplethysmography</div><h1>Measure heart rate with a camera</h1>
      <p>No extra hardware: each heartbeat changes how much light passes through your fingertip. BioOrbit reads that tiny colour change from the camera and calculates your pulse — entirely on-device.</p></div></div>
      <div class="card">
        <div class="pulse-stage">
          <div>
            <div class="cam">
              <video id="camVideo" playsinline muted></video>
              <div class="cam-msg" id="camMsg">Camera off</div>
              <svg class="cam-ring" viewBox="0 0 280 280"><circle cx="140" cy="140" r="138" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/><circle id="camProg" cx="140" cy="140" r="138" fill="none" stroke="#ff4d6d" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 140 140)" style="filter:drop-shadow(0 0 6px #ff4d6d)"/></svg>
            </div>
          </div>
          <div>
            <div class="bpm-big"><span class="heart">♥</span><span id="bpmVal">--</span><small>bpm</small></div>
            <div class="quality" style="margin:10px 0 14px"><span>Signal</span><div class="progress"><i id="qBar" style="width:0%"></i></div><span id="qTxt" class="mono">0%</span></div>
            <canvas class="wave" id="waveCanvas"></canvas>
            <div class="row" style="margin-top:16px">
              <button class="btn lg" id="camStart">▶ Start measurement</button>
              <button class="btn sec" id="camStop" disabled>Stop</button>
              <span class="small" id="camStatus"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="grid g-2 mt">
        <div class="card"><div class="card-head"><h3>${chIco('list')} How to measure</h3></div>
          <ol class="steps">
            <li>Phone: cover the <b>rear camera and flash</b> with your fingertip. Laptop: cover the webcam and point a light (or a bright screen) at your fingertip.</li>
            <li>Press lightly — too much pressure stops the blood flow.</li>
            <li>Hold still for 20 seconds while the ring fills.</li>
            <li>Save the result to your log.</li>
          </ol>
          <p class="small" style="margin-top:12px">Images are processed in memory and never stored or transmitted.</p>
        </div>
        <div class="card"><div class="card-head"><h3>${chIco('tap')} No camera? Tap the beat</h3><span class="sub">fallback mode</span></div>
          <p class="small" style="margin-bottom:10px">Find your pulse at the wrist or neck and tap the pad on every beat (or press <b>B</b>).</p>
          <div class="tap-pad" id="tapPad">Tap on each heartbeat</div>
          <div class="row" style="margin-top:12px"><span>Result: <b class="mono" id="tapVal">--</b> bpm</span><span class="spacer"></span><button class="btn sm" id="tapSave" disabled>Save</button></div>
        </div>
      </div>`;
    const prog = $('#camProg');
    const setStatus = t => { $('#camStatus').textContent = t; };
    $('#camStart').addEventListener('click', async () => {
      if (ppg) return;
      ppg = new A.PPG({
        video: $('#camVideo'), wave: $('#waveCanvas'), duration: 20000,
        onUpdate: u => {
          $('#camMsg').textContent = u.finger ? '' : 'Cover the camera with your fingertip';
          $('#camMsg').style.background = u.finger ? 'transparent' : 'rgba(5,8,22,.55)';
          $('#bpmVal').textContent = u.bpm && u.quality > 0.3 ? Math.round(u.bpm) : '--';
          const q = Math.round(u.quality * 100);
          $('#qBar').style.width = q + '%'; $('#qTxt').textContent = q + '%';
          prog.style.strokeDashoffset = C * (1 - u.progress);
          setStatus(u.finger ? `Measuring… ${Math.round(u.progress * 20)} / 20 s${u.torch ? ' · flash on' : ''}` : 'Waiting for fingertip');
        },
        onDone: r => {
          ppg = null;
          $('#camStart').disabled = false; $('#camStop').disabled = true;
          if (!r.bpm) { setStatus('Signal too weak — try more light and less pressure.'); return; }
          $('#bpmVal').textContent = r.bpm;
          const s = E.classify('hr', r.bpm);
          modal(`<div class="modal-head"><div><div class="eyebrow">Camera pulse</div><h2>${r.bpm} bpm ${pill(s)}</h2></div><button class="x-btn" data-close>✕</button></div>
            <p style="color:var(--text2)">Measured from ${r.samples} high-quality signal windows. Save it as your resting heart rate?</p>
            <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn sec" data-close>Discard</button><button class="btn" id="saveCam">Save to log</button></div>`);
          $('#saveCam').addEventListener('click', () => {
            withGame(() => { S.active().camera = true; S.addRecord({ v: { hr: r.bpm }, src: 'camera' }); });
            closeModal(); renderTop(); toast('❤ Heart rate saved from camera');
          });
        }
      });
      try {
        $('#camStart').disabled = true; $('#camStop').disabled = false; setStatus('Starting camera…');
        await ppg.start();
      } catch (err) {
        ppg = null; $('#camStart').disabled = false; $('#camStop').disabled = true;
        setStatus(''); $('#camMsg').textContent = 'Camera unavailable: ' + (err.message || err.name) + '. Use the tap mode below.';
      }
    });
    $('#camStop').addEventListener('click', () => { if (ppg) { ppg.stop(); ppg = null; } $('#camStart').disabled = false; $('#camStop').disabled = true; setStatus('Stopped'); $('#camMsg').textContent = 'Camera off'; });

    const tp = new A.TapPulse();
    let tapBpm = null;
    const doTap = () => {
      const pad = $('#tapPad'); if (!pad) return;
      pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90);
      const r = tp.tap();
      pad.textContent = r.bpm ? `${r.bpm} bpm · keep tapping` : `${r.n} tap${r.n > 1 ? 's' : ''} — keep going`;
      if (r.bpm) { tapBpm = r.bpm; $('#tapVal').textContent = r.bpm; $('#tapSave').disabled = false; }
    };
    $('#tapPad').addEventListener('pointerdown', doTap);
    A._tapKey = doTap;
    $('#tapSave').addEventListener('click', () => {
      if (!tapBpm) return;
      withGame(() => S.addRecord({ v: { hr: tapBpm }, src: 'tap' }));
      renderTop(); toast(`❤ Heart rate <b>${tapBpm} bpm</b> saved`);
    });
  }

  /* =========================== REACTION (PVT) =========================== */
  function renderReaction() {
    const el = $('#view-reaction'), crew = S.active();
    const hist = E.daily(crew, 'pvt', 14).map(x => x.v);
    const last = [...crew.records].reverse().find(r => r.src === 'pvt');
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Cognitive check · psychomotor vigilance test</div><h1>Reaction test</h1>
      <p>Fatigue hides from the person who has it. This brief vigilance test (the same kind used on the ISS) measures how fast you react. Slower reactions and "lapses" warn that sleep loss or stress is affecting you.</p></div>
      <div class="seg" id="durSeg"><button data-d="60000" class="${pvtDur === 60000 ? 'on' : ''}">Quick · 1 min</button><button data-d="180000" class="${pvtDur === 180000 ? 'on' : ''}">Standard · 3 min</button></div></div>
      <div class="card">
        <div class="pvt-area" id="pvtArea" tabindex="0">
          <div class="pvt-prog" id="pvtProg" style="width:0"></div>
          <div class="pvt-target"><span class="pvt-counter" id="pvtCounter">READY</span></div>
          <div class="pvt-hint" id="pvtHint">Press <b>Start</b>. When the circle lights up, click / tap / press <b>Space</b> as fast as you can.</div>
        </div>
        <div class="row" style="margin-top:16px"><button class="btn lg" id="pvtStart">▶ Start test</button><button class="btn sec" id="pvtAbort" disabled>Cancel</button><span class="small" id="pvtInfo"></span></div>
      </div>
      <div class="grid g-2 mt">
        <div class="card" id="pvtResult"><div class="card-head"><h3>${chIco('clock')} Last result</h3></div>${last ? `<div class="stats"><div class="stat"><div class="k">Mean RT</div><div class="v">${fmt('pvt', last.v.pvt)} ms</div></div><div class="stat"><div class="k">Lapses</div><div class="v">${last.pvt ? last.pvt.lapses : '—'}</div></div><div class="stat"><div class="k">Status</div><div class="v" style="font-size:14px">${pill(E.classify('pvt', last.v.pvt))}</div></div><div class="stat"><div class="k">When</div><div class="v" style="font-size:14px">${ago(last.t)}</div></div></div>` : '<div class="empty">No test yet</div>'}</div>
        <div class="card"><div class="card-head"><h3>${chIco('chart')} 14-day vigilance trend</h3><span class="sub">mean reaction time</span></div>${A.sparkline(hist, { w: 400, h: 110, color: 'var(--accent)' }).replace('class="spark"', 'class="spark" style="width:100%;height:110px"')}
          <p class="small" style="margin-top:8px">Under 300 ms nominal · lapses = reactions slower than 355 ms (PVT-B criterion).</p></div>
      </div>`;
    $$('#durSeg button').forEach(b => b.addEventListener('click', () => { if (pvt) return; pvtDur = +b.dataset.d; $$('#durSeg button').forEach(x => x.classList.toggle('on', x === b)); }));
    const area = $('#pvtArea');
    const respond = () => { if (pvt) pvt.respond(); };
    area.addEventListener('pointerdown', e => { e.preventDefault(); respond(); });
    A._pvtKey = respond;
    $('#pvtStart').addEventListener('click', () => {
      if (pvt) return;
      $('#pvtStart').disabled = true; $('#pvtAbort').disabled = false;
      $('#pvtHint').textContent = 'Wait for the circle to light up…';
      area.focus();
      pvt = new A.PVT({
        target: area, counter: $('#pvtCounter'), duration: pvtDur,
        onTick: (p, n) => { $('#pvtProg').style.width = (p * 100) + '%'; $('#pvtInfo').textContent = `${n} responses · ${Math.ceil((1 - p) * pvtDur / 1000)} s left`; },
        onDone: r => {
          pvt = null;
          $('#pvtStart').disabled = false; $('#pvtAbort').disabled = true;
          $('#pvtCounter').textContent = 'DONE'; $('#pvtHint').textContent = 'Test complete'; $('#pvtProg').style.width = '100%';
          if (!r.trials) { toast('No valid responses recorded.'); return; }
          const mean = Math.round(r.mean);
          withGame(() => S.addRecord({ v: { pvt: mean }, src: 'pvt', pvt: { lapses: r.lapses, falseStarts: r.falseStarts, trials: r.trials, median: Math.round(r.median), fast10: Math.round(r.fast10) } }));
          renderTop();
          showPvtResult(r);
        }
      });
      pvt.start();
    });
    $('#pvtAbort').addEventListener('click', () => { if (pvt) pvt.abort(); pvt = null; $('#pvtStart').disabled = false; $('#pvtAbort').disabled = true; $('#pvtCounter').textContent = 'READY'; $('#pvtProg').style.width = '0'; $('#pvtInfo').textContent = 'Cancelled'; });
  }

  function showPvtResult(r) {
    const s = E.classify('pvt', r.mean);
    const bins = new Array(12).fill(0); // 150–750 ms, 50 ms bins
    r.rts.forEach(x => { const i = Math.min(11, Math.max(0, Math.floor((x - 150) / 50))); bins[i]++; });
    const mx = Math.max(1, ...bins);
    const msg = s === 'ok' ? 'Your vigilance is nominal. You are cleared for critical tasks.' : s === 'watch' ? 'Slightly slower than optimal. Consider a short rest before critical operations.' : 'Your reactions show signs of fatigue. Avoid critical operations without a cross-check and prioritise sleep.';
    const card = $('#pvtResult');
    if (card) card.innerHTML = `<div class="card-head"><h3>Result</h3>${pill(s)}</div>
      <div class="stats">
        <div class="stat"><div class="k">Mean RT</div><div class="v">${Math.round(r.mean)} ms</div></div>
        <div class="stat"><div class="k">Median</div><div class="v">${Math.round(r.median)} ms</div></div>
        <div class="stat"><div class="k">Fastest 10%</div><div class="v">${Math.round(r.fast10)} ms</div></div>
        <div class="stat"><div class="k">Lapses</div><div class="v">${r.lapses}</div></div>
        <div class="stat"><div class="k">False starts</div><div class="v">${r.falseStarts}</div></div>
        <div class="stat"><div class="k">Performance</div><div class="v">${r.score}%</div></div>
      </div>
      <h4 class="small" style="margin:14px 0 6px">Reaction-time distribution</h4>
      <div class="hist">${bins.map((b, i) => `<div class="${150 + i * 50 >= 350 ? 'lapse' : ''}" style="height:${(b / mx) * 100}%" title="${150 + i * 50}–${200 + i * 50} ms: ${b}"></div>`).join('')}</div>
      <div class="hist-x"><span>150</span><span>350</span><span>550</span><span>750+ ms</span></div>
      <div class="insight">${esc(msg)}</div>`;
  }

  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (current === 'reaction' && (e.code === 'Space' || e.key === ' ')) { e.preventDefault(); if (A._pvtKey) A._pvtKey(); }
    if (current === 'pulse' && (e.key === 'b' || e.key === 'B')) { if (A._tapKey) A._tapKey(); }
  });

  /* =========================== CREW =========================== */
  function renderCrew() {
    const el = $('#view-crew');
    const data = S.state.crew.map(c => ({ c, a: E.assess(S.state, c) }));
    const cols = ['hr', 'sys', 'spo2', 'temp', 'glucose', 'sleep', 'pvt', 'mood', 'stress', 'exercise'];
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Crew medical overview</div><h1>Crew health at a glance</h1>
      <p>For the crew medical officer and commander: who is ready, who needs attention, and which indicators are out of range. Tap a crew member to open their bridge.</p></div></div>
      <div class="crew-grid">
        ${data.map(({ c, a }) => `
          <div class="card crew-card ${c.id === S.state.activeId ? 'me' : ''}" data-id="${c.id}">
            <div class="crew-top">
              <span class="avatar" style="background:${c.color}">${initials(c.name)}</span>
              <div><b>${esc(c.name)}</b><div class="small">${esc(c.callsign)} · ${esc(c.role)}</div></div>
              <div class="mini-ring">${ringSVG(a.score, a.readiness.status, 64, 6)}<b>${a.score}</b></div>
            </div>
            <div style="margin-top:12px">${pill(a.readiness.status, a.readiness.label)}</div>
            <div class="crew-alert">${a.alerts.length ? `⚠ ${esc(a.alerts[0].title)}${a.alerts.length > 1 ? ` <span class="small">+${a.alerts.length - 1}</span>` : ''}` : '✓ No findings'}</div>
            <div class="crew-dots">${Object.entries(a.regions).map(([id, r]) => `<span><i style="background:${col(r.status)}"></i>${esc(A.REGIONS[id].name.split(' ')[0])}</span>`).join('')}</div>
          </div>`).join('')}
      </div>
      <div class="card mt">
        <div class="card-head"><h3>${chIco('grid')} Latest indicators heat-map</h3><span class="sub">colour = status</span></div>
        <div class="table-scroll"><table class="heat">
          <thead><tr><th>Crew</th>${cols.map(k => `<th>${esc(I[k].short)}</th>`).join('')}</tr></thead>
          <tbody>${data.map(({ c, a }) => `<tr><td class="name"><span class="avatar" style="background:${c.color};width:24px;height:24px;font-size:10px;display:inline-grid;vertical-align:middle;margin-right:8px">${initials(c.name)}</span>${esc(c.name)}</td>${cols.map(k => { const x = a.ind[k]; return `<td class="${x.stale ? 'none' : x.status}" title="${esc(I[k].name)}">${x.status === 'none' ? '—' : fmt(k, x.v)}</td>`; }).join('')}</tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    animateRings(el);
    $$('.crew-card', el).forEach(c => c.addEventListener('click', () => { S.state.activeId = c.dataset.id; S.save(); selRegion = null; renderTop(); go('bridge'); }));
  }

  /* =========================== DOWNLINK =========================== */
  function renderDownlink() {
    const el = $('#view-downlink'), crew = S.active(), env = S.env();
    const rep = E.buildReport(S.state, crew);
    const bytes = new Blob([JSON.stringify(rep.json)]).size;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Delay-tolerant telemedicine</div><h1>Downlink to ${esc(env.ground)}</h1>
      <p>Far from Earth the crew acts first and Earth confirms later. BioOrbit packages a compact, structured health report that can be sent through any data link — even with a ${esc(env.delayLabel)} delay.</p></div></div>
      <div class="grid g-2">
        <div class="card">
          <div class="card-head"><h3>${chIco('file')} Report preview</h3><span class="sub mono">${(bytes / 1024).toFixed(1)} KB JSON</span></div>
          <pre class="report" id="reportTxt">${esc(rep.text)}</pre>
          <div class="row no-print" style="margin-top:14px">
            <button class="btn sec sm" id="dlTxt">⬇ .txt</button>
            <button class="btn sec sm" id="dlJson">⬇ .json</button>
            <button class="btn sec sm" id="dlCopy">⧉ Copy</button>
            <button class="btn sec sm" id="dlPrint">🖨 Print / PDF</button>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h3>${chIco('send')} Transmit</h3><span class="sub">${esc(env.name)} → ${env.delay === 0 ? 'Care team' : 'Earth'}</span></div>
            <div class="transmit">
              <svg viewBox="0 0 400 150">
                <defs><radialGradient id="earthG" cx=".35" cy=".35"><stop offset="0" stop-color="#7dd3fc"/><stop offset=".6" stop-color="#2563eb"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient></defs>
                <g transform="translate(46 75)"><rect x="-14" y="-8" width="28" height="16" rx="4" fill="#cbd5e1"/><rect x="-40" y="-5" width="22" height="10" fill="#60a5fa"/><rect x="18" y="-5" width="22" height="10" fill="#60a5fa"/><circle r="3" fill="#1e3a8a"/></g>
                <path id="txPath" d="M80,75 Q200,10 330,75" fill="none" stroke="rgba(147,197,253,.6)" stroke-width="2" stroke-dasharray="4 6"/>
                <circle cx="350" cy="75" r="28" fill="url(#earthG)"/><ellipse cx="350" cy="75" rx="40" ry="9" fill="none" stroke="rgba(125,211,252,.3)"/>
                <circle id="txDot" r="5" fill="#fff" style="filter:drop-shadow(0 0 6px #93c5fd)" opacity="0"/>
                <text x="46" y="118" text-anchor="middle" fill="#c7d7fb" font-size="11">${esc(env.name)}</text>
                <text x="350" y="125" text-anchor="middle" fill="#c7d7fb" font-size="11">${env.delay === 0 ? 'Care team' : 'Mission Control'}</text>
              </svg>
            </div>
            <div class="tx-status"><span id="txState">Ready · one-way delay <b>${esc(env.delayLabel)}</b></span><button class="btn" id="txBtn">Transmit report</button></div>
            <p class="small" style="margin-top:10px">${esc(env.note)} ${env.delay > 60 ? 'The animation is time-compressed; the real arrival time is shown.' : ''}</p>
          </div>
          <div class="card mt"><div class="card-head"><h3>${chIco('history')} History</h3></div>
            <div class="dl-list">${(crew.downlinks || []).slice().reverse().map(d => `<div class="dl-item"><span>📡 ${new Date(d.t).toLocaleString()}</span><span class="mono">${(d.size / 1024).toFixed(1)} KB · ${esc(d.score)}/100</span></div>`).join('') || '<div class="empty">No reports sent yet</div>'}</div>
          </div>
        </div>
      </div>`;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    $('#dlTxt').onclick = () => download(`bioorbit-report-${crew.callsign}-${stamp}.txt`, rep.text);
    $('#dlJson').onclick = () => download(`bioorbit-report-${crew.callsign}-${stamp}.json`, JSON.stringify(rep.json, null, 2), 'application/json');
    $('#dlCopy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(rep.text) : Promise.reject()).then(() => toast('Report copied'), () => toast('Copy not available')); };
    $('#dlPrint').onclick = () => {
      const w = window.open('', '_blank');
      if (!w) { toast('Allow pop-ups to print'); return; }
      w.document.write(`<!doctype html><title>BioOrbit report</title><pre style="font:12px/1.5 monospace;white-space:pre-wrap">${esc(rep.text)}</pre>`);
      w.document.close(); w.focus(); w.print();
    };
    $('#txBtn').onclick = () => {
      const btn = $('#txBtn'); btn.disabled = true;
      const path = $('#txPath'), dot = $('#txDot'), L = path.getTotalLength();
      const realMs = env.delay * 1000;
      const animMs = Math.max(1600, Math.min(6000, realMs));
      const eta = new Date(Date.now() + realMs);
      $('#txState').innerHTML = `Transmitting… arrival at <b>${eta.toLocaleTimeString()}</b>`;
      dot.setAttribute('opacity', '1');
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / animMs);
        const pt = path.getPointAtLength(L * p);
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        if (p < 1) requestAnimationFrame(step);
        else {
          dot.setAttribute('opacity', '0');
          withGame(() => { crew.downlinks = crew.downlinks || []; crew.downlinks.push({ t: Date.now(), size: bytes, score: rep.assessment.score, delay: env.delay }); S.save(); });
          toast(`📡 Report ${env.delay > 60 ? 'queued — arrives at Earth at <b>' + eta.toLocaleTimeString() + '</b>' : 'received by ' + esc(env.ground.toLowerCase())}`);
          setTimeout(() => { if (current === 'downlink') renderDownlink(); }, 900);
        }
      };
      requestAnimationFrame(step);
    };
  }

  /* =========================== LIBRARY =========================== */
  function rangeBar(k) {
    const d = I[k]; if (!d.ranges) return '<p class="small">Evaluated relative to your pre-flight baseline: &lt;2 % nominal, 2–5 % watch, &gt;5 % alert.</p>';
    const lo = d.chartMin, hi = d.chartMax;
    const segs = d.ranges.map(([a, b, s]) => [Math.max(lo, a), Math.min(hi, b), s]).filter(([a, b]) => b > a);
    return `<div class="range-bar">${segs.map(([a, b, s]) => `<div style="flex:${b - a};background:${col(s)}" title="${a}–${b} ${d.unit}: ${A.STATUS[s].label}">${b - a > (hi - lo) * 0.12 ? `${+a.toFixed(1)}–${+b.toFixed(1)}` : ''}</div>`).join('')}</div>`;
  }
  function renderLibrary() {
    const el = $('#view-library');
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Knowledge library</div><h1>Understand the risks</h1>
      <p>Astronauts are not expected to be doctors. This library explains each hazard of human spaceflight mapped by NASA's Human Research Program, what BioOrbit monitors for it, and how each measurement works.</p></div></div>
      <div class="grid g-3">${Object.values(A.HAZARDS).map(h => `
        <div class="card hazard"><div class="hz-ico">${h.icon}</div><h3>${esc(h.name)}</h3><p style="margin-top:6px">${esc(h.text)}</p>
        <h4>BioOrbit monitors</h4><ul>${h.monitor.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h4>Countermeasures</h4><ul>${h.counter.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}
        <div class="card hazard feature"><div class="hz-ico">🌍</div><h3>Benefits on Earth</h3><p style="margin-top:6px">The same offline, delay-tolerant approach supports people far from hospitals: remote and riverside communities, Antarctic stations, ships, and home monitoring connected to telemedicine.</p></div>
      </div>
      <div class="section-title"><h3>Indicator reference</h3><span class="line"></span></div>
      <div class="grid" style="gap:10px">${Object.entries(I).map(([k, d]) => `
        <details class="ind-ref"><summary><span class="t-ico">${d.icon}</span><b>${esc(d.name)}</b><span class="small">${esc(d.unit)}</span></summary>
          <div class="ir-body"><p>${esc(d.why)}</p>${rangeBar(k)}<div><b>How to measure</b><ol style="margin:6px 0 0;padding-left:18px">${d.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
          <div class="chips">${d.hazards.map(h => `<span class="tag">${A.HAZARDS[h].icon} ${esc(A.HAZARDS[h].name)}</span>`).join('')}</div></div>
        </details>`).join('')}</div>
      <div class="section-title"><h3>About this project</h3><span class="line"></span></div>
      <div class="card about-card">
        <div><img src="assets/img/bioorbit-logo.webp" alt="BioOrbit" style="width:200px;height:auto;mix-blend-mode:multiply;margin-bottom:10px">
          <p style="color:var(--text2)">BioOrbit is developed by <b>LIASTRA Institute</b> and <b>ICBS – International Center for Biomedical &amp; Space Sciences</b> (São Gonçalo, Brazil) for the <b>NASA Space Apps Challenge 2026</b>, challenge “Create Health Monitoring Software for Astronauts on Space Missions”.</p>
          <a class="btn sec sm" href="index.html" target="_top" style="margin-top:14px">Visit the project website →</a></div>
        <div class="about-logos">
          <span class="pt-label">A project by</span>
          <div class="row" style="gap:22px"><img src="assets/img/liastra-logo.png" alt="LIASTRA Institute"><img src="assets/img/icbs-logo.webp" alt="ICBS"></div>
          <span class="pt-label">Competing in</span>
          <img src="assets/img/space-apps-logo.png" alt="NASA Space Apps Challenge" style="height:56px;width:auto">
        </div>
      </div>
      <div class="section-title"><h3>Sources & references</h3><span class="line"></span></div>
      <div class="card"><ol class="refs">${A.REFERENCES.map(r => `<li><a href="${r.u}" target="_blank" rel="noopener">${esc(r.t)}</a></li>`).join('')}</ol>
      <p class="small" style="margin-top:14px">Reference ranges are educational and simplified for decision support. BioOrbit does not replace evaluation by a physician or flight surgeon.</p></div>`;
  }

  /* =========================== ACHIEVEMENTS =========================== */
  function renderAchievements() {
    const el = $('#view-achievements'), crew = S.active();
    const g = E.game(crew);
    const today = A.dayStart(Date.now());
    const cal = [];
    for (let i = 29; i >= 0; i--) {
      const d = today - i * A.DAY;
      const recs = E.recordsOfDay(crew, d);
      const n = A.ROUTINE.filter(t => E.taskDone(t, recs)).length;
      cal.push({ d, l: n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n < A.ROUTINE.length ? 3 : 4, n });
    }
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Gamification</div><h1>Mission achievements</h1>
      <p>Healthy routines are easier to keep when progress is visible. Earn XP for every routine task, keep your streak alive and unlock badges.</p></div></div>
      <div class="grid g-2">
        <div class="card level-card">
          <div class="level-badge"><div><small>LEVEL</small><b>${g.level}</b></div></div>
          <div style="flex:1;min-width:200px">
            <div class="eyebrow">Rank</div><h2>${esc(g.rankName)}</h2>
            <div class="row" style="margin:10px 0 6px;justify-content:space-between"><span class="small">${g.into} / ${g.per} XP to level ${g.level + 1}</span><b class="mono">${g.xp} XP</b></div>
            <div class="progress"><i style="width:${(g.into / g.per) * 100}%"></i></div>
          </div>
        </div>
        <div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start">
          <div><div class="eyebrow">Current streak</div><div class="streak">🔥 ${g.streak}<span class="small" style="font-size:14px">days</span></div><div class="small">Best: ${g.best} days · Perfect days: ${g.fullDays}</div></div>
          <div class="small" style="text-align:right">${crew.records.length} records<br>${g.earned.size}/${A.BADGES.length} badges</div></div>
          <div class="cal" style="margin-top:14px">${cal.map((c, i) => `<div data-l="${c.l}" class="${i === 29 ? 'today' : ''}" title="${new Date(c.d).toLocaleDateString()}: ${c.n}/${A.ROUTINE.length} tasks"></div>`).join('')}</div>
          <div class="small" style="margin-top:6px">Last 30 days · routine completion</div>
        </div>
      </div>
      <div class="section-title"><h3>Badges</h3><span class="line"></span></div>
      <div class="badges">${A.BADGES.map(b => `<div class="badge ${g.earned.has(b.id) ? 'got' : 'locked'}"><span class="b-ico">${b.icon}</span><div class="b-name">${esc(b.name)}</div><div class="b-desc">${esc(b.desc)}</div></div>`).join('')}</div>`;
  }

  /* =========================== MODALS =========================== */
  function envOptions() {
    return `<div class="env-grid">${Object.entries(A.ENVIRONMENTS).map(([k, e]) => `
      <button class="env-opt ${S.state.envKey === k ? 'on' : ''}" data-env="${k}"><span class="eo-ico">${ENV_ICON[k]}</span><b>${esc(e.name)}</b><small>${esc(e.sub)}</small>
      <small>☢ ${e.doseDay} mSv/day · ⇵ ${esc(e.gLabel.split(' (')[0])}</small><small>📡 ${esc(e.delayLabel)} · ${esc(e.autonomy.split(' — ')[0])} autonomy</small></button>`).join('')}</div>`;
  }
  function bindEnv(m) {
    $$('[data-env]', m).forEach(b => b.addEventListener('click', () => {
      S.state.envKey = b.dataset.env; S.save();
      $$('[data-env]', m).forEach(x => x.classList.toggle('on', x === b));
      refresh(); toast(`Environment: <b>${esc(S.env().name)}</b>`);
    }));
  }
  function openEnvModal() {
    const m = modal(`<div class="modal-head"><div><div class="eyebrow">Mission environment</div><h2>Where is the crew?</h2><p class="small" style="margin-top:4px">Radiation dose, gravity, communication delay and the escalation advice adapt to the environment.</p></div><button class="x-btn" data-close>✕</button></div>${envOptions()}`, true);
    bindEnv(m);
  }
  function openSettings() {
    const crew = S.active();
    const m = modal(`<div class="modal-head"><div><div class="eyebrow">Settings</div><h2>Mission & data</h2></div><button class="x-btn" data-close>✕</button></div>
      <h3 style="margin-bottom:10px">Environment</h3>${envOptions()}
      <h3 style="margin:22px 0 10px">Crew member profile</h3>
      <div class="grid g-2" style="gap:10px">
        <label class="small">Name<input class="input" id="setName" value="${esc(crew.name)}" maxlength="30"></label>
        <label class="small">Pre-flight body mass (kg)<input class="input" id="setWeight" type="number" step="0.1" value="${crew.baseline.weight || ''}"></label>
        <label class="small">Prior career radiation dose (mSv)<input class="input" id="setDose" type="number" step="1" value="${crew.priorDose || 0}"></label>
        <label class="small">Role<input class="input" id="setRole" value="${esc(crew.role)}" maxlength="30"></label>
      </div>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="setSave">Save profile</button></div>
      <h3 style="margin:22px 0 10px">Data (stored only on this device)</h3>
      <div class="row">
        <button class="btn sec sm" id="setExport">⬇ Export backup</button>
        <label class="btn sec sm" style="cursor:pointer">⬆ Import backup<input type="file" id="setImport" accept="application/json" hidden></label>
        <button class="btn sec sm" id="setDemo">↺ Reload demo mission</button>
        <button class="btn danger sm" id="setBlank">Start empty mission</button>
      </div>
      <p class="small" style="margin-top:18px">BioOrbit is a decision-support prototype built for the NASA Space Apps Challenge 2026 by the ICBS / LIASTRA team. It is not a medical device. Source code written with AI assistance (Claude, Anthropic) — see README.</p>`, true);
    bindEnv(m);
    $('#setSave').onclick = () => {
      crew.name = $('#setName').value.trim() || crew.name; crew.role = $('#setRole').value.trim() || crew.role;
      const w = parseFloat($('#setWeight').value); if (w > 20 && w < 300) crew.baseline.weight = w;
      const d = parseFloat($('#setDose').value); if (d >= 0 && d < 2000) crew.priorDose = d;
      S.save(); refresh(); toast('Profile saved');
    };
    $('#setExport').onclick = () => download(`bioorbit-backup-${new Date().toISOString().slice(0, 10)}.json`, S.exportAll(), 'application/json');
    $('#setImport').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { S.importAll(r.result); closeModal(); selRegion = null; refresh(); toast('Backup imported'); } catch (err) { toast('⚠ ' + esc(err.message)); } };
      r.readAsText(f);
    };
    $('#setDemo').onclick = () => { if (confirm('Replace all data with the 30-day demo mission?')) { S.reset(); closeModal(); selRegion = null; refresh(); toast('Demo mission loaded'); } };
    $('#setBlank').onclick = () => { if (confirm('Delete all records and start an empty mission on this device?')) { S.blank(); closeModal(); selRegion = null; refresh(); toast('Empty mission started — day 1'); } };
  }

  function openBreathing() {
    const m = modal(`<div class="modal-head"><div><div class="eyebrow">Behavioural health</div><h2>Box breathing</h2><p class="small" style="margin-top:4px">4 seconds in · 4 hold · 4 out · 4 hold. Used by astronauts and pilots to lower stress.</p></div><button class="x-btn" data-close>✕</button></div>
      <div class="breath" id="breath">Ready</div>
      <div class="row" style="justify-content:center"><button class="btn" id="breathGo">Start 1-minute session</button></div>`);
    $('#breathGo', m).onclick = () => {
      $('#breathGo').disabled = true;
      const phases = [['Inhale', 1.35], ['Hold', 1.35], ['Exhale', 0.85], ['Hold', 0.85]];
      let i = 0;
      const step = () => {
        const b = $('#breath'); if (!b) return;
        if (i >= 16) { b.textContent = 'Well done ✓'; b.style.transform = 'scale(1)'; toast('🫁 Breathing session complete'); return; }
        const [txt, sc] = phases[i % 4];
        b.textContent = txt; b.style.transform = `scale(${sc})`;
        i++; A._breathTimer = setTimeout(step, 4000);
      };
      step();
    };
  }

  function welcome() {
    let seen = false;
    try { seen = localStorage.getItem('bioorbit-welcomed') === '1'; } catch (e) { /* ignore */ }
    if (seen || new URLSearchParams(location.search).has('embed')) return;
    modal(`<div class="welcome-hero">
        
        <img src="assets/img/bioorbit-logo.webp" alt="BioOrbit" class="welcome-logo"><div class="eyebrow">Welcome aboard</div><h1>Your health co-pilot in orbit</h1>
        <p style="color:var(--text2);margin-top:6px">BioOrbit supports astronauts on long-duration missions. It works fully offline, explains every measurement, and tells you what to do — even when Earth is 20 light-minutes away.</p>
      </div>
      <div class="feat">
        <div><b>🧍 Interactive body map</b>Colour-coded status for each body system.</div>
        <div><b>📈 Personal baselines</b>Detects drift before values leave the normal range.</div>
        <div><b>📷 Camera pulse</b>Heart rate from a fingertip, no extra hardware.</div>
        <div><b>⏱ Reaction test</b>Fatigue screening used on the ISS (PVT).</div>
        <div><b>📡 Delay-aware downlink</b>Structured reports for the flight surgeon.</div>
        <div><b>🏅 Gamified routine</b>XP, streaks and badges keep habits on track.</div>
      </div>
      <p class="small">You are viewing a <b>simulated 30-day mission</b> with a 4-person crew so every feature has data. Log your own values anytime, or start an empty mission in Settings.</p>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn lg" data-close id="welcomeGo">Begin mission ▸</button></div>
      <div class="partner-band"><span class="small">A project by</span><img src="assets/img/liastra-logo.png" alt="LIASTRA Institute"><img src="assets/img/icbs-logo.webp" alt="ICBS"><span class="sep"></span><span class="small">Competing in</span><img src="assets/img/space-apps-logo.png" alt="NASA Space Apps Challenge"></div>`, true);
    $('#welcomeGo').addEventListener('click', () => { try { localStorage.setItem('bioorbit-welcomed', '1'); } catch (e) { /* ignore */ } });
  }

  /* =========================== BOOT =========================== */
  renderTop(); tickMET(); route(); welcome();
  setInterval(() => { if (current === 'bridge' && $('#modalBack').hidden) updatePrompt(); }, 60000);
  A.app = { refresh, go };
})(window.AURORA);
