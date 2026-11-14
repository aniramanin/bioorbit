/* BioOrbit — project website interactions
   SI disclosure: written with the assistance of an AI coding assistant (Claude, Anthropic). */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];

  /* nav: translucent after scroll + mobile menu */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('#navBurger').addEventListener('click', () => nav.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  /* reveal on scroll */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* count-up stats */
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); cio.unobserve(el);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* statement: words light up as you scroll (Apple-style) */
  const words = $('.words');
  if (words) {
    const hl = ['twenty-two', 'minutes', 'no', 'way', 'home.', 'BioOrbit'];
    words.innerHTML = words.textContent.trim().split(/\s+/).map(w => `<span class="${hl.includes(w) ? 'hl' : ''}">${w}</span> `).join('');
    const spans = $$('span', words);
    const sec = $('#statement');
    const update = () => {
      const r = sec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height * 0.9)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  }

  /* device frames: render the real app at its native size and scale it to fit */
  function fit() {
    $$('.frame-wrap').forEach(w => {
      const fw = +w.dataset.w, fh = +w.dataset.h, f = $('iframe', w);
      const s = w.clientWidth / fw;
      w.style.height = (fh * s) + 'px';
      f.style.width = fw + 'px'; f.style.height = fh + 'px';
      f.style.transform = `scale(${s})`;
    });
  }
  const ro = new ResizeObserver(fit);
  $$('.frame-wrap').forEach(w => ro.observe(w));
  addEventListener('load', fit); fit();

  /* live demo: switch view (same-origin iframe hash) and device */
  let device = 'desktop', view = 'bridge';
  const frame = () => (device === 'desktop' ? $('#demoFrameD') : $('#demoFrameM'));
  const goView = () => {
    const f = frame();
    try { f.contentWindow.location.hash = view; } catch (e) { f.src = 'app.html?embed=1#' + view; }
  };
  $$('#demoTabs button').forEach(b => b.addEventListener('click', () => {
    view = b.dataset.view;
    $$('#demoTabs button').forEach(x => x.classList.toggle('on', x === b));
    goView();
  }));
  $$('#demoDevice button').forEach(b => b.addEventListener('click', () => {
    device = b.dataset.device;
    $$('#demoDevice button').forEach(x => x.classList.toggle('on', x === b));
    $('#demoDesktop').classList.toggle('hidden', device !== 'desktop');
    $('#demoMobile').classList.toggle('hidden', device !== 'mobile');
    requestAnimationFrame(() => { fit(); goView(); });
  }));
  // on small screens default the demo to the phone
  if (innerWidth < 760) $('#demoDevice button[data-device="mobile"]').click();
})();
