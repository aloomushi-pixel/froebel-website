/* ============================================
   INSTITUTO FEDERICO FROEBEL — Main JavaScript
   + Autonomous UX, CWV, SEO & Parent Intent Telemetry Engine v2.1
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initFroebelUXTelemetry();

  const runDeferredEnhancements = () => {
    initScrollAnimations();
    initSmoothScroll();
    initFaqAccordions();
    initFacilityPhotoLightbox();
    initInteractiveComparisonTables();
    initInteractiveActionCards();
    initHyperlocalNeighborhoodCalculators();
    initInstantLinkPrefetch();
    initCookieConsentBanner();
    initMobileStickyConversionBar();
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(runDeferredEnhancements, { timeout: 350 });
  } else {
    setTimeout(runDeferredEnhancements, 0);
  }
});

/* === INSTANT SUBPAGE PREFETCH (iOS Safari & Browsers without Speculation Rules) === */
function initInstantLinkPrefetch() {
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) return;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
  } catch (_) {}

  const prefetched = new Set();
  const maybePrefetch = (ev) => {
    const target = ev.target;
    if (!target || !(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!anchor || prefetched.size >= 8) return;
    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
    let url;
    try {
      url = new URL(rawHref, window.location.origin);
    } catch (_) {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    if (/^\/(api|admin)/i.test(url.pathname)) return;
    const key = url.pathname + url.search;
    if (prefetched.has(key)) return;
    prefetched.add(key);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = key;
    link.as = 'document';
    document.head.appendChild(link);
  };

  document.addEventListener('pointerenter', maybePrefetch, { capture: true, passive: true });
  document.addEventListener('touchstart', maybePrefetch, { passive: true });
}

/* === INTERACTIVE PHOTO LIGHTBOX (Eliminates Mobile Photo Dead Clicks + Adds Conversion Bar) === */
function initFacilityPhotoLightbox() {
  const candidates = Array.from(document.querySelectorAll('main img, section img, article img')).filter((img) => {
    if (img.closest('a, button, header, footer')) return false;
    const src = img.getAttribute('src') || '';
    if (src.includes('logo-froebel')) return false;
    const wAttr = parseInt(img.getAttribute('width') || '0', 10);
    if (wAttr > 0 && wAttr < 120) return false;
    return true;
  });
  if (!candidates.length) return;

  candidates.forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    if (!img.getAttribute('data-ux-id')) {
      const cleanAlt = (img.getAttribute('alt') || 'foto-plantel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32);
      img.setAttribute('data-ux-id', `photo-zoom-${cleanAlt}`);
    }
    const openModal = () => openFroebelPhotoLightbox(img);
    img.addEventListener('click', openModal);
    img.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openModal();
      }
    });
  });
}

function openFroebelPhotoLightbox(imgEl) {
  let modal = document.getElementById('froebel-photo-lightbox');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'froebel-photo-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Vista ampliada de fotografía del plantel');
    modal.setAttribute('data-ux-ignore-dead', '1');
    modal.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity 0.2s ease;';
    modal.innerHTML = `
      <button type="button" id="froebel-lightbox-close" aria-label="Cerrar foto" style="position:absolute;top:1rem;right:1rem;width:42px;height:42px;border-radius:999px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.14);color:#ffffff;font-size:1.35rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      <img id="froebel-lightbox-img" role="button" tabindex="0" data-ux-id="lightbox-img-close" title="Toca para cerrar" alt="" style="max-width:96vw;max-height:68vh;object-fit:contain;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.5);cursor:zoom-out;" />
      <p id="froebel-lightbox-caption" style="color:#f8fafc;font-size:0.92rem;text-align:center;max-width:640px;margin:0.85rem 0 0.75rem;line-height:1.4;"></p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.6rem;">
        <a id="froebel-lightbox-wa" href="https://wa.me/525554148872?text=Hola%20Instituto%20Froebel%2C%20vi%20las%20fotos%20del%20plantel%20y%20quiero%20agendar%20un%20recorrido" target="_blank" rel="noopener noreferrer" style="padding:0.55rem 1.05rem;border-radius:999px;background:#16a34a;color:#ffffff;font-size:0.85rem;font-weight:700;text-decoration:none;">💬 Agendar Recorrido por WhatsApp</a>
        <a id="froebel-lightbox-enroll" href="/inscripciones?inscribir=1" style="padding:0.55rem 1.05rem;border-radius:999px;background:#ffffff;color:#1e3a8a;font-size:0.85rem;font-weight:700;text-decoration:none;">💰 Ver Costos ($3,600/mes) →</a>
      </div>
    `;
    document.body.appendChild(modal);
    const closeFn = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 180);
    };
    modal.addEventListener('click', (ev) => {
      if (
        ev.target === modal ||
        ev.target.id === 'froebel-lightbox-close' ||
        ev.target.id === 'froebel-lightbox-img'
      ) {
        closeFn();
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal.style.display === 'flex') closeFn();
    });
  }

  const modalImg = document.getElementById('froebel-lightbox-img');
  const modalCap = document.getElementById('froebel-lightbox-caption');
  const modalEnroll = document.getElementById('froebel-lightbox-enroll');
  modalImg.src = imgEl.currentSrc || imgEl.src;
  modalImg.alt = imgEl.alt || 'Instalaciones Instituto Federico Froebel';
  modalCap.textContent = imgEl.alt || 'Instalaciones seguras del Instituto Federico Froebel en San Juan de Aragón, GAM.';
  if (modalEnroll) {
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (savedRaw) {
        const draft = JSON.parse(savedRaw);
        if (draft && draft.totalMonthly) {
          const pParam = encodeURIComponent(draft.program || 'preescolar_1');
          const eParam = encodeURIComponent(draft.estancia || 'ninguna');
          modalEnroll.href = `/inscripciones?inscribir=1&programa=${pParam}&estancia=${eParam}`;
          modalEnroll.textContent = `💰 Apartar Cotización ($${Number(draft.totalMonthly).toLocaleString('es-MX')}/mes) →`;
        }
      }
    } catch (_) {}
  }
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
}

/* === INTERACTIVE COMPARISON TABLE ROWS (Eliminates Table Cell Dead Clicks) === */
function initInteractiveComparisonTables() {
  document.querySelectorAll('table[id^="tabla-"] tbody tr').forEach((row) => {
    const primaryLink =
      row.querySelector('a[href*="/inscripciones"]') ||
      row.querySelector('a[href*="/colegio-cerca-de-mi/"]') ||
      row.querySelector('a[href]');
    if (!primaryLink) return;
    row.style.cursor = 'pointer';
    row.setAttribute('role', 'button');
    if (!row.getAttribute('data-ux-id')) {
      const label = (row.cells[0]?.textContent || 'fila-tabla')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32);
      row.setAttribute('data-ux-id', `table-row-${label}`);
    }
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('a, button, input, select')) return;
      primaryLink.click();
    });
  });
}

/* === INTERACTIVE SINGLE-CTA ACTION CARDS (Eliminates Card Surface Dead Clicks) === */
function initInteractiveActionCards() {
  document.querySelectorAll('.card').forEach((card) => {
    const tag = card.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'details' || card.hasAttribute('role')) return;
    if (card.querySelector('input, select, textarea, button, form, table, details')) return;

    const allLinks = Array.from(card.querySelectorAll('a[href]'));
    if (!allLinks.length) return;

    let primaryLink = null;
    if (allLinks.length === 1) {
      primaryLink = allLinks[0];
    } else {
      const directLinks = Array.from(card.children).filter((el) => el.tagName && el.tagName.toLowerCase() === 'a' && el.hasAttribute('href'));
      if (directLinks.length === 1) {
        primaryLink = directLinks[0];
      }
    }
    if (!primaryLink) return;

    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    if (!card.getAttribute('data-ux-id')) {
      const titleTxt = (card.querySelector('h3, h4, strong')?.textContent || primaryLink.textContent || 'card')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 36);
      card.setAttribute('data-ux-id', `card-cta-${titleTxt}`);
    }

    card.addEventListener('click', (ev) => {
      if (ev.target.closest('a, button, input, select, textarea, summary, label')) return;
      const sel = window.getSelection ? window.getSelection().toString().trim() : '';
      if (sel.length > 0) return;
      primaryLink.click();
    });

    card.addEventListener('keydown', (ev) => {
      if (ev.target !== card) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        primaryLink.click();
      }
    });
  });
}

/* === HYPERLOCAL NEIGHBORHOOD TUITION + COMMUTE CALCULATOR === */
function initHyperlocalNeighborhoodCalculators() {
  const box = document.getElementById('cotizador-rapido-colonia');
  if (!box) return;

  const gradeSel = document.getElementById('colonia-calc-grado');
  const estSel = document.getElementById('colonia-calc-estancia');
  const totalOut = document.getElementById('colonia-calc-total');
  const detailOut = document.getElementById('colonia-calc-detalle');
  const enrollBtn = document.getElementById('colonia-calc-enroll-btn');
  const waBtn = document.getElementById('colonia-calc-wa-btn');
  if (!gradeSel || !estSel || !totalOut || !detailOut || !enrollBtn || !waBtn) return;

  const colonia = box.getAttribute('data-colonia') || 'Gustavo A. Madero';
  const minutos = box.getAttribute('data-minutos') || 'pocos minutos';
  const ubicacionTexto = box.getAttribute('data-ubicacion-texto') || `A ${minutos} desde ${colonia}`;
  const waOrigen = box.getAttribute('data-wa-origen') || `vivo cerca de ${colonia} (${minutos}) y`;

  const gradeMeta = {
    maternal: { label: 'Maternal Bilingüe (1–3 años)', baseHours: '08:30–13:30h' },
    preescolar_1: { label: 'Kínder 1 SEP (3–4 años)', baseHours: '08:30–14:00h' },
    preescolar_2: { label: 'Kínder 2 SEP (4–5 años)', baseHours: '08:30–14:00h' },
    preescolar_3: { label: 'Kínder 3 SEP (5–6 años)', baseHours: '08:30–14:00h' },
  };
  const estMeta = {
    ninguna: { extra: 0, label: 'Horario escolar base', hoursSuffix: 'recepción desde 07:30h' },
    parcial_16h: { extra: 1400, label: '+ Estancia 16:00h y Comedor', hoursSuffix: 'hasta 16:00h con Comedor 3 tiempos' },
    completa_18h: { extra: 1900, label: '+ Estancia Completa 18:00h y Comedor', hoursSuffix: 'hasta 18:00h con Comedor + Talleres' },
  };

  try {
    const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      if (saved && saved.program && gradeMeta[saved.program]) {
        gradeSel.value = saved.program;
      }
      if (saved && saved.estancia && estMeta[saved.estancia]) {
        estSel.value = saved.estancia;
      }
    }
  } catch (_) {
    // Ignore storage access errors in strict privacy modes
  }

  const renderCalc = (trackChange) => {
    const gKey = gradeSel.value || 'preescolar_1';
    const eKey = estSel.value || 'ninguna';
    const g = gradeMeta[gKey] || gradeMeta.preescolar_1;
    const e = estMeta[eKey] || estMeta.ninguna;
    const prontoTotal = 3600 + e.extra;
    const normalTotal = 4000 + e.extra;

    totalOut.textContent = `$${prontoTotal.toLocaleString('es-MX')} MXN/mes`;
    detailOut.textContent = `${g.label} (${eKey === 'ninguna' ? g.baseHours + ', ' + e.hoursSuffix : e.hoursSuffix}) · Pronto Pago (regular $${normalTotal.toLocaleString('es-MX')}) · ${ubicacionTexto}`;

    enrollBtn.href = `/inscripciones?inscribir=1&programa=${encodeURIComponent(gKey)}&estancia=${encodeURIComponent(eKey)}`;
    const waText = `Hola Instituto Froebel, ${waOrigen} coticé ${g.label} (${e.label}: $${prontoTotal.toLocaleString('es-MX')}/mes Pronto Pago). Quiero informes o agendar visita.`;
    waBtn.href = `https://wa.me/525554148872?text=${encodeURIComponent(waText)}`;

    if (trackChange) {
      try {
        let prev = {};
        const prevRaw = sessionStorage.getItem('froebel_quote_draft_v1');
        if (prevRaw) prev = JSON.parse(prevRaw) || {};
        sessionStorage.setItem(
          'froebel_quote_draft_v1',
          JSON.stringify({
            ...prev,
            program: gKey,
            estancia: eKey,
            totalMonthly: prontoTotal,
            programLabel: g.label,
            estanciaLabel: e.label,
            updatedAt: Date.now(),
          })
        );
        window.dispatchEvent(new CustomEvent('froebel:quote-updated'));
      } catch (_) {
        // Ignore storage write errors
      }
      if (window.FroebelUX && !window.FroebelUX.isBot()) {
        window.FroebelUX.track('cta_click', {
          element_id: `colonia_calc_${gKey}_${eKey}`,
          element_text: `Cotizador ${colonia}: ${g.label} ($${prontoTotal}/mes)`,
        });
      }
    }
  };

  gradeSel.addEventListener('change', () => renderCalc(true));
  estSel.addEventListener('change', () => renderCalc(true));
  renderCalc(false);
}

/* === HEADER SCROLL EFFECT (rAF-throttled, zero redundant DOM writes) === */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let isScrolled = window.scrollY > 50;
  if (isScrolled) header.classList.add('header--scrolled');
  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 50;
        if (nextScrolled !== isScrolled) {
          isScrolled = nextScrolled;
          header.classList.toggle('header--scrolled', isScrolled);
        }
        ticking = false;
      });
    },
    { passive: true }
  );
}

/* === MOBILE NAV === */
function initMobileNav() {
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');
  if (!toggle || !nav) return;

  if (!document.getElementById('froebel-mobile-nav-styles')) {
    const style = document.createElement('style');
    style.id = 'froebel-mobile-nav-styles';
    style.textContent = `
      .mobile-nav-quick-panel { display: none; }
      @media (max-width: 768px) {
        .grid--2 > * { order: initial !important; }
        .hero__image img { max-height: 210px !important; width: 100% !important; }
        img[src*="assets/images/blog/"] { max-height: 200px !important; margin-bottom: 1rem !important; }
        .section[id^="hero-"], .section#contacto-hero {
          padding-top: calc(72px + 0.85rem) !important;
          padding-bottom: 1.25rem !important;
        }
        .section[id^="hero-"] .section-header__label, .section#contacto-hero .section-header__label {
          margin-bottom: 0.35rem !important;
          font-size: 0.72rem !important;
        }
        .section[id^="hero-"] .section-header__title, .section#contacto-hero .section-header__title {
          font-size: 1.48rem !important;
          line-height: 1.22 !important;
          margin-bottom: 0.45rem !important;
        }
        .section[id^="hero-"] .section-header__desc, .section#contacto-hero .section-header__desc {
          font-size: 0.9rem !important;
          line-height: 1.42 !important;
        }
        .header__nav--open {
          justify-content: flex-start !important;
          padding: 4.75rem 1.25rem 1.5rem !important;
          gap: 0.55rem !important;
          overflow-y: auto !important;
        }
        .header__nav--open .header__link {
          font-size: 1.2rem !important;
          padding: 0.25rem 0.5rem !important;
        }
        .header__nav--open .header__cta {
          margin-top: 0.35rem !important;
          max-width: 340px !important;
          padding: 0.7rem 1rem !important;
          font-size: 0.95rem !important;
        }
        .header__nav--open .mobile-nav-quick-panel {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
          max-width: 340px;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid #cbd5e1;
          text-align: center;
        }
        .mobile-nav-quick-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #475569;
        }
        .mobile-nav-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.45rem;
        }
        .mobile-nav-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: 0.55rem 0.5rem;
          background: #ffffff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e3a8a !important;
          box-shadow: 0 2px 5px rgba(30, 64, 175, 0.06);
        }
        .mobile-nav-wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          padding: 0.7rem 1rem;
          background: #16a34a;
          color: #ffffff !important;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (!nav.querySelector('#mobile-nav-quick-panel')) {
    const panel = document.createElement('div');
    panel.id = 'mobile-nav-quick-panel';
    panel.className = 'mobile-nav-quick-panel';
    panel.innerHTML = `
      <div class="mobile-nav-quick-title">⚡ Acceso Rápido a Niveles y Costos 2026-2027</div>
      <div class="mobile-nav-quick-grid">
        <a class="mobile-nav-pill" href="/maternal-bilingue-1-a-3-anos">🍼 Maternal (1-3a)</a>
        <a class="mobile-nav-pill" href="/preescolar-stem-3-a-6-anos">🎓 Kínder SEP (3-6a)</a>
        <a class="mobile-nav-pill" href="/horario-extendido-y-comedor">⏰ Estancia 18:00h</a>
        <a class="mobile-nav-pill" href="/instalaciones-y-seguridad">🛡️ Seguridad CCTV</a>
      </div>
      <a class="mobile-nav-pill" href="/inscripciones#costos" style="background:#fef9c3;border-color:#fde047;color:#854d0e !important;">💳 Colegiatura $3,600/mes Pronto Pago · Ver Tabla →</a>
      <a class="mobile-nav-wa-btn" href="https://wa.me/525554148872?text=Hola%20Instituto%20Froebel%2C%20me%20interesa%20pedir%20informes%20y%20agendar%20una%20visita" rel="noopener noreferrer" target="_blank">💬 WhatsApp Directo: 55 5414 8872</a>
    `;
    nav.appendChild(panel);
  }

  const closeMenu = () => {
    nav.classList.remove('header__nav--open');
    toggle.classList.remove('header__toggle--active');
    const spans = toggle.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  };

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

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
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
    const summary = detail.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', (e) => {
      if (!e.isTrusted) return;
      if (window.FroebelUX && typeof window.FroebelUX.isBot === 'function' && window.FroebelUX.isBot()) {
        return;
      }
      if (!detail.open && window.FroebelUX) {
        const label = summary.textContent.trim().slice(0, 80) || 'faq-item';
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
    'position: fixed',
    'bottom: 12px',
    'left: 12px',
    'right: 84px',
    'max-width: 430px',
    'z-index: 9998',
    'background: rgba(15, 23, 42, 0.97)',
    'color: #f8fafc',
    'border: 1px solid rgba(59, 130, 246, 0.45)',
    'border-radius: 16px',
    'box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35)',
    'padding: 10px 14px',
    'font-family: var(--font-body, Inter, system-ui, sans-serif)',
    'font-size: 13px',
    'line-height: 1.5',
    'display: flex',
    'align-items: center',
    'justify-content: space-between',
    'gap: 14px',
    'transition: opacity 0.25s ease, transform 0.25s ease, bottom 0.22s ease, right 0.22s ease'
  ].join(';');

  banner.innerHTML = `
    <div style="flex: 1; color: #e2e8f0;">
      <div style="font-weight: 700; color: #ffd54f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
        🍪 Aviso de Cookies y Calidad UX
      </div>
      <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">
        Medimos la experiencia en nuestro sitio para mejorar la atención a familias en GAM. Consulta nuestro
        <a href="/contacto#aviso-privacidad" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Aviso de Privacidad</a>.
      </p>
    </div>
    <button
      type="button"
      id="froebel-cookie-accept-btn"
      data-ux-id="cookie-consent-accept"
      style="flex-shrink: 0; background: #2563eb; color: #ffffff; border: none; border-radius: 999px; padding: 8px 14px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); transition: background 0.2s ease;"
    >
      Entendido
    </button>
  `;

  document.body.appendChild(banner);

  const acceptBtn = document.getElementById('froebel-cookie-accept-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, 'accepted');
      } catch (_) {}
      if (window.FroebelUX) {
        window.FroebelUX.track('cta_click', {
          element_id: 'cookie_consent_accept',
          element_text: 'Aceptar Aviso de Cookies y Telemetría UX',
        });
      }
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(12px)';
      setTimeout(() => banner.remove(), 260);
    });
  }
}

/* === MOBILE STICKY CONVERSION DOCK (Zero-CLS Thumb-Zone Bar on Scroll > 300px) === */
function initMobileStickyConversionBar() {
  const path = (window.location.pathname || '/').toLowerCase();
  if (/^\/admin/i.test(path)) return;
  if (document.getElementById('froebel-mobile-dock')) return;

  const isInscripciones = path === '/inscripciones' || path === '/inscripciones.html';
  let enrollHref = '/inscripciones?inscribir=1';
  let enrollLabel = '📝 Costos $3,600';
  let waMessage =
    'Hola Instituto Froebel, vi su sitio desde mi celular y quiero costos 2026-2027 ($3,600/mes) o agendar visita';

  if (isInscripciones) {
    enrollHref = '#wizard-section';
    enrollLabel = '🚀 Pre-inscribir';
    waMessage =
      'Hola Instituto Froebel, estoy revisando los costos e inscripciones 2026-2027 desde mi celular y quiero informes';
  } else if (
    path.includes('maternal') ||
    path.includes('esfinteres') ||
    path.includes('neurodesarrollo') ||
    path.includes('llora')
  ) {
    enrollHref = '/inscripciones?inscribir=1&programa=maternal';
    waMessage =
      'Hola Instituto Froebel, busco informes de Maternal Bilingüe (1 a 3 años, $3,600/mes Pronto Pago) y agendar visita';
  } else if (
    path.includes('preescolar-stem') ||
    path.includes('edad-debe-empezar') ||
    path.includes('bloques') ||
    path.includes('mejor-kinder')
  ) {
    enrollHref = '/inscripciones?inscribir=1&programa=preescolar_1';
    waMessage =
      'Hola Instituto Froebel, busco informes de Preescolar Bilingüe STEM SEP (3 a 6 años, $3,600/mes Pronto Pago)';
  } else if (path.includes('horario-extendido') || path.includes('menu-semanal')) {
    enrollHref = '/inscripciones?inscribir=1&estancia=completa_18h';
    enrollLabel = '🍱 Cotizar 18h';
    waMessage =
      'Hola Instituto Froebel, me interesa el Horario Extendido hasta 18:00h con Comedor (desde $5,000/mes integrado)';
  } else if (path.includes('/colegio-cerca-de-mi/')) {
    const colMap = {
      'san-juan-de-aragon': 'San Juan de Aragón',
      'romero-rubio': 'Romero Rubio / Oceanía',
      'penon-de-los-banos': 'Peñón de los Baños / AICM',
      'gertrudis-sanchez': 'Gertrudis Sánchez / Eduardo Molina',
      'nueva-tenochtitlan': 'Nueva Tenochtitlán / Bondojito',
    };
    const slugMatch = Object.keys(colMap).find((k) => path.includes(k));
    const colLabel = slugMatch ? colMap[slugMatch] : 'Gustavo A. Madero';
    waMessage = `Hola Instituto Froebel, vivo cerca de ${colLabel} y quiero informes de Maternal/Kínder ($3,600/mes Pronto Pago)`;
  }

  const dock = document.createElement('div');
  dock.id = 'froebel-mobile-dock';
  dock.setAttribute('role', 'region');
  dock.setAttribute('aria-label', 'Acciones rápidas de costos, WhatsApp y llamada');
  dock.setAttribute('aria-hidden', 'true');
  dock.style.cssText = [
    'position: fixed',
    'left: 10px',
    'right: 10px',
    'bottom: max(8px, env(safe-area-inset-bottom, 8px))',
    'z-index: 9997',
    'background: rgba(15, 23, 42, 0.96)',
    'backdrop-filter: blur(12px)',
    '-webkit-backdrop-filter: blur(12px)',
    'border: 1px solid rgba(59, 130, 246, 0.45)',
    'border-radius: 999px',
    'box-shadow: 0 14px 34px rgba(15, 23, 42, 0.38)',
    'padding: 6px',
    'display: flex',
    'align-items: center',
    'gap: 6px',
    'font-family: var(--font-body, Inter, system-ui, sans-serif)',
    'transform: translateY(140%)',
    'opacity: 0',
    'pointer-events: none',
    'transition: transform 0.22s ease, opacity 0.22s ease'
  ].join(';');

  dock.innerHTML = `
    <a
      id="froebel-dock-enroll"
      data-ux-id="mobile-dock-inscribir"
      href="${enrollHref}"
      style="flex: 1.15; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 40px; padding: 0 10px; border-radius: 999px; background: #ffc107; color: #0f172a; font-size: 12.5px; font-weight: 800; text-decoration: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.28);"
    >${enrollLabel}</a>
    <a
      id="froebel-dock-wa"
      data-ux-id="mobile-dock-whatsapp"
      href="https://wa.me/525554148872?text=${encodeURIComponent(waMessage)}"
      target="_blank"
      rel="noopener noreferrer"
      style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 40px; padding: 0 10px; border-radius: 999px; background: #16a34a; color: #ffffff; font-size: 12.5px; font-weight: 800; text-decoration: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);"
    >💬 WhatsApp</a>
    <a
      id="froebel-dock-tel"
      data-ux-id="mobile-dock-tel"
      href="tel:+525554148872"
      aria-label="Llamar al Instituto Federico Froebel 55 5414 8872"
      style="width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.28); color: #ffffff; font-size: 16px; text-decoration: none;"
    >📞</a>
  `;

  document.body.appendChild(dock);

  const applySavedQuoteToDock = () => {
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (!savedRaw) return;
      const draft = JSON.parse(savedRaw);
      if (!draft || !draft.totalMonthly) return;
      const enrollEl = document.getElementById('froebel-dock-enroll');
      const waEl = document.getElementById('froebel-dock-wa');
      const formattedTotal = Number(draft.totalMonthly).toLocaleString('es-MX');
      if (enrollEl) {
        if (isInscripciones) {
          enrollEl.textContent = `🚀 Apartar $${formattedTotal}`;
        } else {
          enrollEl.textContent = `📝 Cotización $${formattedTotal}`;
          const pParam = encodeURIComponent(draft.program || 'preescolar_1');
          const eParam = encodeURIComponent(draft.estancia || 'ninguna');
          enrollEl.href = `/inscripciones?inscribir=1&programa=${pParam}&estancia=${eParam}`;
        }
      }
      if (waEl) {
        const extraEst =
          draft.estancia && draft.estancia !== 'ninguna' && draft.estanciaLabel
            ? ` ${draft.estanciaLabel}`
            : '';
        const customWa = `Hola Instituto Froebel, coticé ${draft.programLabel || 'Maternal/Kínder'} ($${formattedTotal}/mes${extraEst}) y quiero informes o agendar visita`;
        waEl.href = `https://wa.me/525554148872?text=${encodeURIComponent(customWa)}`;
      }
    } catch (_) {
      // Ignore storage read errors
    }
  };

  applySavedQuoteToDock();
  window.addEventListener('froebel:quote-updated', applySavedQuoteToDock);

  if (isInscripciones) {
    const enrollBtn = document.getElementById('froebel-dock-enroll');
    if (enrollBtn) {
      enrollBtn.addEventListener('click', (ev) => {
        if (typeof window.openEnrollmentWizard === 'function') {
          ev.preventDefault();
          window.openEnrollmentWizard();
        }
      });
    }
  }

  let visible = false;
  let ticking = false;

  const syncDockState = () => {
    ticking = false;
    const isMobile = window.innerWidth <= 768;
    const scrolledEnough = window.scrollY > 300;
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const fieldFocused = /^(INPUT|SELECT|TEXTAREA)$/.test(activeTag);
    const navOpen = Boolean(document.querySelector('.header__nav--open'));
    const shouldShow = isMobile && scrolledEnough && !fieldFocused && !navOpen;

    if (shouldShow === visible) return;
    visible = shouldShow;

    dock.style.transform = visible ? 'translateY(0)' : 'translateY(140%)';
    dock.style.opacity = visible ? '1' : '0';
    dock.style.pointerEvents = visible ? 'auto' : 'none';
    dock.setAttribute('aria-hidden', visible ? 'false' : 'true');

    const fab = document.querySelector('.whatsapp-fab');
    if (fab) {
      fab.style.opacity = visible ? '0' : '';
      fab.style.pointerEvents = visible ? 'none' : '';
    }

    const cookieBanner = document.getElementById('froebel-cookie-banner');
    if (cookieBanner) {
      cookieBanner.style.bottom = visible ? '66px' : '12px';
      cookieBanner.style.right = visible ? '10px' : '84px';
    }
  };

  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncDockState);
  };

  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync, { passive: true });
  document.addEventListener('focusin', requestSync, { passive: true });
  document.addEventListener('focusout', () => setTimeout(requestSync, 80), { passive: true });
  const navToggle = document.querySelector('.header__toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => setTimeout(requestSync, 40));
  }
  syncDockState();
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
    /GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Claude-Web|Anthropic|Google-Extended|Applebot-Extended|meta-webindexer|Meta-ExternalAgent|Meta-ExternalFetcher|DuckAssistBot|YouBot|Amazonbot|Cohere-ai|CCBot|Bytespider/i.test(
      ua
    );
  const isSearchBot = /Googlebot|bingbot|Applebot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|SemrushBot|AhrefsBot|MJ12bot|DotBot|PetalBot|HeadlessChrome|Lighthouse/i.test(ua);
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

  // Core Web Vitals state (with background-tab offset correction)
  const cwv = {
    lcp: null,
    cls: 0,
    inp: null,
    fcp: null,
    ttfb: null,
  };
  let firstVisibleOffset = document.visibilityState === 'hidden' ? null : 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && firstVisibleOffset === null) {
      firstVisibleOffset = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    }
  });

  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries[0]) {
      cwv.ttfb = Math.round(navEntries[0].responseStart);
    }

    if ('PerformanceObserver' in window) {
      try {
        let lcpFinalized = false;
        const lcpObs = new PerformanceObserver((entryList) => {
          if (lcpFinalized) return;
          const entries = entryList.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            const offset = firstVisibleOffset !== null && last.startTime >= firstVisibleOffset ? firstVisibleOffset : 0;
            const val = Math.max(1, Math.round(last.startTime - offset));
            if (val <= 4500 || (cwv.lcp === null && val <= 8000)) {
              cwv.lcp = val;
            }
          }
        });
        lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
        const stopLcp = () => {
          lcpFinalized = true;
          try { lcpObs.disconnect(); } catch (_) {}
        };
        ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((evt) => {
          window.addEventListener(evt, stopLcp, { once: true, passive: true, capture: true });
        });
      } catch (_) {}

      try {
        const fcpObs = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              const offset = firstVisibleOffset !== null && entry.startTime >= firstVisibleOffset ? firstVisibleOffset : 0;
              const val = Math.max(1, Math.round(entry.startTime - offset));
              if (val <= 10000) cwv.fcp = val;
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
            // W3C INP spec: only genuine discrete user interactions carry interactionId > 0
            if (entry.interactionId && entry.interactionId > 0 && entry.duration) {
              const dur = Math.round(entry.duration);
              if (!cwv.inp || dur > cwv.inp) {
                cwv.inp = dur;
              }
            }
          }
        });
        inpObs.observe({ type: 'event', buffered: true, durationThreshold: 40 });
      } catch (_) {}
    }
  } catch (_) {}

  // Cache static On-Page SEO Score once (avoids 6 full-DOM querySelectorAll scans per event)
  const cachedSeoScore = computeOnPageSeoScore();

  // Scroll & Active Time tracking (rAF-throttled + cached scrollHeight to avoid forced synchronous reflows)
  let maxScrollPct = 0;
  const scrollMilestones = new Set();
  let activeStartTs = Date.now();
  let accumulatedActiveMs = 0;
  let cachedScrollSpan = 1;
  const recomputeScrollSpan = () => {
    cachedScrollSpan = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  };
  recomputeScrollSpan();
  window.addEventListener('resize', recomputeScrollSpan, { passive: true });
  window.addEventListener('load', recomputeScrollSpan, { once: true, passive: true });

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / cachedScrollSpan) * 100)));
        if (pct > maxScrollPct) maxScrollPct = pct;

        [25, 50, 75, 100].forEach((milestone) => {
          if (pct >= milestone && !scrollMilestones.has(milestone)) {
            scrollMilestones.add(milestone);
            scheduleTelemetry('scroll_depth', {
              scroll_pct: milestone,
              element_id: `scroll_${milestone}`,
            });
          }
        });
      });
    },
    { passive: true }
  );

  // Persist UTM / AI Agent Referral Attribution (?utm_source=chatgpt.com, perplexity, gemini, etc.)
  let persistedUtmSource = '';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const qUtm = (urlParams.get('utm_source') || urlParams.get('ref') || '').trim();
    if (qUtm) {
      const qMed = (urlParams.get('utm_medium') || '').trim();
      persistedUtmSource = qMed ? `utm:${qUtm}/${qMed}` : `utm:${qUtm}`;
      sessionStorage.setItem('froebel_utm_source', persistedUtmSource);
    } else {
      persistedUtmSource = sessionStorage.getItem('froebel_utm_source') || '';
    }
  } catch (_) {}

  // Transmit event to Supabase RPC
  function sendTelemetry(eventType, extra = {}, keepalive = false) {
    const effectiveSource = persistedUtmSource || document.referrer || 'direct';
    const activeNow =
      document.visibilityState === 'visible'
        ? accumulatedActiveMs + (Date.now() - activeStartTs)
        : accumulatedActiveMs;

    const profileCode = extra.parent_profile || inferParentProfile(extra.element_text || '');
    const activeSec = Math.round(Math.min(activeNow, 600000) / 1000);
    const seoScoreVal = cachedSeoScore;

    if (cwv.fcp === null && typeof performance !== 'undefined' && performance.getEntriesByType) {
      try {
        const paints = performance.getEntriesByType('paint') || [];
        for (const p of paints) {
          if (p.name === 'first-contentful-paint' && p.startTime > 0 && p.startTime <= 15000) {
            cwv.fcp = Math.round(p.startTime);
          }
        }
        if (cwv.fcp === null) {
          const nav = (performance.getEntriesByType('navigation') || [])[0];
          if (nav && nav.domContentLoadedEventEnd > 0 && nav.domContentLoadedEventEnd <= 15000) {
            cwv.fcp = Math.round(nav.domContentLoadedEventEnd);
          }
        }
      } catch (_) {}
    }

    const effectiveLcp = cwv.lcp !== null ? cwv.lcp : cwv.fcp;

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
        source: effectiveSource,
        user_agent: ua.slice(0, 220),
        parent_profile: {
          perfil: profileCode,
          dispositivo: deviceType,
          fuente: effectiveSource,
        },
        session_summary: {
          visitor_id: visitorId,
          pagina: pageSlug,
          dispositivo: deviceType,
          scroll_max_pct: maxScrollPct,
          tiempo_activo_s: activeSec,
          seo_score: seoScoreVal,
          cwv_lcp_ms: effectiveLcp,
          cwv_cls: cwv.cls,
          cwv_inp_ms: cwv.inp,
        },
        seo_score: seoScoreVal,
        cwv: {
          lcp: effectiveLcp,
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

  // Yield to browser Next Paint before serializing/dispatching non-unload telemetry (keeps INP < 50ms)
  function scheduleTelemetry(eventType, extra = {}, immediateKeepalive = false) {
    if (immediateKeepalive) {
      sendTelemetry(eventType, extra, true);
      return;
    }
    setTimeout(() => sendTelemetry(eventType, extra, false), 0);
  }

  // Expose global tracker for Wizard & custom forms
  window.FroebelUX = {
    track: (eventType, extra) => scheduleTelemetry(eventType, extra, eventType === 'form_submit'),
    getSlug: () => pageSlug,
    isBot: () => isSearchBot || isAiBot,
  };

  // 1. Emit initial page_view after brief settle so FCP/TTFB are populated
  setTimeout(() => {
    recomputeScrollSpan();
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
            el.querySelector('h1, h2, h3, th')?.textContent?.trim()?.slice(0, 45) ||
            el.className.split(' ')[0] ||
            'section';
          if (!seenSections.has(secId)) {
            seenSections.add(secId);
            const headingText =
              el.querySelector('h1, h2, h3, caption')?.textContent?.trim() ||
              (el.tagName === 'TABLE' ? el.closest('.card, section')?.querySelector('h3, h2')?.textContent?.trim() : '') ||
              secId;
            scheduleTelemetry('section_view', {
              section_id: secId,
              element_id: secId,
              element_text: headingText.slice(0, 80),
            });
          }
        }
      });
    },
    { threshold: 0.15 }
  );

  document
    .querySelectorAll('section, [data-ux-section], .pricing-card, .program-card, .wizard, .blog-content, table[id]')
    .forEach((sec) => sectionObserver.observe(sec));

  // 3. Click, CTA, WhatsApp, Phone, Rage Click & Dead Click Detector
  let recentClicks = [];

  document.addEventListener(
    'click',
    (e) => {
      const now = Date.now();
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      // Check for Rage Clicks (3+ clicks within 800ms inside 40px radius, excluding desktop triple-click text selection)
      recentClicks = recentClicks.filter((c) => now - c.t < 800);
      recentClicks.push({ t: now, x: e.clientX, y: e.clientY });
      if (recentClicks.length >= 3) {
        const first = recentClicks[0];
        const dist = Math.hypot(e.clientX - first.x, e.clientY - first.y);
        if (dist < 40) {
          recentClicks = [];
          const selectedTxt = window.getSelection ? window.getSelection().toString().trim() : '';
          const isSelectingText = !target.closest('a, button, [role="button"], input, select, summary, .btn') && selectedTxt.length >= 3;
          if (!isSelectingText) {
            const rageLabel =
              target.id ||
              target.closest('[id]')?.id ||
              target.textContent?.trim()?.slice(0, 50) ||
              target.tagName;
            scheduleTelemetry('rage_click', {
              element_id: `rage:${rageLabel}`,
              element_text: target.textContent?.trim()?.slice(0, 80) || target.tagName,
            });
          }
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
          scheduleTelemetry(
            'whatsapp_click',
            {
              element_id: `wa:${elId}`,
              element_text: text || 'WhatsApp CTA',
            },
            true
          );
        } else if (href.startsWith('tel:')) {
          scheduleTelemetry(
            'phone_click',
            {
              element_id: `tel:${elId}`,
              element_text: text || href,
            },
            true
          );
        } else {
          const navigatesAway = Boolean(href && !href.startsWith('#') && !href.startsWith('javascript:'));
          scheduleTelemetry(
            'cta_click',
            {
              element_id: `cta:${elId}`,
              element_text: text,
              meta: { href },
            },
            navigatesAway
          );
        }
      } else {
        // Check Dead Click on visual card headers/badges that users might think are links
        const cardCandidate = target.closest('.card, .pricing-card, .feature-card, .testimonial-card, img');
        if (
          cardCandidate &&
          !target.closest('form, input, select, textarea, label, #froebel-photo-lightbox, [data-ux-ignore-dead]')
        ) {
          const deadLabel =
            cardCandidate.querySelector('h3, h4, strong')?.textContent?.trim()?.slice(0, 50) ||
            target.getAttribute('alt') ||
            cardCandidate.className;
          scheduleTelemetry('dead_click', {
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
