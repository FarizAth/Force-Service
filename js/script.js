/* Force Service - Demolition & Installation | Interactive Application Logic */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initBeforeAfterSliders();
  initLanguageToggle();
  initCostEstimator();
  initMobileMenu();
  initSmoothScroll();
  initHeroCanvasScroll();
});

/* Hero Background Frame Sequence Canvas Animation on Scroll */
function initHeroCanvasScroll() {
  const canvas = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero-section');
  const step1 = document.getElementById('hero-step-1');
  const step2 = document.getElementById('hero-step-2');
  const step3 = document.getElementById('hero-step-3');
  if (!canvas || !heroSection || !step1 || !step2 || !step3) return;

  const ctx = canvas.getContext('2d');
  const frameCount = 121;
  const images = [];
  let currentFrameIndex = 0;
  let ticking = false;

  // Format frame path: src/frames/ezgif-frame-001.jpg
  const getFramePath = (index) => {
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `src/frames/ezgif-frame-${paddedIndex}.jpg`;
  };

  // Preload all 121 images for instant lag-free scrubbing
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    images.push(img);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(currentFrameIndex);
  }

  // Race-safe: checks `.complete` itself, and guards against a slow
  // image finishing AFTER the user has scrolled past it (only paints
  // if it's still the frame that should currently be showing).
  function renderFrame(index) {
    const img = images[index];
    if (!img) return;

    if (!img.complete || img.naturalWidth === 0) {
      img.onload = () => {
        if (index === currentFrameIndex) renderFrame(index);
      };
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect ratio 'cover' fit
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let renderW, renderH, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderW = canvas.width;
      renderH = canvas.width / imgRatio;
      offsetX = 0;
      offsetY = (canvas.height - renderH) / 2;
    } else {
      renderW = canvas.height * imgRatio;
      renderH = canvas.height;
      offsetX = (canvas.width - renderW) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  // Only ever touches `opacity` + `pointer-events` inline — this is the
  // single source of truth at runtime, so there's nothing for a CSS
  // transition/animation class to race against or lag behind.
  function setCardState(el, opacity) {
    el.style.opacity = opacity;
    el.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
  }

  /* Sync Hero Story Beats on Scroll */
  function updateStoryBeats(progress) {
    // Phase 1: Main Brand & Logo Card (100% visible on load; fades out past 25%)
    if (progress <= 0.25) {
      const alpha = Math.max(0, 1 - (progress / 0.20));
      setCardState(step1, alpha);
      setCardState(step2, 0);
      setCardState(step3, 0);
    }
    // Phase 2: Core Value Message (25% to 65% scroll progress)
    else if (progress <= 0.65) {
      setCardState(step1, 0);
      let alpha = 1;
      if (progress < 0.35) alpha = (progress - 0.25) / 0.10;
      else if (progress > 0.55) alpha = 1 - ((progress - 0.55) / 0.10);
      setCardState(step2, alpha);
      setCardState(step3, 0);
    }
    // Phase 3: Call to Action (65% to 100% scroll progress)
    else {
      setCardState(step1, 0);
      setCardState(step2, 0);
      const alpha = Math.min(1, (progress - 0.65) / 0.12);
      setCardState(step3, alpha);
    }
  }

  // Single per-frame update, always run inside requestAnimationFrame so
  // canvas paint and story-card opacity change land in the same frame —
  // they can never visibly drift apart.
  function update() {
    ticking = false;

    const heroRect = heroSection.getBoundingClientRect();
    const scrollableHeight = heroSection.offsetHeight - window.innerHeight;

    if (scrollableHeight <= 0) return;

    let progress = -heroRect.top / scrollableHeight;
    progress = Math.max(0, Math.min(1, progress));

    const frameIndex = Math.min(
      frameCount - 1,
      Math.floor(progress * (frameCount - 1))
    );

    if (frameIndex !== currentFrameIndex) {
      currentFrameIndex = frameIndex;
      renderFrame(currentFrameIndex);
    }

    updateStoryBeats(progress);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function onResize() {
    resizeCanvas();
    update();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  resizeCanvas();
  update();
}

/* Custom Glowing Cursor */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });

  const interactiveElements = document.querySelectorAll('a, button, input, select, .playable-card, .ba-slider-container');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
  });
}

/* Before / After Slider Logic */
function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('.ba-slider-container');

  sliders.forEach(slider => {
    const wrapper = slider.querySelector('.ba-before-wrapper');
    const beforeImg = wrapper ? wrapper.querySelector('img') : null;
    const handle = slider.querySelector('.ba-handle');
    if (!wrapper || !beforeImg || !handle) return;

    let isDragging = false;

    function setSliderWidth(x) {
      const rect = slider.getBoundingClientRect();
      let offsetX = x - rect.left;
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      wrapper.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
      beforeImg.style.width = `${rect.width}px`;
    }

    function syncWidth() {
      const rect = slider.getBoundingClientRect();
      beforeImg.style.width = `${rect.width}px`;
    }
    syncWidth();
    window.addEventListener('resize', syncWidth);

    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setSliderWidth(clientX);
    };

    const startDrag = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setSliderWidth(clientX);
    };

    const stopDrag = () => { isDragging = false; };

    slider.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);

    slider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
  });
}

/* Language Toggle Logic (EN <-> ES) */
const translations = {
  es: {
    "nav-home": "Inicio",
    "nav-about": "Nosotros",
    "nav-services": "Servicios",
    "nav-contact": "Contacto",
    "nav-quote": "Cotización Rápida",
    "hero-badge": "Demolición Industrial y Preparación de Pisos en Orlando, FL",
    "hero-title": "Retiramos lo Viejo. Preparamos para lo Nuevo.",
    "hero-sub": "Expertos en demolición de pisos con maquinaria industrial de raspado continuo. Eliminación de baldosa, cerámica, madera dura, LVP pegado, alfombra y residuos de adhesivo en Florida Central.",
    "cta-call": "Llamar / WhatsApp (407) 914-4199",
    "cta-estimate": "Calculadora de Costos",
    "stat-1-title": "100% Recomendado",
    "stat-1-desc": "Basado en reseñas reales",
    "stat-2-title": "Equipo Pesado",
    "stat-2-desc": "Raspadores de piso de alta velocidad",
    "stat-3-title": "Cero Polvo Excesivo",
    "stat-3-desc": "Preparación lista para la instalación",
    "ba-title": "Resultados Reales de Demolición",
    "ba-subtitle": "Desliza la barra para ver la transformación exacta del piso antes y después del trabajo de Force Service.",
    "calc-title": "Calculadora Instantánea de Demolición",
    "calc-subtitle": "Obtén un estimado rápido según el tipo de piso y los pies cuadrados de tu proyecto.",
    "calc-sqft": "Metraje Cuadrado Estimado (sq ft):",
    "calc-type": "Tipo de Piso a Retirar:",
    "calc-result-label": "Estimado Aproximado:",
    "calc-btn": "Enviar Solicitud por WhatsApp",
    "footer-rights": "Todos los derechos reservados. Force Service - Demolición e Instalación."
  },
  en: {
    "nav-home": "Home",
    "nav-about": "About Us",
    "nav-services": "Services",
    "nav-contact": "Contact",
    "nav-quote": "Instant Quote",
    "hero-badge": "Orlando's Premier Floor Demolition & Preparation",
    "hero-title": "We Remove The Old, Prepare For The New.",
    "hero-sub": "Orlando floor demolition specialists operating heavy-duty ride-on scraper machines. Tile, porcelain, hardwood, glued LVP, carpet, and thinset adhesive removal across Central Florida.",
    "cta-call": "Call / WhatsApp (407) 914-4199",
    "cta-estimate": "Cost Calculator",
    "stat-1-title": "100% Recommended",
    "stat-1-desc": "Verified Client Rating",
    "stat-2-title": "Ride-On Scraper",
    "stat-2-desc": "Heavy Machinery Efficiency",
    "stat-3-title": "Flawless Subfloors",
    "stat-3-desc": "Installation-Ready Clean",
    "ba-title": "Proven Demolition Transformations",
    "ba-subtitle": "Drag the slider to examine how we clear ruined floors and restore concrete subfloors to perfection.",
    "calc-title": "Instant Floor Removal Estimator",
    "calc-subtitle": "Get a ballpark quote in seconds based on your project size and existing surface.",
    "calc-sqft": "Estimated Square Footage (sq ft):",
    "calc-type": "Select Flooring Type:",
    "calc-result-label": "Estimated Investment Range:",
    "calc-btn": "Dispatch Quote to WhatsApp",
    "footer-rights": "All rights reserved. Force Service - Demolition & Installation."
  }
};

let currentLang = 'en';

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'es' : 'en';
  
  const desktopBtn = document.getElementById('lang-toggle-btn');
  const mobileBtn = document.getElementById('lang-toggle-btn-mobile');

  const btnLabel = currentLang === 'en' ? 'ES | Español' : 'EN | English';
  const mobileLabel = currentLang === 'en' ? 'Switch to Español' : 'Switch to English';

  if (desktopBtn) desktopBtn.innerHTML = `<i class="fa-solid fa-globe text-[#F59E0B]"></i> ${btnLabel}`;
  if (mobileBtn) mobileBtn.textContent = mobileLabel;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

function initLanguageToggle() {
  const desktopBtn = document.getElementById('lang-toggle-btn');
  const mobileBtn = document.getElementById('lang-toggle-btn-mobile');

  if (desktopBtn) desktopBtn.addEventListener('click', toggleLanguage);
  if (mobileBtn) mobileBtn.addEventListener('click', toggleLanguage);
}

/* Instant Cost Estimator Logic */
function initCostEstimator() {
  const sqftInput = document.getElementById('calc-sqft-input');
  const sqftDisplay = document.getElementById('calc-sqft-val');
  const floorTypeSelect = document.getElementById('calc-floor-type');
  const resultDisplay = document.getElementById('calc-result-price');
  const sendWhatsAppBtn = document.getElementById('calc-send-wa');

  if (!sqftInput || !floorTypeSelect || !resultDisplay) return;

  function calculate() {
    const sqft = parseInt(sqftInput.value) || 500;
    const rate = parseFloat(floorTypeSelect.value) || 1.85;
    sqftDisplay.textContent = `${sqft} sq ft`;

    const lowEstimate = Math.round(sqft * rate * 0.9);
    const highEstimate = Math.round(sqft * rate * 1.15);

    resultDisplay.textContent = `$${lowEstimate.toLocaleString()} - $${highEstimate.toLocaleString()}`;
  }

  sqftInput.addEventListener('input', calculate);
  floorTypeSelect.addEventListener('change', calculate);
  calculate();

  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', () => {
      const sqft = sqftInput.value;
      const floorText = floorTypeSelect.options[floorTypeSelect.selectedIndex].text;
      const price = resultDisplay.textContent;
      const msg = `Hello Force Service! I need a demo quote. Project size: ${sqft} sq ft. Material: ${floorText}. Calculated estimate: ${price}. Please contact me!`;
      window.open(`https://wa.me/14079144199?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }
}

/* Mobile Menu Drawer */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('hidden');
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });

  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      mobileMenu.classList.add('hidden');
    }
  });
}

/* Smooth Scroll */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}