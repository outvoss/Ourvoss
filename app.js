// Pantalla de entrada inicial (Preloader con arco luminoso)
const outvossIntroLoader = document.getElementById('outvossIntroLoader');
const loaderLogoImg = document.getElementById('loaderLogoImg');
const loaderLogoPlaceholder = document.getElementById('loaderLogoPlaceholder');

if (loaderLogoImg && loaderLogoPlaceholder) {
  const logoSrc = (loaderLogoImg.getAttribute('src') || '').trim();
  if (logoSrc) {
    loaderLogoImg.classList.remove('hidden');
    loaderLogoPlaceholder.classList.add('hidden');
  }
  loaderLogoImg.addEventListener('error', () => {
    loaderLogoImg.classList.add('hidden');
    loaderLogoPlaceholder.classList.remove('hidden');
  });
}

if (outvossIntroLoader) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      outvossIntroLoader.classList.add('is-dismissed');
    }, 3200);
  });
}

// Elementos de cambio de vista (OUTVOSS vs PELUQUERÍA)
const viewOutvoss = document.getElementById('viewOutvoss');
const viewBarber = document.getElementById('viewBarber');
const navOutvoss = document.getElementById('navOutvoss');
const navBarber = document.getElementById('navBarber');
const toggleBarberBtn = document.getElementById('toggleBarberBtn');
const toggleBarberLabel = document.getElementById('toggleBarberLabel');

// Escenarios de Scrollytelling (4 partes independientes de OUTVOSS + Peluquería)
const scrollyOutvoss = document.getElementById('scrollyOutvoss');
const scrollyOutvossParte2 = document.getElementById('scrollyOutvossParte2');
const scrollyOutvossParte3 = document.getElementById('scrollyOutvossParte3');
const scrollyOutvossParte4 = document.getElementById('scrollyOutvossParte4');
const outvossStages = [scrollyOutvoss, scrollyOutvossParte2, scrollyOutvossParte3, scrollyOutvossParte4].filter(Boolean);

const scrollyBarber = document.getElementById('scrollyBarber');
const outvossPanels = document.querySelectorAll('[data-outvoss-scene]');
const barberPanels = document.querySelectorAll('[data-barber-scene]');
const haloOutvoss = document.getElementById('haloOutvoss');
const haloOutvossParte2 = document.getElementById('haloOutvossParte2');
const haloOutvossParte3 = document.getElementById('haloOutvossParte3');
const haloOutvossParte4 = document.getElementById('haloOutvossParte4');
const outvossHalos = [haloOutvoss, haloOutvossParte2, haloOutvossParte3, haloOutvossParte4].filter(Boolean);
const haloBarber = document.getElementById('haloBarber');

let currentView = 'outvoss';

// Función para alternar entre Tienda OUTVOSS y Servicio de Peluquería
function switchView(targetView) {
  currentView = targetView;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetView === 'barber') {
    viewOutvoss.classList.add('hidden');
    viewOutvoss.classList.remove('active');
    viewBarber.classList.remove('hidden');
    viewBarber.classList.add('active');

    navOutvoss.classList.add('hidden');
    navBarber.classList.remove('hidden');

    toggleBarberBtn.classList.add('is-barber-active');
    toggleBarberLabel.textContent = '← Tienda OUTVOSS';
  } else {
    viewBarber.classList.add('hidden');
    viewBarber.classList.remove('active');
    viewOutvoss.classList.remove('hidden');
    viewOutvoss.classList.add('active');

    navBarber.classList.add('hidden');
    navOutvoss.classList.remove('hidden');

    toggleBarberBtn.classList.remove('is-barber-active');
    toggleBarberLabel.textContent = 'Peluquería';
  }

  updateScrollProgress();
}

toggleBarberBtn.addEventListener('click', () => {
  switchView(currentView === 'outvoss' ? 'barber' : 'outvoss');
});

document.querySelectorAll('[data-switch-view]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const target = el.getAttribute('data-switch-view');
    if (target && target !== currentView) {
      e.preventDefault();
      switchView(target);
    }
  });
});

// Control de Fallback de los videos dentro del círculo
function setupVideoFallback(videoId, fallbackId) {
  const videoEl = document.getElementById(videoId);
  const fallbackEl = document.getElementById(fallbackId);
  if (!videoEl || !fallbackEl) return;

  videoEl.addEventListener('loadeddata', () => {
    fallbackEl.classList.add('hidden');
  });

  videoEl.addEventListener('error', () => {
    fallbackEl.classList.remove('hidden');
  });
}

setupVideoFallback('mannequinVideo', 'mannequinFallback');
setupVideoFallback('barberVideo', 'barberFallback');

// Reproductor MP4 por enlace directo en la portada principal OUTVOSS
const heroMp4Player = document.getElementById('heroMp4Player');
const heroMp4Fallback = document.getElementById('heroMp4Fallback');
const heroMp4UrlInput = document.getElementById('heroMp4UrlInput');
const loadHeroMp4Btn = document.getElementById('loadHeroMp4Btn');
const heroMp4Status = document.getElementById('heroMp4Status');

function loadHeroMp4ByUrl(rawUrl) {
  if (!heroMp4Player) return;
  const cleanUrl = (rawUrl || '').trim();

  if (!cleanUrl) {
    heroMp4Player.removeAttribute('src');
    heroMp4Player.load();
    if (heroMp4Fallback) heroMp4Fallback.classList.remove('hidden');
    if (heroMp4Status) heroMp4Status.textContent = 'Pega un enlace directo .mp4 para reproducir';
    return;
  }

  if (heroMp4Status) heroMp4Status.textContent = 'Cargando video MP4...';
  heroMp4Player.src = cleanUrl;
  heroMp4Player.load();
  const playPromise = heroMp4Player.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      if (heroMp4Status) heroMp4Status.textContent = 'Video listo (toca o desplaza para iniciar)';
    });
  }
}

if (heroMp4Player) {
  heroMp4Player.addEventListener('loadeddata', () => {
    if (heroMp4Fallback) heroMp4Fallback.classList.add('hidden');
    if (heroMp4Status) heroMp4Status.textContent = 'Reproduciendo enlace MP4 en bucle';
  });

  heroMp4Player.addEventListener('error', () => {
    if (!heroMp4Player.getAttribute('src')) return;
    if (heroMp4Fallback) heroMp4Fallback.classList.remove('hidden');
    if (heroMp4Status) heroMp4Status.textContent = 'No se pudo reproducir el enlace (verifica que sea un .mp4 directo con acceso público)';
  });
}

if (loadHeroMp4Btn && heroMp4UrlInput) {
  loadHeroMp4Btn.addEventListener('click', () => {
    loadHeroMp4ByUrl(heroMp4UrlInput.value);
  });

  heroMp4UrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadHeroMp4ByUrl(heroMp4UrlInput.value);
    }
  });
}

// Si ya pusiste un src fijo en el HTML, lo cargamos al inicio
if (heroMp4Player && heroMp4Player.getAttribute('src')) {
  loadHeroMp4ByUrl(heroMp4Player.getAttribute('src'));
}

// =========================================================
// PANTALLA DE MODELOS 3D DE CALZADO / ZAPATILLAS (TRAS SECCIÓN 2)
// =========================================================
const SUPABASE_URL = 'https://vpncwfbinzmvsplsjubf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cUU3BIEnmhEXbp6XzQdDLA__0uaGHQW';
const SUPABASE_3D_TABLE = 'outvoss_3d_zapatillas';

const shoe3dIframe = document.getElementById('shoe3dIframe');
const shoe3dTitle = document.getElementById('shoe3dTitle');
const shoe3dCategory = document.getElementById('shoe3dCategory');
const shoe3dCounter = document.getElementById('shoe3dCounter');
const shoe3dDots = document.getElementById('shoe3dDots');
const prev3dShoeBtn = document.getElementById('prev3dShoeBtn');
const next3dShoeBtn = document.getElementById('next3dShoeBtn');

let OUTVOSS_3D_MODELS = Array.from({ length: 18 }, (_, index) => ({
  title: `Modelo Calzado 3D #${String(index + 1).padStart(2, '0')}`,
  category: 'CALZADO 3D · OUTVOSS',
  embedUrl: '',
  mediaUrl: ''
}));

let current3dShoeIndex = 0;

function updateShoe3dMediaLayer(model) {
  if (!shoe3dIframe) return;
  const viewerBox = shoe3dIframe.parentElement;
  if (!viewerBox) return;

  let mediaPreviewEl = document.getElementById('shoe3dStorageMediaPreview');
  const cleanMediaUrl = (model.mediaUrl || '').trim();
  const cleanEmbedUrl = (model.embedUrl || '').trim();

  if (cleanMediaUrl && !cleanEmbedUrl) {
    if (!mediaPreviewEl) {
      mediaPreviewEl = document.createElement('div');
      mediaPreviewEl.id = 'shoe3dStorageMediaPreview';
      mediaPreviewEl.style.width = '100%';
      mediaPreviewEl.style.height = '100%';
      mediaPreviewEl.style.display = 'flex';
      mediaPreviewEl.style.alignItems = 'center';
      mediaPreviewEl.style.justifyContent = 'center';
      viewerBox.appendChild(mediaPreviewEl);
    }

    const lowerUrl = cleanMediaUrl.toLowerCase();
    if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov')) {
      mediaPreviewEl.innerHTML = `<video src="${cleanMediaUrl}" autoplay loop muted playsinline controls style="width:100%;height:100%;object-fit:contain;"></video>`;
    } else {
      mediaPreviewEl.innerHTML = `<img src="${cleanMediaUrl}" alt="${model.title}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />`;
    }

    shoe3dIframe.classList.add('hidden');
    shoe3dIframe.removeAttribute('src');
    mediaPreviewEl.classList.remove('hidden');
  } else {
    if (mediaPreviewEl) {
      mediaPreviewEl.classList.add('hidden');
      mediaPreviewEl.innerHTML = '';
    }
    shoe3dIframe.classList.remove('hidden');
    if (cleanEmbedUrl) {
      if (shoe3dIframe.src !== cleanEmbedUrl) {
        shoe3dIframe.src = cleanEmbedUrl;
      }
    } else {
      shoe3dIframe.removeAttribute('src');
    }
  }
}

function buildShoe3dDots() {
  if (!shoe3dDots) return;
  shoe3dDots.innerHTML = '';
  OUTVOSS_3D_MODELS.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `screen-3d-dot${idx === current3dShoeIndex ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Ver modelo 3D ${idx + 1}`);
    dot.addEventListener('click', () => render3dShoeModel(idx));
    shoe3dDots.appendChild(dot);
  });
}

function render3dShoeModel(index) {
  if (!OUTVOSS_3D_MODELS.length) return;
  const total = OUTVOSS_3D_MODELS.length;
  current3dShoeIndex = ((index % total) + total) % total;
  const model = OUTVOSS_3D_MODELS[current3dShoeIndex];

  if (shoe3dTitle) shoe3dTitle.textContent = model.title;
  if (shoe3dCategory) shoe3dCategory.textContent = model.category;
  if (shoe3dCounter) {
    shoe3dCounter.textContent = `${String(current3dShoeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }

  updateShoe3dMediaLayer(model);

  if (shoe3dDots) {
    const dotButtons = shoe3dDots.querySelectorAll('.screen-3d-dot');
    dotButtons.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === current3dShoeIndex);
    });
  }
}

async function loadOutvoss3dModelsFromSupabase() {
  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_3D_TABLE}?is_active=eq.true&select=id,sort_order,title,category,embed_url,media_url,is_active&order=sort_order.asc,created_at.asc`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      }
    });

    if (!response.ok) return;
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return;

    OUTVOSS_3D_MODELS = rows.map((row, index) => ({
      title: (row.title || '').trim() || `Modelo Calzado 3D #${String(index + 1).padStart(2, '0')}`,
      category: (row.category || '').trim() || 'CALZADO 3D · OUTVOSS',
      embedUrl: (row.embed_url || '').trim(),
      mediaUrl: (row.media_url || '').trim()
    }));

    buildShoe3dDots();
    render3dShoeModel(0);
  } catch (err) {
    // Mantiene el arreglo de respaldo local sin interrumpir la experiencia
  }
}

if (prev3dShoeBtn) {
  prev3dShoeBtn.addEventListener('click', () => render3dShoeModel(current3dShoeIndex - 1));
}

if (next3dShoeBtn) {
  next3dShoeBtn.addEventListener('click', () => render3dShoeModel(current3dShoeIndex + 1));
}

buildShoe3dDots();
render3dShoeModel(0);
loadOutvoss3dModelsFromSupabase();

// Sincronización de Scroll con los paneles y el pulso del Halo Circular
function updateScrollProgress() {
  if (currentView === 'outvoss') {
    outvossPanels.forEach((panel) => {
      panel.classList.add('active');
    });

    outvossStages.forEach((stage, idx) => {
      const rect = stage.getBoundingClientRect();
      const scrollableDistance = Math.max(stage.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
      const progress = scrolled / scrollableDistance;
      const halo = outvossHalos[idx];

      if (halo) {
        const haloScale = 1 + Math.sin(progress * Math.PI * 2) * 0.04;
        halo.style.transform = `translateY(-50%) scale(${haloScale.toFixed(3)})`;
      }
    });
    return;
  }

  const activeStage = scrollyBarber;
  const activePanels = barberPanels;
  const activeHalo = haloBarber;

  if (!activeStage) return;

  const rect = activeStage.getBoundingClientRect();
  const scrollableDistance = activeStage.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
  const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

  const activeScene = Math.min(3, Math.floor(progress * 3.99));
  activePanels.forEach((panel, idx) => {
    panel.classList.toggle('active', idx === activeScene);
  });

  if (activeHalo) {
    const haloScale = 1 + Math.sin(progress * Math.PI * 2) * 0.04;
    activeHalo.style.transform = `translateY(-50%) scale(${haloScale.toFixed(3)})`;
  }
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// Filtro interactivo de categorías del portafolio OUTVOSS
const pills = document.querySelectorAll('#categoryPills .pill');
const catalogCards = document.querySelectorAll('#catalogGrid .catalog-card');

pills.forEach((pill) => {
  pill.addEventListener('click', () => {
    pills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    const filter = pill.getAttribute('data-cat');
    catalogCards.forEach((card) => {
      if (filter === 'todos' || card.getAttribute('data-group') === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// Modal 1: Asesoría y Catálogo OUTVOSS
const outvossModal = document.getElementById('outvossModal');
const outvossForm = document.getElementById('outvossForm');
const outvossSuccess = document.getElementById('outvossSuccess');
const outvossConfirmText = document.getElementById('outvossConfirmText');

document.querySelectorAll('[data-open-outvoss-modal], #headerActionBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    outvossSuccess.style.display = 'none';
    outvossForm.style.display = 'flex';
    outvossModal.classList.add('open');
    outvossModal.setAttribute('aria-hidden', 'false');
  });
});

document.getElementById('closeOutvossModalBtn').addEventListener('click', () => {
  outvossModal.classList.remove('open');
  outvossModal.setAttribute('aria-hidden', 'true');
});

outvossModal.addEventListener('click', (e) => {
  if (e.target === outvossModal) {
    outvossModal.classList.remove('open');
    outvossModal.setAttribute('aria-hidden', 'true');
  }
});

outvossForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('outvossCategorySelect').value;
  const name = document.getElementById('outvossClientName').value.trim();
  const contact = document.getElementById('outvossClientContact').value.trim();

  outvossForm.style.display = 'none';
  outvossSuccess.style.display = 'block';
  outvossConfirmText.textContent = `${name}, hemos recibido tu solicitud sobre "${category}". Un asesor de OUTVOSS te escribirá pronto a ${contact}.`;
});

// Modal 2: Reserva de Peluquería (Conservado íntegro)
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingConfirmText = document.getElementById('bookingConfirmText');

document.querySelectorAll('[data-open-booking]').forEach((btn) => {
  btn.addEventListener('click', () => {
    bookingSuccess.style.display = 'none';
    bookingForm.style.display = 'flex';
    bookingModal.classList.add('open');
    bookingModal.setAttribute('aria-hidden', 'false');
  });
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
  bookingModal.classList.remove('open');
  bookingModal.setAttribute('aria-hidden', 'true');
});

bookingModal.addEventListener('click', (e) => {
  if (e.target === bookingModal) {
    bookingModal.classList.remove('open');
    bookingModal.setAttribute('aria-hidden', 'true');
  }
});

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const service = document.getElementById('serviceSelect').value;
  const name = document.getElementById('clientName').value.trim();
  const time = document.getElementById('clientTime').value;

  bookingForm.style.display = 'none';
  bookingSuccess.style.display = 'block';
  bookingConfirmText.textContent = `${name}, tu cita de ${service} está confirmada para las ${time}.`;
});

updateScrollProgress();
