/* Capa de movimiento compartida: reveal escalonado, contadores, parallax, tilt, botones magnéticos, ondas, barra de progreso.
   Funciona con contenido dinámico (MutationObserver). Respeta prefers-reduced-motion. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ease = t => 1 - Math.pow(2, -10 * t); // easeOutExpo

  // ---- Elementos que entran al hacer scroll
  const REVEAL = '.section-head, .benefit-card, .style-card, .soat-card, .sim-panel, .showcase-text, .comp-vacio, .faq details, .cta-final .wrap > *,' +
    '.sh-head, .sh-tipo, .sh-why-grid > *, .sh-fin-card, .sh-cta, .moto-card, .sales-card, .sh-steps li, .sh-sec .table-card, .gallery > *, .animate-up';
  const LADOS = { '.showcase-text': 'mo-left', '.showcase-bike': 'mo-right', '.sh-fin-card': 'mo-zoom' };
  let cola = [], pendiente = false;
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => {
    const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    vis.forEach((e, i) => {
      const el = e.target; io.unobserve(el);
      el.style.setProperty('--mo-d', Math.min(i, 8) * 70 + 'ms');
      requestAnimationFrame(() => el.classList.add('mo-in'));
      setTimeout(() => el.classList.add('mo-done'), 1100 + Math.min(i, 8) * 70);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;

  function preparar(raiz) {
    if (!io) return;
    $$(REVEAL, raiz).forEach(el => {
      if (el.dataset.mo || el.hasAttribute('data-aos') || el.closest('.swiper')) return;
      el.dataset.mo = '1';
      el.classList.add('mo');
      for (const k in LADOS) if (el.matches(k)) el.classList.add(LADOS[k]);
      io.observe(el);
    });
    $$('.showcase-bike', raiz).forEach(el => { if (!el.dataset.mo) { el.dataset.mo = '1'; el.classList.add('mo', 'mo-right'); io.observe(el); } });
    $$('img', raiz).forEach(img => {
      if (img.dataset.moi || img.closest('.shop-logo, .nav-logo, .nav, .shop-nav, .sh-hero-bike, .showcase-bike')) return;
      img.dataset.moi = '1';
      if (img.complete && img.naturalWidth) return;
      img.classList.add('mo-img');
      const ok = () => img.classList.add('mo-loaded');
      img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true });
    });
    $$('[data-count], .sh-stats b, .fact b, .fact strong', raiz).forEach(contador);
    $$('.showcase-bike, .sh-hero-bike, .sh-ghost', raiz).forEach(el => { if (!el.dataset.par) el.dataset.par = el.classList.contains('sh-ghost') ? '-0.07' : '0.05'; });
    if (fino) {
      $$('.sh-hero-bike, .showcase-bike', raiz).forEach(el => { if (!el.dataset.tilt) { el.dataset.tilt = '1'; el.classList.add('mo-tilt'); } });
      $$('.btn-xl, .btn-primary, .wa-float', raiz).forEach(el => { if (!el.dataset.mag) { el.dataset.mag = '1'; el.classList.add('mo-mag'); } });
    }
  }

  // ---- Contadores (solo texto con un número; conserva prefijo/sufijo)
  const cont = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cont.unobserve(e.target); correr(e.target);
  }), { threshold: .6 }) : null;
  function contador(el) {
    if (!cont || el.dataset.cn || el.children.length) return;
    const m = el.textContent.trim().match(/^(\D*?)(\d[\d.,]*)(\D*)$/);
    if (!m) return;
    const sep = m[2].includes(',') ? ',' : m[2].includes('.') && /\.\d{3}$/.test(m[2]) ? '.' : '';
    const n = parseFloat(m[2].replace(/[.,]/g, ''));
    if (!isFinite(n) || n < 2 || n > 1e7) return;
    el.dataset.cn = JSON.stringify({ p: m[1], n, s: m[3], sep });
    el.textContent = m[1] + '0' + m[3];
    cont.observe(el);
  }
  function correr(el) {
    const { p, n, s, sep } = JSON.parse(el.dataset.cn); const t0 = performance.now(), dur = 1300;
    const fmt = v => { const t = String(Math.round(v)); return sep ? t.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : t; };
    const paso = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = p + fmt(n * ease(k)) + s; if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  }

  // ---- Scroll: progreso, parallax, barra que se oculta al bajar
  const barra = document.createElement('div'); barra.className = 'mo-progress'; barra.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.scroll-bar')) document.documentElement.appendChild(barra);
  let sy = 0, ultimo = 0, tick = false;
  function frame() {
    tick = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    if (!reduce) $$('[data-par]').forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
      el.style.setProperty('--mo-py', ((r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.par)).toFixed(1) + 'px');
    });
    const nav = document.querySelector('.landing-navbar, .shop-nav');
    if (nav) { const baja = scrollY > ultimo && scrollY > 320; nav.classList.toggle('mo-hide', baja && !nav.matches(':focus-within, .menu-abierto')); }
    ultimo = scrollY;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame, { passive: true });

  // ---- Puntero: tilt, brillo en tarjetas, botones magnéticos
  if (fino && !reduce) {
    document.addEventListener('pointermove', e => {
      const t = e.target.closest && e.target.closest('.mo-tilt');
      if (t) { const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        t.classList.add('mo-live'); t.style.setProperty('--mo-ry', (x * 9).toFixed(2) + 'deg'); t.style.setProperty('--mo-rx', (-y * 7).toFixed(2) + 'deg'); }
      const c = e.target.closest && e.target.closest('.moto-card, .benefit-card, .sales-card, .style-card, .sh-tipo');
      if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      const b = e.target.closest && e.target.closest('.mo-mag');
      if (b) { const r = b.getBoundingClientRect(); b.style.setProperty('--mo-mx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px'); b.style.setProperty('--mo-my', ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px'); }
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest && e.target.closest('.mo-tilt'); if (t && !t.contains(e.relatedTarget)) { t.classList.remove('mo-live'); t.style.setProperty('--mo-rx', '0deg'); t.style.setProperty('--mo-ry', '0deg'); }
      const b = e.target.closest && e.target.closest('.mo-mag'); if (b && !b.contains(e.relatedTarget)) { b.style.setProperty('--mo-mx', '0px'); b.style.setProperty('--mo-my', '0px'); }
    }, { passive: true });
  }

  // ---- Onda al pulsar botones
  if (!reduce) document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.btn, .sh-marca');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span');
    s.className = 'mo-ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  }, { passive: true });

  // ---- Contenido dinámico (cliente renderiza con innerHTML)
  let mp = false;
  new MutationObserver(() => { if (mp) return; mp = true; requestAnimationFrame(() => { mp = false; preparar(document); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
  const iniciar = () => { preparar(document); frame(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();