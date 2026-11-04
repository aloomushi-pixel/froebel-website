/* ============================================
   INSTITUTO FEDERICO FROEBEL — Main JavaScript
   + Autonomous UX, CWV, SEO & Parent Intent Telemetry Engine v2.1
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initScrollAnimations();
  initSmoothScroll();
  initFaqAccordions();
  initFroebelUXTelemetry();
});

/* === HEADER SCROLL EFFECT === */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    },
    { passive: true }
  );
}

/* === MOBILE NAV === */
function initMobileNav() {
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('header__nav--open');
    toggle.classList.toggle('header__toggle--active');

    const spans = toggle.querySelectorAll('span');
    if (toggle.classList.contains('header__toggle--active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  nav.querySelectorAll('.header__link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('header__nav--open');
      toggle.classList.remove('header__toggle--active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

/* === SCROLL ANIMATIONS (Intersection Observer) === */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* === SMOOTH SCROLL === */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

/* === FAQ ACCORDIONS ENHANCEMENT === */
function initFaqAccordions() {
  document.querySelectorAll('details.faq-item, details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (detail.open && window.FroebelUX) {
        const summary = detail.querySelector('summary');
        const label = summary ? summary.textContent.trim().slice(0, 80) : 'faq-item';
        window.FroebelUX.track('cta_click', {
          element_id: detail.id || 'faq-toggle',
          element_text: label,
        });
      }
    });
  });
}

/* ============================================================================
   AUTONOMOUS UX, CWV, SEO & PARENT INTENT TELEMETRY MONITOR
   Isolated Supabase Table: public.experiencia_de_usuario_froebel
   ============================================================================ */
function initFroebelUXTelemetry() {
  const SUPABASE_RPC_URL =
    'https://pghqeoijbtzipzziezmn.supabase.co/rest/v1/rpc/registrar_evento_ux_froebel';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnaHFlb2lqYnR6aXB6emllem1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTY1MzAsImV4cCI6MjA5MDIzMjUzMH0.e7YfCBC9diL1KDaKz52EBPfEUa8R2iahXpXF0xctsNg';

  // Normalize current pathname to match public.experiencia_de_usuario_froebel.slug
  function resolveCanonicalSlug() {
    let p = window.location.pathname || '/';
    p = p.replace(/\/index\.html$/i, '').replace(/\.html$/i, '');
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p || '/';
  }

  const pageSlug = resolveCanonicalSlug();

  // Visitor & Session IDs
  function getOrSetId(storage, key, prefix) {
    try {
      let id = storage.getItem(key);
      if (!id) {
        id =
          prefix +
          '_' +
          Math.random().toString(36).substring(2, 10) +
          '_' +
          Date.now().toString(36);
        storage.setItem(key, id);
      }
      return id;
    } catch (_) {
      return prefix + '_' + Math.random().toString(36).substring(2, 10);
    }
  }

  const visitorId = getOrSetId(window.localStorage, 'froebel_vid', 'v');
  const sessionId = getOrSetId(window.sessionStorage, 'froebel_sid', 's');

  // Device & Bot detection
  const ua = navigator.userAgent || '';
  const isAiBot =
    /GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Anthropic|Google-Extended|Applebot-Extended|CCBot|Bytespider/i.test(
      ua
    );
  const isSearchBot = /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(ua);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
  const deviceType = isAiBot
    ? 'ai_agent'
    : isSearchBot
    ? 'search_bot'
    : isMobile
    ? 'mobile'
    : 'desktop';

  // Infer Parent Intent Profile from URL + interactions
  function inferParentProfile(extraHint) {
    const context = (pageSlug + ' ' + (extraHint || '') + ' ' + document.referrer).toLowerCase();
    if (
      context.includes('maternal') ||
      context.includes('esfinteres') ||
      context.includes('1-a-3') ||
      context.includes('estimulacion')
    ) {
      return 'maternal_1_a_3';
    }
    if (
      context.includes('horario-extendido') ||
      context.includes('aicm') ||
      context.includes('comedor') ||
      context.includes('colegio-cerca-de-mi') ||
      context.includes('aragon') ||
      context.includes('oceania') ||
      context.includes('eduardo-molina')
    ) {
      return 'padres_trabajadores_aicm';
    }
    if (
      context.includes('inscripciones') ||
      context.includes('costos') ||
      context.includes('colegiatura') ||
      context.includes('pronto_pago')
    ) {
      return 'comparador_costos';
    }
    return 'preescolar_3_a_6';
  }

  // Real-Time On-Page SEO / GEO Health Audit (0 - 100)
  function computeOnPageSeoScore() {
    let score = 0;
    const title = document.title || '';
    const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const h1Count = document.querySelectorAll('h1').length;
    const h2Count = document.querySelectorAll('h2').length;
    const schemas = document.querySelectorAll('script[type="application/ld+json"]');
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithAlt = images.filter((img) => (img.getAttribute('alt') || '').trim().length > 0);

    if (title.length >= 25 && title.length <= 75) score += 20;
    else if (title.length > 10) score += 12;

    if (desc.length >= 90 && desc.length <= 175) score += 20;
    else if (desc.length > 40) score += 12;

    if (canonical && canonical.startsWith('https://froebelinstituto.com.mx')) score += 15;
    if (h1Count === 1) score += 15;
    if (h2Count >= 2) score += 10;
    if (schemas.length >= 1) score += 10;
    if (images.length === 0 || imagesWithAlt.length / images.length >= 0.85) score += 10;

    return Math.min(100, score);
  }

  // Core Web Vitals state
  const cwv = {
    lcp: null,
    cls: 0,
    inp: null,
    fcp: null,
    ttfb: null,
  };

  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries[0]) {
      cwv.ttfb = Math.round(navEntries[0].responseStart);
    }

    if ('PerformanceObserver' in window) {
      try {
        const lcpObs = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const last = entries[entries.length - 1];
          if (last) cwv.lcp = Math.round(last.startTime);
        });
        lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}

      try {
        const fcpObs = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              cwv.fcp = Math.round(entry.startTime);
            }
          }
        });
        fcpObs.observe({ type: 'paint', buffered: true });
      } catch (_) {}

      try {
        const clsObs = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cwv.cls = Number((cwv.cls + entry.value).toFixed(4));
            }
          }
        });
        clsObs.observe({ type: 'layout-shift', buffered: true });
      } catch (_) {}

      try {
        const inpObs = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.duration && (!cwv.inp || entry.duration > cwv.inp)) {
              cwv.inp = Math.round(entry.duration);
            }
          }
        });
        inpObs.observe({ type: 'event', buffered: true });
      } catch (_) {}
    }
  } catch (_) {}

  // Scroll & Active Time tracking
  let maxScrollPct = 0;
  const scrollMilestones = new Set();
  let activeStartTs = Date.now();
  let accumulatedActiveMs = 0;

  window.addEventListener(
    'scroll',
    () => {
      const docHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      if (pct > maxScrollPct) maxScrollPct = pct;

      [25, 50, 75, 100].forEach((milestone) => {
        if (pct >= milestone && !scrollMilestones.has(milestone)) {
          scrollMilestones.add(milestone);
          sendTelemetry('scroll_depth', {
            scroll_pct: milestone,
            element_id: `scroll_${milestone}`,
          });
        }
      });
    },
    { passive: true }
  );

  // Transmit event to Supabase RPC
  function sendTelemetry(eventType, extra = {}, keepalive = false) {
    const activeNow =
      document.visibilityState === 'visible'
        ? accumulatedActiveMs + (Date.now() - activeStartTs)
        : accumulatedActiveMs;

    const profileCode = extra.parent_profile || inferParentProfile(extra.element_text || '');
    const activeSec = Math.round(Math.min(activeNow, 600000) / 1000);
    const seoScoreVal = computeOnPageSeoScore();

    const payload = {
      p_slug: pageSlug,
      p_payload: {
        session_id: sessionId,
        visitor_id: visitorId,
        path: window.location.pathname || '/',
        event_type: eventType,
        element_id: extra.element_id || 'page',
        label: extra.element_text ? String(extra.element_text).slice(0, 120) : (extra.element_id || eventType),
        element_text: extra.element_text ? String(extra.element_text).slice(0, 120) : null,
        section: extra.section_id || 'page',
        section_id: extra.section_id || null,
        scroll_pct: extra.scroll_pct !== undefined ? extra.scroll_pct : maxScrollPct,
        active_ms: Math.min(activeNow, 600000),
        active_sec: activeSec,
        device: deviceType,
        device_type: deviceType,
        source: document.referrer || 'direct',
        user_agent: ua.slice(0, 220),
        parent_profile: {
          perfil: profileCode,
          dispositivo: deviceType,
          fuente: document.referrer || 'direct',
        },
        session_summary: {
          visitor_id: visitorId,
          pagina: pageSlug,
          dispositivo: deviceType,
          scroll_max_pct: maxScrollPct,
          tiempo_activo_s: activeSec,
          seo_score: seoScoreVal,
          cwv_lcp_ms: cwv.lcp,
          cwv_cls: cwv.cls,
          cwv_inp_ms: cwv.inp,
        },
        seo_score: seoScoreVal,
        cwv: {
          lcp: cwv.lcp,
          cls: cwv.cls,
          inp: cwv.inp,
          fcp: cwv.fcp,
          ttfb: cwv.ttfb,
        },
        meta: {
          url: window.location.href,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          is_ai_bot: isAiBot,
          ...(extra.meta || {}),
        },
      },
    };

    try {
      fetch(SUPABASE_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
        keepalive: Boolean(keepalive),
      }).catch(() => {});
    } catch (_) {}
  }

  // Expose global tracker for Wizard & custom forms
  window.FroebelUX = {
    track: (eventType, extra) => sendTelemetry(eventType, extra, true),
    getSlug: () => pageSlug,
  };

  // 1. Emit initial page_view after brief settle so FCP/TTFB are populated
  setTimeout(() => {
    sendTelemetry('page_view', {
      element_id: 'document',
      element_text: document.title,
    });
  }, 600);

  // 2. Section Visibility Monitor (IntersectionObserver on key sections & cards)
  const seenSections = new Set();
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const secId =
            el.id ||
            el.getAttribute('data-ux-section') ||
            el.querySelector('h1, h2, h3')?.textContent?.trim()?.slice(0, 45) ||
            el.className.split(' ')[0] ||
            'section';
          if (!seenSections.has(secId)) {
            seenSections.add(secId);
            sendTelemetry('section_view', {
              section_id: secId,
              element_id: secId,
              element_text: el.querySelector('h1, h2, h3')?.textContent?.trim()?.slice(0, 80) || secId,
            });
          }
        }
      });
    },
    { threshold: 0.35 }
  );

  document
    .querySelectorAll('section, .pricing-card, .program-card, .wizard, .blog-content')
    .forEach((sec) => sectionObserver.observe(sec));

  // 3. Click, CTA, WhatsApp, Phone, Rage Click & Dead Click Detector
  let recentClicks = [];

  document.addEventListener(
    'click',
    (e) => {
      const now = Date.now();
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      // Check for Rage Clicks (3+ clicks within 800ms inside 40px radius)
      recentClicks = recentClicks.filter((c) => now - c.t < 800);
      recentClicks.push({ t: now, x: e.clientX, y: e.clientY });
      if (recentClicks.length >= 3) {
        const first = recentClicks[0];
        const dist = Math.hypot(e.clientX - first.x, e.clientY - first.y);
        if (dist < 40) {
          recentClicks = [];
          const rageLabel =
            target.id ||
            target.closest('[id]')?.id ||
            target.textContent?.trim()?.slice(0, 50) ||
            target.tagName;
          sendTelemetry('rage_click', {
            element_id: `rage:${rageLabel}`,
            element_text: target.textContent?.trim()?.slice(0, 80) || target.tagName,
          });
        }
      }

      const interactive = target.closest('a, button, [role="button"], input[type="submit"], summary, .btn, .whatsapp-float');
      if (interactive) {
        const href = (interactive.getAttribute('href') || '').toLowerCase();
        const text = (
          interactive.getAttribute('aria-label') ||
          interactive.textContent ||
          interactive.getAttribute('title') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80);
        const elId =
          interactive.id ||
          interactive.getAttribute('data-ux-id') ||
          text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) ||
          interactive.tagName.toLowerCase();

        if (href.includes('wa.me') || href.includes('whatsapp') || interactive.classList.contains('whatsapp-float')) {
          sendTelemetry(
            'whatsapp_click',
            {
              element_id: `wa:${elId}`,
              element_text: text || 'WhatsApp CTA',
            },
            true
          );
        } else if (href.startsWith('tel:')) {
          sendTelemetry(
            'phone_click',
            {
              element_id: `tel:${elId}`,
              element_text: text || href,
            },
            true
          );
        } else {
          sendTelemetry(
            'cta_click',
            {
              element_id: `cta:${elId}`,
              element_text: text,
              meta: { href },
            },
            true
          );
        }
      } else {
        // Check Dead Click on visual card headers/badges that users might think are links
        const cardCandidate = target.closest('.card, .pricing-card, .feature-card, .testimonial-card, img');
        if (cardCandidate && !target.closest('form, input, select, textarea, label')) {
          const deadLabel =
            cardCandidate.querySelector('h3, h4, strong')?.textContent?.trim()?.slice(0, 50) ||
            target.getAttribute('alt') ||
            cardCandidate.className;
          sendTelemetry('dead_click', {
            element_id: `dead:${deadLabel}`,
            element_text: deadLabel,
          });
        }
      }
    },
    { passive: true }
  );

  // 4. Form Engagement & Submission Tracking
  const startedForms = new WeakSet();
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('focusin', () => {
      if (!startedForms.has(form)) {
        startedForms.add(form);
        sendTelemetry('form_start', {
          element_id: form.id || 'form',
          element_text: 'Inicio de formulario',
        });
      }
    });

    form.addEventListener('submit', () => {
      sendTelemetry(
        'form_submit',
        {
          element_id: form.id || 'form',
          element_text: 'Envío de formulario',
        },
        true
      );
    });
  });

  // 5. Flush CWV & Active Time on visibilitychange / pagehide
  let flushedExit = false;
  function flushExitTelemetry() {
    if (flushedExit) return;
    flushedExit = true;
    sendTelemetry(
      'session_flush',
      {
        element_id: 'page_exit',
        scroll_pct: maxScrollPct,
      },
      true
    );
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      accumulatedActiveMs += Date.now() - activeStartTs;
      flushExitTelemetry();
    } else {
      activeStartTs = Date.now();
      flushedExit = false;
    }
  });

  window.addEventListener('pagehide', flushExitTelemetry);
}
