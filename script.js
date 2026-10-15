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

  /* ---------- The brand mark is the asset-readiness meter ---------- */
  const preloader = $('#preloader');
  const startHero = () => {
    document.body.classList.add('hero-in');
    requestAnimationFrame(revealHero);
  };
  if (preloader && document.documentElement.classList.contains('has-brand-intro')) {
    const progress = $('#brandProgress');
    const value = $('#brandProgressValue');
    const firstImage = $('.hero__slide.is-active img');
    const logoImage = $('.brand-intro__fill img');
    const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const imageReady = (image) => image && image.decode ? image.decode() : Promise.resolve();
    const assets = [imageReady(firstImage), imageReady(logoImage), document.fonts ? document.fonts.ready : Promise.resolve()].map((asset) => Promise.resolve(asset).catch(() => undefined));
    let completed = 0;
    let finished = false;
    const skipIntro = (event) => { if (event.key === 'Escape') finish(); };
    const finish = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', skipIntro);
      document.documentElement.classList.remove('has-brand-intro');
      preloader.setAttribute('aria-hidden', 'true');
      startHero();
      setTimeout(() => preloader.remove(), 550);
    };
    const track = (asset) => Promise.resolve(asset).catch(() => undefined).then(() => {
      if (finished) return;
      completed += 1;
      const percent = Math.round(completed / assets.length * 100);
      progress.style.setProperty('--load-progress', percent + '%');
      progress.setAttribute('aria-valuenow', String(percent));
      value.textContent = percent + '%';
    });
    requestAnimationFrame(() => {
      const ready = Promise.all(assets.map(track));
      Promise.all([delay(650), Promise.race([ready, delay(2200)])]).then(finish);
    });
    document.addEventListener('keydown', skipIntro);
  } else {
    if (preloader) preloader.remove();
    startHero();
  }

  /* ---------- Slow cinematic dissolves, with playback control ---------- */
  const slides = $$('.hero__slide');
  const heroBars = $$('.hero__bar');
  const hero = $('.hero');
  const pauseControl = $('#heroPause');
  if (slides.length > 1 && hero) {
    let idx = 0;
    let timer = null;
    let paused = reduce;
    let switching = false;
    const DURATION = 9000;
    hero.style.setProperty('--slide-duration', DURATION + 'ms');
    const stop = () => { clearTimeout(timer); timer = null; };
    const schedule = () => {
      stop();
      if (!paused && !document.hidden) timer = setTimeout(() => show(idx + 1), DURATION);
    };
    const show = async (next) => {
      if (switching) return;
      const target = (next + slides.length) % slides.length;
      if (target === idx) { schedule(); return; }
      switching = true;
      const img = $('img', slides[target]);
      try { if (img && img.decode) await img.decode(); } catch { /* keep graceful fallback */ }
      slides[idx].classList.remove('is-active');
      heroBars[idx].classList.remove('is-active');
      heroBars[idx].setAttribute('aria-pressed', 'false');
      idx = target;
      slides[idx].classList.add('is-active');
      heroBars[idx].classList.add('is-active');
      heroBars[idx].setAttribute('aria-pressed', 'true');
      switching = false;
      schedule();
    };
    const syncPause = () => {
      hero.classList.toggle('hero--paused', paused || document.hidden);
      if (pauseControl) {
        pauseControl.textContent = paused ? 'Play' : 'Pause';
        pauseControl.setAttribute('aria-label', paused ? 'Play studio slideshow' : 'Pause studio slideshow');
        pauseControl.setAttribute('aria-pressed', String(paused));
      }
      schedule();
    };
    heroBars.forEach((bar, index) => {
      bar.setAttribute('aria-pressed', String(index === idx));
      bar.addEventListener('click', () => { stop(); show(index); });
    });
    if (pauseControl) { pauseControl.hidden = false; pauseControl.addEventListener('click', () => { paused = !paused; syncPause(); }); }
    document.addEventListener('visibilitychange', syncPause);
    syncPause();
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
      link.setAttribute('aria-selected', String(active));
      link.tabIndex = active ? 0 : -1;
    });
  };
  planGroups.forEach((group) => {
    const cards = $$('.plan', group);
    const picker = $('.plan-picker', group);
    const buttons = $$('.visit-option', group);
    const compare = $('.compare-plans', group);
    const requestedPlan = new URLSearchParams(location.search).get('plan');
    const requestedIndex = cards.findIndex((card) => $('[data-plan]', card).dataset.plan === requestedPlan);
    const featuredIndex = buttons.findIndex((button) => button.classList.contains('visit-option--featured'));
    let selected = requestedIndex >= 0 ? requestedIndex : Math.max(0, featuredIndex);
    let comparing = false;
    if (!picker || !compare || cards.length !== buttons.length) return;
    const render = (announce) => {
      group.classList.toggle('is-comparing', comparing);
      cards.forEach((card, index) => { card.hidden = !comparing && index !== selected; });
      buttons.forEach((button, index) => {
        button.setAttribute('aria-checked', String(index === selected));
        button.tabIndex = index === selected ? 0 : -1;
      });
      compare.setAttribute('aria-expanded', String(comparing));
      compare.innerHTML = comparing ? 'Back to my selection <span aria-hidden="true">↙</span>' : 'Compare prices & benefits <span aria-hidden="true">↗</span>';
      if (announce && selectionStatus) selectionStatus.textContent =
        $('h3', cards[selected]).textContent + ', ' + $('.plan__amount', cards[selected]).textContent.trim() +
        ', ' + $('.plan__rate', cards[selected]).textContent.trim();
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => { selected = index; comparing = false; render(true); });
      button.addEventListener('keydown', (event) => {
        const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!delta && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length;
        selected = next; comparing = false; render(true); buttons[next].focus();
      });
    });
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
    planLinks.forEach((link, index) => link.addEventListener('keydown', (event) => {
      const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!delta && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? planLinks.length - 1 : (index + delta + planLinks.length) % planLinks.length;
      selectCategory(planLinks[next].hash.slice(1));
      history.replaceState(null, '', planLinks[next].hash);
      planLinks[next].focus();
    }));
    window.addEventListener('hashchange', () => selectCategory(location.hash.slice(1)));
    // Links below the chooser can reveal the other category before scrolling.
    $$('a[href="#packages"], a[href="#monthly"]').forEach((link) => {
      if (link.closest('.plan-switch')) return;
      link.addEventListener('click', () => selectCategory(link.hash.slice(1)));
    });
  }

  /* ---------- Netlify-managed enquiries ---------- */
  const booking = $('#bookingForm');
  if (booking) {
    if (config.enquiryMode === 'netlify') {
      $('button[type="submit"] span', booking).textContent = 'Send Enquiry';
      $('#formNote').textContent = 'Your enquiry is sent to the studio via Netlify Forms. Please do not include medical or payment details. This does not confirm a booking.';
    }
    const key = new URLSearchParams(location.search).get('plan');
    const planNames = { solo: 'Solo Session', three: '3-visit package', five: '5-visit package', ten: '10-visit package', fifty: '50-visit package · 90 days · AED 4,750 + VAT',
      'month-four': '4 Visits / Month', 'month-eight': '8 Visits / Month',
      'month-twelve': '12 Visits / Month', 'month-twenty': '20 Visits / Month' };
    if (planNames[key]) {
      $('#requestedPlan').value = planNames[key];
      $('#selectedPlan').textContent = 'Your selected plan: ' + planNames[key];
      $('#selectedPlan').hidden = false;
      $('#interest').value = key.startsWith('month-') ? 'Membership' : 'Class package';
    }
  }
  if (booking) booking.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!booking.reportValidity() || booking.dataset.submitting === 'true') return;
    const note = $('#formNote');
    if (config.enquiryMode !== 'netlify') {
      const data = new FormData(booking);
      const body = ['Name: ' + data.get('name'), 'Email: ' + data.get('email'),
        'Phone: ' + data.get('phone'), 'Plan: ' + (data.get('requested-plan') || ''),
        'Interest: ' + data.get('interest'), '', data.get('message') || ''].join('\n');
      location.href = 'mailto:contact@qveewellness.com?subject=' +
        encodeURIComponent('QVee Wellness enquiry') + '&body=' + encodeURIComponent(body);
      note.textContent = 'Your email app will open with a draft. Send it to submit your enquiry. If it does not open, email contact@qveewellness.com directly. This does not reserve a class.';
      return;
    }
    const submit = $('button[type="submit"]', booking);
    const payload = new URLSearchParams(new FormData(booking));
    if (payload.get('company-website')) return;
    booking.dataset.submitting = 'true';
    submit.disabled = true;
    note.textContent = 'Sending your enquiry…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/thank-you.html', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(), signal: controller.signal
      });
      if (!response.ok) throw new Error('Enquiry service unavailable');
      note.textContent = 'Thank you. Your enquiry has been submitted. Our team will be in touch. This is not a confirmed class booking.';
      booking.reset();
    } catch {
      note.textContent = 'We could not submit your enquiry. Your details are still here. Please try again or email contact@qveewellness.com directly.';
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
      delete booking.dataset.submitting;
    }
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
