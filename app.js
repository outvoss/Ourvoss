(function () {
  'use strict';

  /* =========================================================
     CONFIGURACIÓN SUPABASE (clave pública; la seguridad la dan las políticas RLS)
  ========================================================== */
  const SUPABASE_URL = 'https://vpncwfbinzmvsplsjubf.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cUU3BIEnmhEXbp6XzQdDLA__0uaGHQW';
  const SUPABASE_3D_TABLE = 'outvoss_3d_zapatillas';

  const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
  const $ = (id) => document.getElementById(id);
  const isHttps = (u) => /^https:\/\//i.test(u || '');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     PRELOADER CON ARCO LUMINOSO
  ========================================================== */
  const loader = $('outvossIntroLoader');
  const loaderLogoImg = $('loaderLogoImg');
  const loaderLogoPlaceholder = $('loaderLogoPlaceholder');

  function setLoaderLogo(url) {
    if (!loaderLogoImg || !loaderLogoPlaceholder) return;
    if (isHttps(url)) {
      loaderLogoImg.src = url;
      loaderLogoImg.classList.remove('hidden');
      loaderLogoPlaceholder.classList.add('hidden');
      try { localStorage.setItem('outvoss_logo', url); } catch (e) { /* sin caché */ }
    } else {
      loaderLogoImg.removeAttribute('src');
      loaderLogoImg.classList.add('hidden');
      loaderLogoPlaceholder.classList.remove('hidden');
      try { localStorage.removeItem('outvoss_logo'); } catch (e) { /* sin caché */ }
    }
  }

  if (loaderLogoImg && loaderLogoPlaceholder) {
    loaderLogoImg.addEventListener('error', () => {
      loaderLogoImg.classList.add('hidden');
      loaderLogoPlaceholder.classList.remove('hidden');
    });
    try { const cached = localStorage.getItem('outvoss_logo'); if (cached) setLoaderLogo(cached); } catch (e) { /* sin caché */ }
  }

  if (loader) {
    const dismissLoader = () => loader.classList.add('is-dismissed');
    if (document.readyState === 'complete') setTimeout(dismissLoader, 1200);
    else window.addEventListener('load', () => setTimeout(dismissLoader, reduceMotion ? 600 : 3200));
    setTimeout(dismissLoader, 9000); // respaldo si algún recurso tarda demasiado
  }

  /* =========================================================
     VIDEOS (portada y maniquí) CON RESPALDO VISUAL
  ========================================================== */
  function setupVideoFallback(videoId, fallbackId) {
    const video = $(videoId);
    const fallback = $(fallbackId);
    if (!video || !fallback) return;
    const hide = () => fallback.classList.add('hidden');
    video.addEventListener('loadeddata', hide);
    video.addEventListener('error', () => {
      if (video.getAttribute('src')) fallback.classList.remove('hidden');
    });
    if (video.readyState >= 2) hide();
  }

  setupVideoFallback('mannequinVideo', 'mannequinFallback');
  setupVideoFallback('heroMp4Player', 'heroMp4Fallback');

  function setVideoSource(video, url) {
    if (!video || !isHttps(url) || video.getAttribute('src') === url) return;
    video.src = url;
    video.load();
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  /* =========================================================
     PANTALLA DE MODELOS 3D DE CALZADO
  ========================================================== */
  const shoe3dIframe = $('shoe3dIframe');
  const shoe3dTitle = $('shoe3dTitle');
  const shoe3dCategory = $('shoe3dCategory');
  const shoe3dCounter = $('shoe3dCounter');
  const shoe3dDots = $('shoe3dDots');

  let models3d = Array.from({ length: 18 }, (_, i) => ({
    title: 'Modelo Calzado 3D #' + String(i + 1).padStart(2, '0'),
    category: 'CALZADO 3D · OUTVOSS',
    embedUrl: '',
    mediaUrl: ''
  }));
  let current3d = 0;
  let screen3dVisible = false; // el visor pesado solo se carga al acercarse a la pantalla 3D

  function update3dMedia(model) {
    if (!shoe3dIframe || !shoe3dIframe.parentElement) return;
    const box = shoe3dIframe.parentElement;
    let preview = $('shoe3dStorageMediaPreview');
    const media = isHttps(model.mediaUrl) ? model.mediaUrl.trim() : '';
    const embed = isHttps(model.embedUrl) ? model.embedUrl.trim() : '';

    if (media && !embed) {
      if (!preview) {
        preview = document.createElement('div');
        preview.id = 'shoe3dStorageMediaPreview';
        preview.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
        box.appendChild(preview);
      }
      preview.classList.remove('hidden');
      preview.replaceChildren();
      const path = media.toLowerCase().split('?')[0];
      if (/\.(mp4|webm|mov)$/.test(path)) {
        const v = document.createElement('video');
        v.src = media; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.controls = true;
        v.style.cssText = 'width:100%;height:100%;object-fit:contain';
        preview.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = media; img.alt = model.title;
        img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;display:block';
        preview.appendChild(img);
      }
      shoe3dIframe.classList.add('hidden');
      shoe3dIframe.removeAttribute('src');
      return;
    }

    if (preview) { preview.classList.add('hidden'); preview.replaceChildren(); }
    shoe3dIframe.classList.remove('hidden');
    if (embed && screen3dVisible) {
      if (shoe3dIframe.getAttribute('src') !== embed) shoe3dIframe.src = embed;
    } else if (!embed) {
      shoe3dIframe.removeAttribute('src');
    }
  }

  function buildShoe3dDots() {
    if (!shoe3dDots) return;
    shoe3dDots.replaceChildren();
    models3d.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'screen-3d-dot' + (idx === current3d ? ' active' : '');
      dot.setAttribute('aria-label', 'Ver modelo 3D ' + (idx + 1));
      dot.addEventListener('click', () => render3dModel(idx));
      shoe3dDots.appendChild(dot);
    });
  }

  function render3dModel(index) {
    if (!models3d.length) return;
    const total = models3d.length;
    current3d = ((index % total) + total) % total;
    const model = models3d[current3d];

    if (shoe3dTitle) shoe3dTitle.textContent = model.title;
    if (shoe3dCategory) shoe3dCategory.textContent = model.category;
    if (shoe3dCounter) shoe3dCounter.textContent = String(current3d + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    update3dMedia(model);

    if (shoe3dDots) {
      shoe3dDots.querySelectorAll('.screen-3d-dot').forEach((dot, i) => dot.classList.toggle('active', i === current3d));
    }
  }

  async function loadModels3d() {
    if (!sb) return;
    try {
      const { data, error } = await sb
        .from(SUPABASE_3D_TABLE)
        .select('id,sort_order,title,category,embed_url,media_url,is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !Array.isArray(data) || !data.length) return;

      models3d = data.map((row, i) => ({
        title: (row.title || '').trim() || 'Modelo Calzado 3D #' + String(i + 1).padStart(2, '0'),
        category: (row.category || '').trim() || 'CALZADO 3D · OUTVOSS',
        embedUrl: (row.embed_url || '').trim(),
        mediaUrl: (row.media_url || '').trim()
      }));
      buildShoe3dDots();
      render3dModel(0);
    } catch (e) { /* se mantiene el arreglo local */ }
  }

  const prevBtn = $('prev3dShoeBtn');
  const nextBtn = $('next3dShoeBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => render3dModel(current3d - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => render3dModel(current3d + 1));

  buildShoe3dDots();
  render3dModel(0);

  const screen3d = $('outvoss3dStageScreen');
  if (screen3d && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        screen3dVisible = true;
        render3dModel(current3d);
        obs.disconnect();
      }
    }, { rootMargin: '600px 0px' }).observe(screen3d);
  } else {
    screen3dVisible = true;
    render3dModel(current3d);
  }
  loadModels3d();

  /* =========================================================
     HALO LUMINOSO: pulso suave según el scroll
  ========================================================== */
  const stageHaloPairs = [
    ['scrollyOutvoss', 'haloOutvoss'],
    ['scrollyOutvossParte2', 'haloOutvossParte2'],
    ['scrollyOutvossParte3', 'haloOutvossParte3'],
    ['scrollyOutvossParte4', 'haloOutvossParte4']
  ].map(([s, h]) => [$(s), $(h)]).filter(([s, h]) => s && h);

  let scrollTicking = false;
  function updateScrollProgress() {
    scrollTicking = false;
    if (reduceMotion) return;
    stageHaloPairs.forEach(([stage, halo]) => {
      const rect = stage.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const distance = Math.max(stage.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top, 0), distance) / distance;
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.04;
      halo.style.transform = 'translateY(-50%) scale(' + scale.toFixed(3) + ')';
    });
  }
  function onScroll() {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateScrollProgress); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScrollProgress();

  /* =========================================================
     PORTAFOLIO: filtro y categorías desde Supabase
  ========================================================== */
  const pills = document.querySelectorAll('#categoryPills .pill');
  const catalogGrid = $('catalogGrid');
  const GROUP_LABEL = { superiores: 'SUPERIORES', inferiores: 'PANTALONES', exteriores: 'EXTERIORES', complementos: 'COMPLEMENTOS' };
  let activeFilter = 'todos';

  function applyCatalogFilter() {
    if (!catalogGrid) return;
    catalogGrid.querySelectorAll('.catalog-card').forEach((card) => {
      const show = activeFilter === 'todos' || card.getAttribute('data-group') === activeFilter;
      card.classList.toggle('hidden', !show);
    });
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-cat') || 'todos';
      applyCatalogFilter();
    });
  });

  async function loadCategories() {
    if (!sb || !catalogGrid) return;
    try {
      const { data, error } = await sb
        .from('catalog_categories')
        .select('slug,name,group_key,description,image_url,sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error || !Array.isArray(data) || !data.length) return; // se conservan las tarjetas del HTML

      catalogGrid.replaceChildren();
      data.forEach((cat, i) => {
        const card = document.createElement('a');
        card.className = 'catalog-card';
        card.style.cssText = 'display:block;text-decoration:none;color:inherit';
        card.href = 'catalogo.html?cat=' + encodeURIComponent(cat.slug);
        card.setAttribute('data-group', cat.group_key);

        const tag = document.createElement('span');
        tag.className = 'service-tag';
        tag.textContent = String(i + 1).padStart(2, '0') + ' · ' + (GROUP_LABEL[cat.group_key] || String(cat.group_key).toUpperCase());
        if (isHttps(cat.image_url)) {
          const img = document.createElement('img');
          img.className = 'cat-img';
          img.style.cssText = 'display:block;width:100%;height:76px;object-fit:cover;border-radius:4px;margin-bottom:8px';
          img.src = cat.image_url;
          img.alt = cat.name;
          img.loading = 'lazy';
          card.appendChild(img);
        }
        const title = document.createElement('h3');
        title.textContent = String(cat.name).toUpperCase();
        const text = document.createElement('p');
        text.textContent = cat.description || '';

        card.append(tag, title, text);
        catalogGrid.appendChild(card);
      });

      const allPill = document.querySelector('#categoryPills .pill[data-cat="todos"]');
      if (allPill) allPill.textContent = 'Todo (' + data.length + ')';
      applyCatalogFilter();
    } catch (e) { /* se conservan las tarjetas del HTML */ }
  }

  /* =========================================================
     MODAL DE ASESORÍA Y CATÁLOGO -> Supabase (RPC submit_catalog_request)
  ========================================================== */
  const modal = $('outvossModal');
  const form = $('outvossForm');
  const success = $('outvossSuccess');
  const confirmText = $('outvossConfirmText');
  const formError = $('outvossErr');

  function openModal() {
    if (!modal) return;
    success.style.display = 'none';
    form.style.display = 'flex';
    formError.textContent = '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const first = $('outvossClientName');
    if (first) setTimeout(() => first.focus(), 60);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-outvoss-modal], #headerActionBtn').forEach((btn) => btn.addEventListener('click', openModal));
  const closeBtn = $('closeOutvossModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeModal();
    const dlg = $('legalDialog');
    if (dlg && dlg.open) dlg.close();
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('outvossClientName').value.trim();
      const contact = $('outvossClientContact').value.trim();
      const category = $('outvossCategorySelect').value;
      const submit = form.querySelector('button[type="submit"]');

      if (!sb) { formError.textContent = 'No hay conexión con el servidor. Intenta de nuevo en un momento.'; return; }
      formError.textContent = '';
      submit.disabled = true;
      const { error } = await sb.rpc('submit_catalog_request', { p_name: name, p_contact: contact, p_category: category });
      submit.disabled = false;

      if (error) { formError.textContent = error.message; return; }
      form.style.display = 'none';
      success.style.display = 'block';
      confirmText.textContent = name + ', recibimos tu solicitud sobre "' + category + '". Un asesor de OUTVOSS te escribirá pronto a ' + contact + '.';
      form.reset();
    });
  }

  /* =========================================================
     FOOTER: año, contacto y páginas legales (desde Supabase)
  ========================================================== */
  const year = $('footerYear');
  if (year) year.textContent = new Date().getFullYear();

  const legalDialog = $('legalDialog');
  const legalClose = $('legalClose');
  if (legalClose && legalDialog) legalClose.addEventListener('click', () => legalDialog.close());
  if (legalDialog) legalDialog.addEventListener('click', (e) => { if (e.target === legalDialog) legalDialog.close(); });

  const STAGE_BACKGROUNDS = {
    fondo_inicio: 'scrollyOutvoss',
    fondo_portafolio: 'scrollyOutvossParte2',
    fondo_identidad: 'scrollyOutvossParte3',
    fondo_canales: 'scrollyOutvossParte4'
  };

  const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;
  const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i;
  const isVideoMedia = (m) => VIDEO_EXT.test(m.url || '') || (!IMAGE_EXT.test(m.url || '') && m.media_type === 'video');

  /* Logo en el encabezado y en el pie (reemplaza el emblema por la imagen subida) */
  function setBrandLogo(selector, url) {
    const crest = document.querySelector(selector);
    if (!crest || !isHttps(url)) return;
    if (!crest._orig) crest._orig = Array.from(crest.childNodes);
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'OUTVOSS';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:50%;display:block';
    img.addEventListener('error', () => crest.replaceChildren(...crest._orig));
    crest.replaceChildren(img);
  }

  function setStageBackground(stageId, m) {
    const stage = $(stageId);
    const layer = stage && stage.querySelector('.sticky-viewport');
    if (!layer || !isHttps(m.url)) return;
    const old = layer.querySelector('.bg-media');
    if (old) old.remove();
    let el;
    if (isVideoMedia(m)) {
      el = document.createElement('video');
      el.src = m.url; el.autoplay = true; el.loop = true; el.muted = true; el.playsInline = true; el.preload = 'metadata';
      el.setAttribute('muted', '');
      el.addEventListener('error', () => el.remove());
    } else {
      el = document.createElement('img');
      el.src = m.url; el.alt = ''; el.loading = 'lazy';
      el.addEventListener('error', () => el.remove());
    }
    el.className = 'bg-media';
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0';
    layer.prepend(el);
  }

  async function loadSiteContent() {
    if (!sb) return;
    try {
      const [settings, media, legal] = await Promise.all([
        sb.from('site_settings').select('value').eq('key', 'general').maybeSingle(),
        sb.from('site_media').select('*').eq('page', 'inicio'),
        sb.from('legal_pages').select('title,body').order('sort_order')
      ]);

      const cfg = settings.data && settings.data.value;
      if (cfg) {
        if (cfg.contact_email && $('fMail')) $('fMail').textContent = cfg.contact_email;
        if (cfg.whatsapp && $('fWa')) $('fWa').textContent = 'WhatsApp ' + cfg.whatsapp;
      }

      (media.data || []).forEach((m) => {
        if (m.section_key === 'logo') {
          setLoaderLogo(m.url);
        } else if (m.section_key === 'logo_encabezado') {
          setBrandLogo('.site-header .brand-crest', m.url);
        } else if (m.section_key === 'logo_pie') {
          setBrandLogo('.site-footer .brand-crest', m.url);
        } else if (STAGE_BACKGROUNDS[m.section_key]) {
          setStageBackground(STAGE_BACKGROUNDS[m.section_key], m);
        } else if (m.section_key === 'hero') {
          if (m.eyebrow && $('heroEyebrow')) $('heroEyebrow').textContent = m.eyebrow;
          if (m.title && $('heroTitle')) $('heroTitle').textContent = m.title;
          if (m.subtitle && $('heroSubtitle')) $('heroSubtitle').textContent = m.subtitle;
          setVideoSource($('heroMp4Player'), m.url);
        } else if (m.section_key === 'maniqui') {
          setVideoSource($('mannequinVideo'), m.url);
        }
      });

      const box = $('legalBtns');
      if (box && legalDialog) {
        box.replaceChildren();
        (legal.data || []).forEach((pg) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn-neu';
          b.textContent = pg.title;
          b.addEventListener('click', () => {
            $('legalTitle').textContent = pg.title;
            $('legalBody').textContent = pg.body;
            legalDialog.showModal();
          });
          box.appendChild(b);
        });
      }
    } catch (e) { /* el sitio sigue con el contenido por defecto */ }
  }

  const navToggle = $('navToggle');
  const mainNav = $('navOutvoss');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.textContent = open ? '✕' : '☰';
    });
    mainNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) { mainNav.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.textContent = '☰'; }
    });
  }

  loadCategories();
  loadSiteContent();
})();
