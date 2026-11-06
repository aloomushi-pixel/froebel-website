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
  initCookieConsentBanner();
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

/* === COOKIE & UX TELEMETRY CONSENT BANNER === */
function initCookieConsentBanner() {
  const STORAGE_KEY = 'froebel_cookie_consent_v2_1';
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === 'accepted') {
      return;
    }
  } catch (_) {}

  if (document.getElementById('froebel-cookie-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'froebel-cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Aviso de Cookies y Telemetría de Calidad UX');
  banner.style.cssText = [
    "position: fixed",
    "bottom: 12px",
    "left: 12px",
    "right: 82px",
    "max-width: 440px",
    "z-index: 9998",
    "background: rgba(15, 23, 42, 0.94)",
    "backdrop-filter: blur(12px)",
    "-webkit-backdrop-filter: blur(12px)",
    "color: #f8fafc",
    "border: 1px solid rgba(59, 130, 246, 0.45)",
    "border-radius: 14px",
    "box-shadow: 0 12px 30px rgba(15, 23, 42, 0.3)",
    "padding: 10px 14px",
    "font-family: var(--font-body, Inter, system-ui, sans-serif)",
    "font-size: 12px",
    "line-height: 1.35",
    "display: flex",
    "align-items: center",
    "justify-content: space-between",
    "gap: 10px",
    "transition: opacity 0.25s ease, transform 0.25s ease"
  ].join(";");
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
      element_id: isSearchBot || isAiBot ? `bot:${deviceType}` : 'document',
      element_text: document.title,
    });
  }, 600);

  // Skip section_view IntersectionObserver for headless search/AI bots (their 7000px tall viewport triggers all sections at scroll 0)
  if (isSearchBot || isAiBot) {
    return;
  }

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
        // Avoid duplicate cta_click events for <summary> (tracked via initFaqAccordions toggle)
        // and #froebel-cookie-accept-btn (tracked via initCookieConsentBanner)
        if (
          interactive.tagName.toLowerCase() === 'summary' ||
          interactive.id === 'froebel-cookie-accept-btn'
        ) {
          return;
        }
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
