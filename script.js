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
    const normalisePage = (value) => {
      const path = new URL(value, location.href).pathname.replace(/\/$/, '') || '/';
      return path === '/index.html' || path === '/index' ? '/' : path.replace(/\.html$/, '');
    };
    const current = normalisePage(location.href);
    $$('.nav a, .menu__nav a, .mobile-nav a').forEach((link) => {
      if (normalisePage(link.href) === current) link.setAttribute('aria-current', 'page');
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
        e.target.classList.remove('is-pending');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => {
    if (!reduce && el.getBoundingClientRect().top > window.innerHeight) el.classList.add('is-pending');
    io.observe(el);
  });

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
  if (fine && cursor && !reduce) {
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
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) requestAnimationFrame(() => { const first = $('a', menu); if (first) first.focus(); });
    else toggle.focus();
    const links = $$('.menu__nav a', menu);
    links.forEach((a, i) => { a.style.transitionDelay = (open ? 0.18 + i * 0.06 : 0) + 's'; });
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('.menu__nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('is-open')) return;
    if (event.key === 'Escape') { setMenu(false); return; }
    if (event.key !== 'Tab') return;
    const focusable = [toggle, ...$$('a[href], button', menu)];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

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

  /* ---------- Plan enquiries / future Mindbody connection ---------- */
  const config = window.QVEE_BOOKING || {};
  const safeBookingUrl = (value) => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
    catch { return null; }
  };
  $$('[data-plan]').forEach((link) => {
    const url = safeBookingUrl(config.plans && config.plans[link.dataset.plan]);
    if (!url) return;
    link.href = url;
    $('span', link).textContent = 'Buy This Plan';
  });
  const scheduleUrl = safeBookingUrl(config.scheduleUrl);
  if (scheduleUrl) {
    $$('[data-booking-link]').forEach((link) => { link.href = scheduleUrl; });
    const status = $('.booking-status .body');
    if (status) status.textContent = 'Choose your class and complete your booking securely through Mindbody.';
    const action = $('.booking-status .btn');
    if (action) { action.href = scheduleUrl; $('span', action).textContent = 'View Class Schedule'; }
  }
  /* ---------- Progressive plan chooser ---------- */
  const planLinks = $$('.plan-switch a');
  const planGroups = $$('.plan-group');
  const selectionStatus = $('.plan-selection-status');
  const selectCategory = (id) => {
    if (!planGroups.some((group) => group.id === id)) return;
    planGroups.forEach((group) => { group.hidden = group.id !== id; });
    planLinks.forEach((link) => {
      const active = link.hash === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  planGroups.forEach((group) => {
    const cards = $$('.plan', group);
    const picker = $('.plan-picker', group);
    const buttons = $$('.visit-option', group);
    const compare = $('.compare-plans', group);
    const requestedPlan = new URLSearchParams(location.search).get('plan');
    const requestedIndex = cards.findIndex((card) => $('[data-plan]', card).dataset.plan === requestedPlan);
    let selected = requestedIndex >= 0 ? requestedIndex : 0;
    let comparing = false;
    if (!picker || !compare || cards.length !== buttons.length) return;
    const render = (announce) => {
      group.classList.toggle('is-comparing', comparing);
      cards.forEach((card, index) => { card.hidden = !comparing && index !== selected; });
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
      compare.setAttribute('aria-expanded', String(comparing));
      compare.innerHTML = comparing ? 'Back to my selection <span aria-hidden="true">↙</span>' : 'Compare prices & benefits <span aria-hidden="true">↗</span>';
      if (announce && selectionStatus) selectionStatus.textContent =
        $('h3', cards[selected]).textContent + ', ' + $('.plan__amount', cards[selected]).textContent.trim() +
        ', ' + $('.plan__rate', cards[selected]).textContent.trim();
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      selected = index; comparing = false; render(true);
    }));
    compare.addEventListener('click', () => { comparing = !comparing; render(false); });
    picker.hidden = false;
    group.classList.add('is-enhanced');
    render(false);
  });
  if (planLinks.length) {
    selectCategory(location.hash === '#monthly' ? 'monthly' : 'packages');
    planLinks.forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      selectCategory(link.hash.slice(1));
      history.replaceState(null, '', link.hash);
    }));
    window.addEventListener('hashchange', () => selectCategory(location.hash.slice(1)));
    // Links below the chooser can reveal the other category before scrolling.
    $$('a[href="#packages"], a[href="#monthly"]').forEach((link) => {
      if (link.closest('.plan-switch')) return;
      link.addEventListener('click', () => selectCategory(link.hash.slice(1)));
    });
  }

  /* ---------- Email enquiries: prepare a draft, never claim receipt ---------- */
  const booking = $('#bookingForm');
  if (booking) booking.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!booking.reportValidity()) return;
    const data = new FormData(booking);
    const body = ['Name: ' + data.get('name'), 'Email: ' + data.get('email'),
      'Phone: ' + data.get('phone'), 'Interest: ' + data.get('interest'),
      '', data.get('message') || ''].join('\n');
    location.href = 'mailto:contact@qveewellness.com?subject=' +
      encodeURIComponent('QVee Wellness enquiry') + '&body=' + encodeURIComponent(body);
    $('#formNote').textContent = 'Your email app will open with a draft. Send the email to submit your enquiry. If it does not open, email contact@qveewellness.com directly.';
  });

  /* ---------- Anchors with header offset ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const quickNav = $('.mobile-nav');
      const quickNavHeight = quickNav && getComputedStyle(quickNav).display !== 'none' ? quickNav.getBoundingClientRect().height : 0;
      const offset = (header ? header.getBoundingClientRect().height : 0) + quickNavHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
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
