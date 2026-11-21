// Elementos de cambio de vista (OUTVOSS vs PELUQUERÍA)
const viewOutvoss = document.getElementById('viewOutvoss');
const viewBarber = document.getElementById('viewBarber');
const navOutvoss = document.getElementById('navOutvoss');
const navBarber = document.getElementById('navBarber');
const toggleBarberBtn = document.getElementById('toggleBarberBtn');
const toggleBarberLabel = document.getElementById('toggleBarberLabel');

// Escenarios de Scrollytelling
const scrollyOutvoss = document.getElementById('scrollyOutvoss');
const scrollyBarber = document.getElementById('scrollyBarber');
const outvossPanels = document.querySelectorAll('[data-outvoss-scene]');
const barberPanels = document.querySelectorAll('[data-barber-scene]');
const haloOutvoss = document.getElementById('haloOutvoss');
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


// Sincronización de Scroll con los paneles y el pulso del Halo Circular
function updateScrollProgress() {
  const activeStage = currentView === 'outvoss' ? scrollyOutvoss : scrollyBarber;
  const activePanels = currentView === 'outvoss' ? outvossPanels : barberPanels;
  const activeHalo = currentView === 'outvoss' ? haloOutvoss : haloBarber;

  const rect = activeStage.getBoundingClientRect();
  const scrollableDistance = activeStage.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
  const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

  const activeScene = Math.min(3, Math.floor(progress * 3.99));
  activePanels.forEach((panel, idx) => {
    panel.classList.toggle('active', idx === activeScene);
  });

  const haloScale = 1 + Math.sin(progress * Math.PI * 2) * 0.04;
  activeHalo.style.transform = `translateY(-50%) scale(${haloScale.toFixed(3)})`;
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



