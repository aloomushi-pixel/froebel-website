/* ============================================
   INSTITUTO FEDERICO FROEBEL — Main JavaScript
   + Autonomous UX, CWV, SEO & Parent Intent Telemetry Engine v2.1
   ============================================ */

const FROEBEL_SESSION_QUOTE_KEY = 'froebel_quote_draft_v1';
const FROEBEL_PERSIST_QUOTE_KEY = 'froebel_quote_draft_persist_v1';
const FROEBEL_PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let hydratedFromPersistentStore = false;
(function hydratePersistentQuoteDraftOnBoot() {
  try {
    const existingSession = sessionStorage.getItem(FROEBEL_SESSION_QUOTE_KEY);
    if (existingSession) return;
    const persistedRaw = localStorage.getItem(FROEBEL_PERSIST_QUOTE_KEY);
    if (!persistedRaw) return;
    const parsed = JSON.parse(persistedRaw);
    if (!parsed || typeof parsed !== 'object') return;
    if (parsed.updatedAt && Date.now() - Number(parsed.updatedAt) > FROEBEL_PERSIST_TTL_MS) {
      localStorage.removeItem(FROEBEL_PERSIST_QUOTE_KEY);
      return;
    }
    const safeDraft = {
      program: typeof parsed.program === 'string' ? parsed.program : '',
      plan: typeof parsed.plan === 'string' ? parsed.plan : 'pronto_pago',
      estancia: typeof parsed.estancia === 'string' ? parsed.estancia : 'ninguna',
      totalMonthly: Number(parsed.totalMonthly) || 0,
      programLabel: typeof parsed.programLabel === 'string' ? parsed.programLabel : '',
      estanciaLabel: typeof parsed.estanciaLabel === 'string' ? parsed.estanciaLabel : '',
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
    sessionStorage.setItem(FROEBEL_SESSION_QUOTE_KEY, JSON.stringify(safeDraft));
    hydratedFromPersistentStore = true;
  } catch (_) {}
})();

function initPersistentQuoteDraftBridge() {
  window.addEventListener('froebel:quote-updated', (ev) => {
    if (ev && ev.detail && ev.detail.source === 'localstorage-bridge') return;
    try {
      const raw = sessionStorage.getItem(FROEBEL_SESSION_QUOTE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      // Persist only non-PII quote selections (never persist student/guardian PII in localStorage)
      const nonPiiDraft = {
        program: typeof parsed.program === 'string' ? parsed.program : '',
        plan: typeof parsed.plan === 'string' ? parsed.plan : 'pronto_pago',
        estancia: typeof parsed.estancia === 'string' ? parsed.estancia : 'ninguna',
        totalMonthly: Number(parsed.totalMonthly) || 0,
        programLabel: typeof parsed.programLabel === 'string' ? parsed.programLabel : '',
        estanciaLabel: typeof parsed.estanciaLabel === 'string' ? parsed.estanciaLabel : '',
        updatedAt: Date.now(),
      };
      localStorage.setItem(FROEBEL_PERSIST_QUOTE_KEY, JSON.stringify(nonPiiDraft));
    } catch (_) {}
  });

  if (hydratedFromPersistentStore) {
    window.dispatchEvent(
      new CustomEvent('froebel:quote-updated', { detail: { source: 'localstorage-bridge' } })
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPersistentQuoteDraftBridge();
  initHeader();
  initMobileNav();
  initFroebelCollapsibles();
  initHyperlocalNeighborhoodCalculators();
  initInteractiveComparisonTables();
  initInteractiveActionCards();
  initContactVisitForm();
  initInscripcionInfoForm();
  initFroebelUXTelemetry();

  const runDeferredEnhancements = () => {
    initScrollAnimations();
    initSmoothScroll();
    initFaqAccordions();
    initInteractiveHeroLabels();
    initInteractivePhotoGalleryFilters();
    initFacilityPhotoLightbox();
    initCopyAddressButtons();
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

/* === INTERACTIVE HERO EYEBROW PILLS (Eliminates Mobile Subpage Hero Label Rage-Taps) === */
function initInteractiveHeroLabels() {
  const heroLabels = document.querySelectorAll(
    '.section[id^="hero-"] .section-header__label, .section#contacto-hero .section-header__label'
  );
  if (!heroLabels.length) return;

  heroLabels.forEach((lbl) => {
    if (lbl.tagName.toLowerCase() === 'a' || lbl.closest('a, button')) return;
    const dest =
      document.getElementById('cotizador-rapido-colonia') ||
      document.getElementById('wizard-section') ||
      document.getElementById('calculadora-estancia-aicm') ||
      document.getElementById('planificador-ruta-gam') ||
      document.getElementById('filtro-temas-blog');
    if (!dest) return;

    lbl.style.cursor = 'pointer';
    lbl.style.display = 'inline-flex';
    lbl.style.alignItems = 'center';
    lbl.style.gap = '6px';
    lbl.style.padding = '4px 12px';
    lbl.style.borderRadius = '999px';
    lbl.style.background = 'rgba(30, 64, 175, 0.08)';
    lbl.style.border = '1px solid rgba(30, 64, 175, 0.18)';
    lbl.setAttribute('role', 'button');
    lbl.setAttribute('tabindex', '0');
    lbl.setAttribute('data-ux-id', 'hero-eyebrow-jump');
    if (!lbl.textContent.includes('↓')) {
      lbl.textContent = `${lbl.textContent.trim()} ↓`;
    }

    const jump = () => {
      if (typeof window.FroebelOpenCollapsibleFor === 'function') {
        window.FroebelOpenCollapsibleFor(dest);
      }
      const topY = dest.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(0, topY), behavior: 'smooth' });
      const prevOutline = dest.style.outline;
      dest.style.outline = '2px solid #1e40af';
      setTimeout(() => {
        dest.style.outline = prevOutline;
      }, 900);
    };

    lbl.addEventListener('click', jump);
    lbl.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        jump();
      }
    });
  });
}

/* === INTERACTIVE FILTERABLE CAMPUS PHOTO GALLERY (/ & /instalaciones-y-seguridad) === */
function initInteractivePhotoGalleryFilters() {
  const GALLERY_KEY = 'froebel_gallery_filter_v1';
  document.querySelectorAll('[data-gallery-root]').forEach((rootEl) => {
    const buttons = Array.from(rootEl.querySelectorAll('[data-gallery-filter]'));
    const items = Array.from(rootEl.querySelectorAll('[data-gallery-cat]'));
    const countBadge = rootEl.querySelector('[data-gallery-count]');
    if (!buttons.length || !items.length) return;

    const applyFilter = (cat, persist) => {
      const activeCat = cat || 'all';
      let shown = 0;
      items.forEach((item) => {
        const cats = (item.getAttribute('data-gallery-cat') || '').split(/\s+/);
        const match = activeCat === 'all' || cats.includes(activeCat);
        item.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      buttons.forEach((btn) => {
        const isCurrent = btn.getAttribute('data-gallery-filter') === activeCat;
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
        btn.style.background = isCurrent ? 'var(--color-primary)' : '#ffffff';
        btn.style.color = isCurrent ? '#ffffff' : 'var(--color-primary-dark)';
        btn.style.borderColor = isCurrent ? 'var(--color-primary)' : 'var(--color-primary-100)';
      });
      if (countBadge) {
        countBadge.textContent = `${shown} de ${items.length} espacios visibles · Toca cualquier foto para ampliar`;
      }
      if (persist) {
        try {
          localStorage.setItem(GALLERY_KEY, activeCat);
        } catch (_) {}
        if (window.FroebelUX && !window.FroebelUX.isBot()) {
          window.FroebelUX.track('cta_click', {
            element_id: `gallery_filter_${activeCat}`,
            element_text: `Filtro Galería Fotos: ${activeCat} (${shown})`,
          });
        }
      }
    };

    let initialCat = 'all';
    try {
      const savedCat = localStorage.getItem(GALLERY_KEY);
      if (savedCat && buttons.some((b) => b.getAttribute('data-gallery-filter') === savedCat)) {
        initialCat = savedCat;
      }
    } catch (_) {}

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyFilter(btn.getAttribute('data-gallery-filter') || 'all', true);
      });
    });

    applyFilter(initialCat, false);
  });
}

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

/* === 1-CLICK COPY OFFICIAL ADDRESS BUTTONS (Shareable Campus Location for Visits) === */
function initCopyAddressButtons() {
  const buttons = document.querySelectorAll('[data-copy-address]');
  if (!buttons.length) return;

  const copyTextSafe = async (txt) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(txt);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  };

  buttons.forEach((btn) => {
    const originalHtml = btn.innerHTML;
    let resetTimer = null;
    btn.setAttribute('aria-live', 'polite');
    btn.addEventListener('click', async () => {
      const addressTxt =
        btn.getAttribute('data-copy-address') ||
        'Av. 521 No. 20, Col. San Juan de Aragón I Secc, Gustavo A. Madero, 07969 CDMX (a 2 cuadras de Metro Aragón Línea 5)';
      try {
        await copyTextSafe(addressTxt);
        btn.textContent = '✓ Dirección copiada';
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 2600);
        if (window.FroebelUX && !window.FroebelUX.isBot()) {
          window.FroebelUX.track('cta_click', {
            element_id: btn.id || 'copy_official_address',
            element_text: 'Copiar Dirección Exacta GAM',
          });
        }
      } catch (_) {}
    });
  });
}

/* === INTERACTIVE PHOTO LIGHTBOX (Eliminates Mobile Photo Dead Clicks + Adds Conversion Bar) === */
function initFacilityPhotoLightbox() {
  const candidates = Array.from(document.querySelectorAll('main img, section img, article img')).filter((img) => {
    if (img.closest('a, button, header, footer')) return false;
    if (img.getAttribute('data-allow-lightbox') === '1') return true;
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
  modalImg.src = imgEl.getAttribute('data-lightbox-src') || imgEl.currentSrc || imgEl.src;
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
    const quoteProg = row.getAttribute('data-quote-program');
    const quoteEst = row.getAttribute('data-quote-estancia');
    const scrollTargetSel = row.getAttribute('data-scroll-target');
    if (!primaryLink && !quoteProg && !quoteEst && !scrollTargetSel) return;

    row.style.cursor = 'pointer';
    row.setAttribute('role', 'button');
    if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '0');
    if (!row.getAttribute('data-ux-id')) {
      const label = (row.cells[0]?.textContent || 'fila-tabla')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32);
      row.setAttribute('data-ux-id', `table-row-${label}`);
    }

    const activateRow = (ev) => {
      if (ev && ev.target && ev.target.closest('a, button, input, select')) return;
      if (quoteProg || quoteEst || scrollTargetSel) {
        const colGrado = document.getElementById('colonia-calc-grado');
        const colEst = document.getElementById('colonia-calc-estancia');
        const estGrado = document.getElementById('sim-grado-main') || document.getElementById('sim-grado-blog');
        const estHora = document.getElementById('sim-hora-main') || document.getElementById('sim-hora-blog');
        let changed = false;
        if (quoteProg && colGrado && colGrado.value !== quoteProg) {
          colGrado.value = quoteProg;
          changed = true;
        }
        if (quoteEst && colEst && colEst.value !== quoteEst) {
          colEst.value = quoteEst;
          changed = true;
        }
        if (changed && (colGrado || colEst)) {
          (colEst || colGrado).dispatchEvent(new Event('change', { bubbles: true }));
        }
        let simChanged = false;
        if (quoteProg && estGrado && estGrado.value !== quoteProg) {
          estGrado.value = quoteProg;
          simChanged = true;
        }
        const pickupMap = { ninguna: '15', parcial_16h: '16', completa_18h: '18', suelta_15h: '15' };
        if (quoteEst && estHora && pickupMap[quoteEst] && estHora.value !== pickupMap[quoteEst]) {
          estHora.value = pickupMap[quoteEst];
          simChanged = true;
        }
        if (simChanged && typeof window.updateSimuladorEstanciaFroebel === 'function') {
          window.updateSimuladorEstanciaFroebel(document.getElementById('sim-grado-main') ? 'main' : 'blog');
        }
        const dest =
          (scrollTargetSel && document.querySelector(scrollTargetSel)) ||
          document.getElementById('cotizador-rapido-colonia') ||
          document.getElementById('calculadora-estancia-aicm');
        if (dest) {
          if (typeof window.FroebelOpenCollapsibleFor === 'function') {
            window.FroebelOpenCollapsibleFor(dest);
          }
          const topY = dest.getBoundingClientRect().top + window.scrollY - 88;
          window.scrollTo({ top: Math.max(0, topY), behavior: 'smooth' });
          const prevOutline = dest.style.outline;
          dest.style.outline = '2px solid #16a34a';
          setTimeout(() => {
            dest.style.outline = prevOutline;
          }, 900);
          return;
        }
      }
      if (primaryLink) primaryLink.click();
    };

    row.addEventListener('click', activateRow);
    row.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        activateRow(ev);
      }
    });
  });
}

/* === INTERACTIVE SINGLE-CTA ACTION CARDS (Eliminates Card Surface Dead Clicks) === */
function initInteractiveActionCards() {
  document.querySelectorAll('.card').forEach((card) => {
    const tag = card.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'details' || card.hasAttribute('role')) return;
    if (card.querySelector('input, select, textarea, button, form, table, details, .froebel-collapse')) return;

    const allLinks = Array.from(card.querySelectorAll('a[href]'));
    if (!allLinks.length) return;

    let primaryLink = null;
    if (allLinks.length === 1) {
      primaryLink = allLinks[0];
    } else {
      const primaryBtns = Array.from(card.querySelectorAll('a.btn--primary[href]'));
      if (primaryBtns.length === 1) {
        primaryLink = primaryBtns[0];
      } else {
        const directLinks = Array.from(card.children).filter(
          (el) => el.tagName && el.tagName.toLowerCase() === 'a' && el.hasAttribute('href')
        );
        if (directLinks.length === 1) {
          primaryLink = directLinks[0];
        }
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
        window.dispatchEvent(new CustomEvent('froebel:quote-updated', { detail: { source: 'colonia-calc' } }));
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
  window.addEventListener('froebel:quote-updated', (ev) => {
    if (ev && ev.detail && ev.detail.source === 'colonia-calc') return;
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      if (saved && saved.program && gradeMeta[saved.program]) {
        gradeSel.value = saved.program;
      }
      if (saved && saved.estancia && estMeta[saved.estancia]) {
        estSel.value = saved.estancia;
      }
      renderCalc(false);
    } catch (_) {
      // Ignore storage access errors
    }
  });
  renderCalc(false);
}

/* === EXPRESS VISIT & CALLBACK FORM (/contacto -> POST /api/contact + Session Quote Sync) === */
function initContactVisitForm() {
  const form = document.getElementById('formulario-visita-contacto');
  if (!form) return;

  const nameInput = document.getElementById('contact-visit-name');
  const phoneInput = document.getElementById('contact-visit-phone');
  const emailInput = document.getElementById('contact-visit-email');
  const progSel = document.getElementById('contact-visit-program');
  const schedSel = document.getElementById('contact-visit-schedule');
  const notesInput = document.getElementById('contact-visit-notes');
  const submitBtn = document.getElementById('contact-visit-submit');
  const feedbackBox = document.getElementById('contact-visit-feedback');
  const quotePill = document.getElementById('contact-quote-pill');

  const progLabels = {
    maternal: 'Maternal Bilingüe (1 a 3 años)',
    preescolar_1: 'Kínder 1 SEP (3 a 4 años)',
    preescolar_2: 'Kínder 2 SEP (4 a 5 años)',
    preescolar_3: 'Kínder 3 SEP (5 a 6 años)',
  };

  const syncQuoteToContactForm = () => {
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      if (!saved) return;
      if (progSel && saved.program && progLabels[saved.program]) {
        progSel.value = saved.program;
      }
      if (quotePill && saved.totalMonthly) {
        const totalFmt = Number(saved.totalMonthly).toLocaleString('es-MX');
        const estTxt =
          saved.estancia && saved.estancia !== 'ninguna' && saved.estanciaLabel
            ? ` · ${saved.estanciaLabel}`
            : '';
        quotePill.textContent = `✓ Cotización vinculada: ${saved.programLabel || progLabels[saved.program] || 'Maternal/Kínder'} ($${totalFmt}/mes${estTxt})`;
        quotePill.style.display = 'inline-block';
      }
    } catch (_) {}
  };

  syncQuoteToContactForm();
  window.addEventListener('froebel:quote-updated', (ev) => {
    if (ev && ev.detail && ev.detail.source === 'contact-form') return;
    syncQuoteToContactForm();
  });

  if (progSel) {
    progSel.addEventListener('change', () => {
      try {
        let prev = {};
        const prevRaw = sessionStorage.getItem('froebel_quote_draft_v1');
        if (prevRaw) prev = JSON.parse(prevRaw) || {};
        const pKey = progSel.value || 'preescolar_1';
        const estKey = prev.estancia || 'ninguna';
        const extra = estKey === 'parcial_16h' ? 1400 : estKey === 'completa_18h' ? 1900 : 0;
        sessionStorage.setItem(
          'froebel_quote_draft_v1',
          JSON.stringify({
            ...prev,
            program: pKey,
            estancia: estKey,
            totalMonthly: 3600 + extra,
            programLabel: progLabels[pKey] || 'Kínder 1 SEP (3 a 4 años)',
            estanciaLabel: prev.estanciaLabel || 'Horario escolar base',
            updatedAt: Date.now(),
          })
        );
        window.dispatchEvent(new CustomEvent('froebel:quote-updated', { detail: { source: 'contact-form' } }));
        syncQuoteToContactForm();
      } catch (_) {}
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const cleanName = (nameInput?.value || '').trim();
    const cleanPhone = (phoneInput?.value || '').trim();
    const cleanEmail = (emailInput?.value || '').trim();
    const pKey = progSel?.value || 'preescolar_1';
    const pLabel = progLabels[pKey] || pKey;
    const schedLabel = schedSel?.value || '11:00 hrs (Recorrido de aulas y CCTV)';
    const extraNotes = (notesInput?.value || '').trim();

    if (!cleanName || (!cleanPhone && !cleanEmail)) {
      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#fef2f2';
        feedbackBox.style.borderColor = '#fca5a5';
        feedbackBox.style.color = '#991b1b';
        feedbackBox.textContent = 'Por favor ingresa tu nombre y tu número de WhatsApp/teléfono (o correo electrónico).';
      }
      return;
    }

    let quoteContext = '$3,600/mes Pronto Pago';
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved && saved.totalMonthly) {
          quoteContext = `$${Number(saved.totalMonthly).toLocaleString('es-MX')}/mes (${saved.estanciaLabel || 'Horario base'})`;
        }
      }
    } catch (_) {}

    const fullMessage = `Solicitud desde /contacto · Nivel: ${pLabel} · Horario preferido: ${schedLabel} · Cotización: ${quoteContext}${extraNotes ? ` · Comentarios: ${extraNotes}` : ''}`;
    const waText = `Hola Instituto Froebel, soy ${cleanName}. Solicité visita/informes en línea para ${pLabel} (${schedLabel}, ${quoteContext}).`;
    const waFallbackHref = `https://wa.me/525554148872?text=${encodeURIComponent(waText)}`;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando solicitud...';
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          message: fullMessage,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      if (window.FroebelUX) {
        window.FroebelUX.track('form_submit', {
          element_id: 'formulario-visita-contacto',
          element_text: `Visita Contacto: ${pLabel} (${schedLabel})`,
        });
      }

      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#f0fdf4';
        feedbackBox.style.borderColor = '#86efac';
        feedbackBox.style.color = '#14532d';
        feedbackBox.innerHTML = `✅ <strong>¡Solicitud recibida, ${cleanName.replace(/[<>&"']/g, '')}!</strong> Dirección Escolar te confirmará muy pronto. Si deseas respuesta en este instante: <a href="${waFallbackHref}" target="_blank" rel="noopener noreferrer" style="font-weight:800;color:#15803d;text-decoration:underline;">Confirmar en 1 clic por WhatsApp →</a>`;
      }
      if (submitBtn) {
        submitBtn.textContent = '✓ Solicitud Enviada';
      }
    } catch (_) {
      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#eff6ff';
        feedbackBox.style.borderColor = '#93c5fd';
        feedbackBox.style.color = '#1e3a8a';
        feedbackBox.innerHTML = `📲 Continúa tu confirmación directa con Admisiones aquí: <a href="${waFallbackHref}" target="_blank" rel="noopener noreferrer" style="font-weight:800;color:#1d4ed8;text-decoration:underline;">Abrir WhatsApp con mis datos precargados →</a>`;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '📅 Enviar Solicitud de Visita / Informes →';
      }
    }
  });
}

/* === INFO & CALLBACK FORM ON /inscripciones (#inscripcion-form + Session Quote Sync) === */
function initInscripcionInfoForm() {
  const infoForm = document.getElementById('inscripcion-form');
  if (!infoForm) return;

  const nameEl = document.getElementById('nombre');
  const phoneEl = document.getElementById('telefono');
  const emailEl = document.getElementById('email');
  const ageSel = document.getElementById('edad-hijo');
  const quotePill = document.getElementById('inscripcion-form-quote-pill');
  const submitBtn = document.getElementById('btn-info-submit');

  const programToAgeVal = {
    maternal: '1-2',
    preescolar_1: '3-4',
    preescolar_2: '4-5',
    preescolar_3: '5-6',
  };
  const ageValToProgram = {
    '1-2': { key: 'maternal', label: 'Maternal Bilingüe (1 a 2 años)' },
    '2-3': { key: 'maternal', label: 'Maternal Bilingüe (2 a 3 años)' },
    '3-4': { key: 'preescolar_1', label: 'Kínder 1 SEP (3 a 4 años)' },
    '4-5': { key: 'preescolar_2', label: 'Kínder 2 SEP (4 a 5 años)' },
    '5-6': { key: 'preescolar_3', label: 'Kínder 3 SEP (5 a 6 años)' },
  };

  const syncQuoteToInfoForm = () => {
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      if (!saved) return;

      if (ageSel && saved.program && programToAgeVal[saved.program]) {
        if (!(saved.program === 'maternal' && ageSel.value === '2-3')) {
          ageSel.value = programToAgeVal[saved.program];
        }
      }
      if (saved.guardian && typeof saved.guardian === 'object') {
        if (nameEl && !nameEl.value && saved.guardian.name) nameEl.value = saved.guardian.name;
        if (phoneEl && !phoneEl.value && saved.guardian.phone) phoneEl.value = saved.guardian.phone;
        if (emailEl && !emailEl.value && saved.guardian.email) emailEl.value = saved.guardian.email;
      }
      if (quotePill) {
        const estKey = saved.estancia || 'ninguna';
        const extra = estKey === 'parcial_16h' ? 1400 : estKey === 'completa_18h' ? 1900 : 0;
        const monthly = saved.totalMonthly || (saved.program ? 3600 + extra : 0);
        if (monthly) {
          const totalFmt = Number(monthly).toLocaleString('es-MX');
          const estTxt =
            estKey !== 'ninguna' && saved.estanciaLabel
              ? ` · ${saved.estanciaLabel}`
              : estKey === 'parcial_16h'
              ? ' · Estancia 16:00h + Comedor'
              : estKey === 'completa_18h'
              ? ' · Estancia 18:00h + Comedor'
              : ' · Pronto Pago';
          const pName =
            saved.programLabel ||
            (ageSel && ageValToProgram[ageSel.value]?.label) ||
            'Maternal / Kínder SEP';
          quotePill.textContent = `✓ Cotización vinculada: ${pName} ($${totalFmt} MXN/mes${estTxt})`;
          quotePill.style.display = 'block';
        }
      }
    } catch (_) {}
  };

  syncQuoteToInfoForm();
  window.addEventListener('froebel:quote-updated', (ev) => {
    if (ev && ev.detail && ev.detail.source === 'inscripcion-info-form') return;
    syncQuoteToInfoForm();
  });

  if (ageSel) {
    ageSel.addEventListener('change', () => {
      const mapped = ageValToProgram[ageSel.value];
      if (!mapped) return;
      try {
        let prev = {};
        const prevRaw = sessionStorage.getItem('froebel_quote_draft_v1');
        if (prevRaw) prev = JSON.parse(prevRaw) || {};
        const estKey = prev.estancia || 'ninguna';
        const extra = estKey === 'parcial_16h' ? 1400 : estKey === 'completa_18h' ? 1900 : 0;
        sessionStorage.setItem(
          'froebel_quote_draft_v1',
          JSON.stringify({
            ...prev,
            program: mapped.key,
            estancia: estKey,
            totalMonthly: 3600 + extra,
            programLabel: mapped.label,
            estanciaLabel: prev.estanciaLabel || 'Horario escolar base',
            updatedAt: Date.now(),
          })
        );
        window.dispatchEvent(
          new CustomEvent('froebel:quote-updated', { detail: { source: 'inscripcion-info-form' } })
        );
        syncQuoteToInfoForm();
      } catch (_) {}
    });
  }

  infoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalText = submitBtn ? submitBtn.innerHTML : 'Solicitar Información →';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    const formData = new FormData(infoForm);
    const cleanName = String(formData.get('nombre') || '').trim();
    const cleanPhone = String(formData.get('telefono') || '').trim();
    const cleanEmail = String(formData.get('email') || '').trim();
    const ageVal = String(formData.get('edad-hijo') || '').trim();
    const ageHuman = ageValToProgram[ageVal]?.label || ageVal || 'Maternal / Preescolar';

    let quoteContext = '$3,600/mes Pronto Pago';
    try {
      const savedRaw = sessionStorage.getItem('froebel_quote_draft_v1');
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved && saved.totalMonthly) {
          quoteContext = `$${Number(saved.totalMonthly).toLocaleString('es-MX')}/mes (${saved.estanciaLabel || 'Pronto Pago'})`;
        }
      }
    } catch (_) {}

    const waFollowupMsg = `Hola Instituto Froebel, soy ${cleanName || 'mamá/papá'} y solicité informes en línea para ${ageHuman} (${quoteContext}). Me gustaría recibir costos o agendar visita.`;
    const waHref = `https://wa.me/525554148872?text=${encodeURIComponent(waFollowupMsg)}`;

    let followupBox = document.getElementById('info-form-wa-followup');
    if (!followupBox) {
      followupBox = document.createElement('div');
      followupBox.id = 'info-form-wa-followup';
      followupBox.style.cssText =
        'padding:12px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;text-align:center;';
      infoForm.appendChild(followupBox);
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          message: `Solicitud desde /inscripciones · Edad/Grado: ${ageHuman} · Cotización: ${quoteContext}`,
        }),
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      if (submitBtn) {
        submitBtn.textContent = '✅ ¡Solicitud Recibida!';
        submitBtn.style.backgroundColor = 'var(--color-nature)';
        submitBtn.style.borderColor = 'var(--color-nature)';
      }
      followupBox.innerHTML = `<p style="margin:0 0 8px;font-size:0.86rem;color:#14532d;font-weight:700;">¡Gracias! Recibimos tus datos (${quoteContext.replace(/[<>&"']/g, '')}). Si deseas atención inmediata por WhatsApp:</p><a data-ux-id="info-form-wa-instant" href="${waHref}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:999px;background:#16a34a;color:#ffffff;font-weight:800;font-size:0.86rem;text-decoration:none;">💬 Confirmar ahora por WhatsApp →</a>`;
      infoForm.reset();
      syncQuoteToInfoForm();
    } catch (_) {
      followupBox.innerHTML = `<p style="margin:0 0 8px;font-size:0.86rem;color:#1e3a8a;font-weight:700;">Continúa tu solicitud directamente por WhatsApp con tus datos precargados:</p><a data-ux-id="info-form-wa-fallback" href="${waHref}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:999px;background:#16a34a;color:#ffffff;font-weight:800;font-size:0.86rem;text-decoration:none;">💬 Enviar Solicitud por WhatsApp →</a>`;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
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

  toggle.setAttribute('aria-expanded', 'false');
  if (!toggle.querySelector('.header__toggle-label')) {
    const rawSpans = Array.from(toggle.querySelectorAll('span'));
    const barsWrap = document.createElement('b');
    barsWrap.className = 'header__toggle-bars';
    barsWrap.setAttribute('aria-hidden', 'true');
    rawSpans.forEach((s) => barsWrap.appendChild(s));

    const labelEl = document.createElement('em');
    labelEl.className = 'header__toggle-label';
    labelEl.setAttribute('aria-hidden', 'true');
    labelEl.textContent = 'Menú';

    toggle.textContent = '';
    toggle.appendChild(labelEl);
    toggle.appendChild(barsWrap);
  }

  if (!document.getElementById('froebel-mobile-nav-styles')) {
    const style = document.createElement('style');
    style.id = 'froebel-mobile-nav-styles';
    style.textContent = `
      .mobile-nav-quick-panel { display: none; }
      .header__toggle-label { display: none; font-style: normal; }
      .header__toggle-bars { display: inline-flex; flex-direction: column; gap: 5px; }
      @media (max-width: 768px) {
        .header__toggle {
          flex-direction: row !important;
          align-items: center !important;
          gap: 7px !important;
          padding: 6px 12px !important;
          border-radius: 999px !important;
          background: rgba(239, 246, 255, 0.96) !important;
          border: 1.5px solid #bfdbfe !important;
          box-shadow: 0 2px 8px rgba(30, 64, 175, 0.08) !important;
        }
        .header__toggle-label {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .header__toggle span {
          width: 18px !important;
          height: 2px !important;
          background: #1e3a8a !important;
        }
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
      @media (hover: none) {
        .card:hover,
        .btn:hover,
        .org-chart__node:hover {
          transform: none !important;
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

  const syncToggleVisual = (isOpen) => {
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const lbl = toggle.querySelector('.header__toggle-label');
    if (lbl) lbl.textContent = isOpen ? 'Cerrar' : 'Menú';
    const spans = toggle.querySelectorAll('span');
    if (spans.length >= 3) {
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    }
  };

  const closeMenu = () => {
    nav.classList.remove('header__nav--open');
    toggle.classList.remove('header__toggle--active');
    syncToggleVisual(false);
  };

  toggle.addEventListener('click', () => {
    nav.classList.toggle('header__nav--open');
    toggle.classList.toggle('header__toggle--active');
    syncToggleVisual(toggle.classList.contains('header__toggle--active'));
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

/* === ACCESSIBLE COLLAPSIBLES (.froebel-collapse) === */
window.FroebelOpenCollapsibleFor = function (el) {
  if (!el || typeof el.closest !== 'function') return false;
  let opened = false;
  let panel = el.closest('.froebel-collapse__panel');
  while (panel) {
    if (panel.hasAttribute('hidden')) {
      panel.removeAttribute('hidden');
      opened = true;
    }
    const box = panel.closest('.froebel-collapse');
    const trig = box
      ? (panel.id ? box.querySelector(`[aria-controls="${panel.id}"]`) : null) ||
        box.querySelector('.froebel-collapse__trigger')
      : null;
    if (trig) trig.setAttribute('aria-expanded', 'true');
    panel = box && box.parentElement ? box.parentElement.closest('.froebel-collapse__panel') : null;
  }
  let det = el.closest('details');
  while (det) {
    if (!det.open) {
      det.open = true;
      opened = true;
    }
    det = det.parentElement ? det.parentElement.closest('details') : null;
  }
  if (opened) {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (_) {}
  }
  return opened;
};

function initFroebelCollapsibles() {
  document.querySelectorAll('.froebel-collapse').forEach((box) => {
    const trigger = box.querySelector('.froebel-collapse__trigger');
    const panel = box.querySelector('.froebel-collapse__panel');
    if (!trigger || !panel) return;

    const isInitiallyOpen = !panel.hasAttribute('hidden');
    trigger.setAttribute('aria-expanded', isInitiallyOpen ? 'true' : 'false');

    trigger.addEventListener('click', (e) => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true' && !panel.hasAttribute('hidden');
      if (isOpen) {
        panel.setAttribute('hidden', 'until-found');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        panel.removeAttribute('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        if (
          e.isTrusted &&
          window.FroebelUX &&
          !(typeof window.FroebelUX.isBot === 'function' && window.FroebelUX.isBot())
        ) {
          const label = (trigger.textContent || 'collapse').trim().slice(0, 80);
          window.FroebelUX.track('cta_click', {
            element_id: `collapse:${panel.id || trigger.getAttribute('aria-controls') || 'froebel-collapse'}`,
            element_text: label,
          });
        }
      }
    });

    panel.addEventListener('beforematch', () => {
      panel.removeAttribute('hidden');
      trigger.setAttribute('aria-expanded', 'true');
    });
  });

  const openHashTarget = () => {
    const raw = (window.location.hash || '').slice(1);
    if (!raw) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(raw));
    } catch (_) {
      target = document.getElementById(raw);
    }
    if (target && typeof window.FroebelOpenCollapsibleFor === 'function') {
      window.FroebelOpenCollapsibleFor(target);
    }
  };

  openHashTarget();
  window.addEventListener('hashchange', openHashTarget);
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
        if (typeof window.FroebelOpenCollapsibleFor === 'function') {
          window.FroebelOpenCollapsibleFor(target);
        }
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
    const syncIndicator = () => {
      const lastSpan = summary.querySelector('span:last-child');
      if (lastSpan && /^[+\-−]$/.test(lastSpan.textContent.trim())) {
        lastSpan.textContent = detail.open ? '−' : '+';
      }
    };
    syncIndicator();
    detail.addEventListener('toggle', syncIndicator);
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

  const existingDock = document.getElementById('froebel-mobile-dock');
  const dockAlreadyVisible = existingDock && existingDock.getAttribute('aria-hidden') === 'false';

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
    dockAlreadyVisible ? 'transform: translateY(-54px)' : 'transform: translateY(0)',
    'transition: opacity 0.25s ease, transform 0.22s ease'
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
        const customWaHref = `https://wa.me/525554148872?text=${encodeURIComponent(customWa)}`;
        waEl.href = customWaHref;
        const fabEl = document.querySelector('.whatsapp-fab');
        if (fabEl) fabEl.href = customWaHref;
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
    if (cookieBanner && cookieBanner.style.opacity !== '0') {
      cookieBanner.style.transform = visible ? 'translateY(-54px)' : 'translateY(0)';
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
        // Avoid duplicate cta_click events for <summary> (initFaqAccordions),
        // #froebel-cookie-accept-btn (initCookieConsentBanner), and .froebel-collapse__trigger (initFroebelCollapsibles)
        if (
          interactive.tagName.toLowerCase() === 'summary' ||
          interactive.id === 'froebel-cookie-accept-btn' ||
          interactive.classList.contains('froebel-collapse__trigger')
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
