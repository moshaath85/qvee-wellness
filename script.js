/* =========================================================
   QVee Wellness — interactions
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero entrance ---------- */
  function revealHero() {
    const hero = $('.hero');
    if (hero) hero.classList.add('is-ready');
    const els = $$('[data-hero]');
    els.forEach((el, i) => {
      el.style.transition = 'opacity 1.1s cubic-bezier(.22,1,.36,1), transform 1.2s cubic-bezier(.22,1,.36,1)';
      el.style.transitionDelay = (0.25 + i * 0.14) + 's';
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
    });
  }

  /* ---------- Preloader (home only) ---------- */
  const preloader = $('#preloader');
  const bar = $('#preloaderBar');
  const count = $('#preloaderCount');

  if (preloader && bar && count) {
    document.body.classList.add('is-loading');
    let progress = 0;
    const tick = setInterval(() => {
      progress += Math.random() * 14 + 4;
      if (progress >= 100) { progress = 100; clearInterval(tick); finish(); }
      bar.style.width = progress + '%';
      count.textContent = String(Math.round(progress)).padStart(2, '0');
    }, 130);

    function finish() {
      count.textContent = '100';
      setTimeout(() => {
        preloader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('hero-in');
        revealHero();
        setTimeout(() => preloader.remove(), 1000);
      }, 450);
    }
  } else {
    document.body.classList.remove('is-loading');
    document.body.classList.add('hero-in');
    requestAnimationFrame(revealHero);
  }

  /* ---------- Hero cinematic slideshow ---------- */
  const slides = $$('.hero__slide');
  const heroBars = $$('.hero__bar');
  if (slides.length > 1) {
    let idx = 0;
    let timer = null;
    const DURATION = 5600;
    const show = (next) => {
      slides[idx].classList.remove('is-active');
      if (heroBars[idx]) heroBars[idx].classList.remove('is-active');
      idx = (next + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (heroBars[idx]) heroBars[idx].classList.add('is-active');
    };
    const start = () => { if (!reduce) timer = setInterval(() => show(idx + 1), DURATION); };
    start();
    heroBars.forEach((bar, i) => {
      bar.addEventListener('click', () => {
        if (timer) { clearInterval(timer); timer = null; }
        show(i);
        start();
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');
  if (lightbox && lightboxImg) {
    const open = (src, alt) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('is-open');
      lightbox.removeAttribute('inert');
      document.body.classList.add('lightbox-open');
    };
    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('inert', '');
      document.body.classList.remove('lightbox-open');
    };
    $$('.gallery__item').forEach((item) => {
      const img = $('img', item);
      if (!img) return;
      item.addEventListener('click', () => open(img.currentSrc || img.src, img.alt));
    });
    lightboxClose.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------- Active navigation ---------- */
  (function activeNav() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav a, .menu__nav a').forEach((a) => {
      const href = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
      if (href && href === path) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ---------- Header state ---------- */
  const header = $('#header');
  const onScrollHeader = () => {
    if (window.scrollY > 80) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Scroll progress ---------- */
  const scrollBar = $('#scrollBar');
  const updateProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    scrollBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => cio.observe(el));

  /* ---------- Parallax ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (!reduce && parallaxEls.length) {
    let ticking = false;
    const applyParallax = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
    applyParallax();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $('#cursor');
  const label = $('.cursor__label', cursor);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && cursor) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.style.opacity = '1';
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    const bindHover = () => {
      $$('[data-cursor]').forEach((el) => {
        const type = el.getAttribute('data-cursor');
        el.addEventListener('mouseenter', () => {
          cursor.classList.remove('is-hover', 'is-view');
          if (type === 'view') { cursor.classList.add('is-view'); label.textContent = 'View'; }
          else cursor.classList.add('is-hover');
        });
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover', 'is-view'));
      });
      $$('a, button, input, textarea, select').forEach((el) => {
        if (el.hasAttribute('data-cursor')) return;
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
      });
    };
    bindHover();
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* ---------- Mobile menu ---------- */
  const menu = $('#menu');
  const toggle = $('#menuToggle');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    toggle.setAttribute('aria-expanded', String(open));
    const links = $$('.menu__nav a', menu);
    links.forEach((a, i) => { a.style.transitionDelay = (open ? 0.18 + i * 0.06 : 0) + 's'; });
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('.menu__nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Accordion ---------- */
  $$('.accordion__item').forEach((item) => {
    const head = $('.accordion__head', item);
    const body = $('.accordion__body', item);
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      $$('.accordion__item').forEach((other) => {
        other.classList.remove('is-open');
        $('.accordion__body', other).style.maxHeight = null;
        $('.accordion__head', other).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Forms ---------- */
  const booking = $('#bookingForm');
  if (booking) {
    booking.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#name').value.trim();
      const email = $('#email').value.trim();
      const note = $('#formNote');
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        note.style.color = 'var(--gold-lt)';
        note.textContent = 'Please share your name and a valid email so we can welcome you.';
        return;
      }
      note.style.color = 'var(--gold-lt)';
      note.textContent = 'Thank you, ' + name + '. Your enquiry has been received — we will be in touch very soon.';
      booking.reset();
    });
  }

  const news = $('#newsForm');
  if (news) {
    news.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('input', news);
      if (!input.value.trim()) return;
      input.value = '';
      input.placeholder = 'Thank you — welcome to The QVee Letter';
      setTimeout(() => { input.placeholder = 'Email address'; }, 3200);
    });
  }

  /* ---------- Anchors with header offset ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Click-to-load map (avoids third-party cookies on load) ---------- */
  const mapFacade = $('#mapFacade');
  const mapLoad = $('#mapLoad');
  if (mapFacade && mapLoad) {
    mapLoad.addEventListener('click', () => {
      const src = mapFacade.getAttribute('data-src');
      if (!src) return;
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.title = 'Map showing QVee Wellness at One Park Avenue Building, Sobha Hartland, Dubai';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      mapFacade.innerHTML = '';
      mapFacade.appendChild(frame);
    });
  }

  /* ---------- Service worker (offline cache → instant repeat visits) ---------- */
  const SW_SOURCE = (document.currentScript && document.currentScript.src) || '';
  (function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const secure = location.protocol === 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (!secure) return;

    window.addEventListener('load', () => {
      let swUrl = 'sw.js';
      try {
        swUrl = SW_SOURCE
          ? new URL('../../sw.js', SW_SOURCE).href
          : new URL('sw.js', location.href).href;
      } catch (e) {
        swUrl = new URL('/sw.js', location.origin).href;
      }

      navigator.serviceWorker.register(swUrl, { scope: '/' }).then((reg) => {
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      }).catch(() => {});
    });
  })();

  /* ---------- Back to top ---------- */
  const backTop = $('#backTop');
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Scroll-driven global ---------- */
  window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
  updateProgress();
})();
