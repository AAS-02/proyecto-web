/**
 * SABOR VIVO - LÓGICA DE INTERACTIVIDAD & GESTIÓN DE RECETAS
 * Portal comunitario abierto (sin ventas ni pasarelas de pago)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFavorites();
  initRecipeModal();
  initCategoryFilter();
  initShareRecipeForm();
  initContactForm();
  initCookieBanner();
  initFloatingFeatures();
});

/* ==========================================================================
   1. NAVEGACIÓN Y MENÚ MÓVIL
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const mobilePanel = document.querySelector('.mobile-nav-panel');
  const closeBtn = document.querySelector('.btn-close-mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  toggleBtn?.addEventListener('click', () => {
    mobilePanel?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  const closeMenu = () => {
    mobilePanel?.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Buscador de recetas
  const searchForm = document.querySelector('.header-search');
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchForm.querySelector('input')?.value.trim().toLowerCase();
    if (query) {
      const cards = document.querySelectorAll('.product-card');
      let matches = 0;

      cards.forEach(card => {
        const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
        if (title.includes(query) || desc.includes(query)) {
          card.style.display = 'flex';
          matches++;
        } else {
          card.style.display = 'none';
        }
      });

      showToast(`Encontradas ${matches} recetas para: "${query}"`);
      const target = document.getElementById('recetas-destacadas');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ==========================================================================
   2. SISTEMA DE FAVORITOS (PERSISTENTE EN LOCALSTORAGE)
   ========================================================================== */
let savedFavorites = JSON.parse(localStorage.getItem('saborvivo_favs') || '[]');

function initFavorites() {
  const toggleBtn = document.querySelector('.btn-favorites-toggle');
  const drawer = document.querySelector('.cart-drawer');
  const backdrop = document.querySelector('.cart-drawer-backdrop');
  const closeBtn = document.querySelector('.btn-close-cart');
  const badge = document.querySelector('.favorites-badge');
  const body = document.querySelector('.cart-items-body');
  const favCardBtns = document.querySelectorAll('.btn-fav-card');

  const openDrawer = () => {
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderFavorites(badge, body);
  };

  const closeDrawer = () => {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Botones de corazón en cada tarjeta de receta
  favCardBtns.forEach(btn => {
    const card = btn.closest('.product-card');
    const title = card?.querySelector('.product-title')?.textContent.trim() || '';

    // Si ya está guardada, marcar botón
    if (savedFavorites.some(f => f.title === title)) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFav = savedFavorites.some(f => f.title === title);

      if (isFav) {
        savedFavorites = savedFavorites.filter(f => f.title !== title);
        btn.classList.remove('active');
        showToast(`Eliminada de favoritos: ${title}`);
      } else {
        savedFavorites.push({
          title,
          time: card?.querySelector('.recipe-meta-row')?.textContent.trim() || '25 min'
        });
        btn.classList.add('active');
        showToast(`¡Guardada en tus favoritos!`);
      }

      localStorage.setItem('saborvivo_favs', JSON.stringify(savedFavorites));
      updateBadge(badge);
    });
  });

  updateBadge(badge);
}

function updateBadge(badge) {
  if (badge) {
    badge.textContent = savedFavorites.length;
  }
}

function renderFavorites(badge, body) {
  updateBadge(badge);
  if (!body) return;

  if (savedFavorites.length === 0) {
    body.innerHTML = '<div class="cart-empty-message">No tienes recetas guardadas aún. Haz clic en el icono de corazón en cualquier receta para guardarla aquí.</div>';
    return;
  }

  body.innerHTML = '';
  savedFavorites.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div>
        <div class="cart-item-title">${item.title}</div>
        <div style="font-size:0.75rem; color:#8c827a;">${item.time}</div>
      </div>
      <button class="cart-item-remove" data-index="${index}" aria-label="Quitar de favoritos">
        Quitar &times;
      </button>
    `;
    body.appendChild(row);
  });

  body.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const removed = savedFavorites.splice(idx, 1)[0];
      localStorage.setItem('saborvivo_favs', JSON.stringify(savedFavorites));
      
      // Actualizar estado visual de los botones de tarjeta
      document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('.product-title')?.textContent.trim();
        if (title === removed?.title) {
          card.querySelector('.btn-fav-card')?.classList.remove('active');
        }
      });

      renderFavorites(badge, body);
      showToast(`Receta quitada de tus favoritos`);
    });
  });
}

/* ==========================================================================
   3. MODAL DE VISUALIZACIÓN DE RECETA COMPLETA
   ========================================================================== */
const recipesDatabase = {
  'Guarniciones y Vegetales Rústicos al Horno': {
    time: '25 minutos',
    servings: '4 porciones',
    difficulty: 'Fácil',
    ingredients: [
      '4 zanahorias cortadas en bastones',
      '3 papas medianas en gajos',
      '2 cucharadas de aceite de oliva virgen extra',
      '1 ramita de romero fresco y tomillo',
      'Sal marina gruesa y pimienta recién molida al gusto',
      '1 cucharadita de miel de abeja o agave'
    ],
    steps: [
      'Precalienta el horno a 200°C (400°F).',
      'En un tazón grande, mezcla los vegetales con el aceite de oliva, hierbas aromáticas, sal y pimienta.',
      'Extiende sobre una bandeja para hornear sin encimar las piezas.',
      'Hornea durante 22 a 25 minutos hasta que los bordes adquieran un tono dorado y textura crujiente.',
      'Sirve caliente como guarnición perfecta para cualquier plato fuerte.'
    ]
  },
  'Cazuela Cremosa de Champiñones y Hierbas': {
    time: '35 minutos',
    servings: '6 porciones',
    difficulty: 'Media',
    ingredients: [
      '500g de champiñones y setas mixtas fileteadas',
      '1 cebolla blanca picada finamente',
      '2 dientes de ajo prensados',
      '1 taza de caldo de vegetales caliente',
      '1/2 taza de crema ligera o leche vegetal de avena',
      'Perejil fresco picado y pizca de nuez moscada'
    ],
    steps: [
      'En una sartén honda, sofríe la cebolla y el ajo con unas gotas de aceite hasta acitronar.',
      'Agrega los champiñones y saltea a fuego medio-alto hasta dorar.',
      'Vierte el caldo de vegetales y reduce a la mitad.',
      'Baja el fuego e incorpora la crema y la nuez moscada. Cocina por 8 minutos a fuego suave.',
      'Espolvorea perejil fresco y disfruta con rebanadas de pan rústico.'
    ]
  },
  'Pozole Verde con Hierbas del Huerto': {
    time: '50 minutos',
    servings: '6 porciones',
    difficulty: 'Media',
    ingredients: [
      '500g de maíz cacahuazintle pre-cocido',
      '2 pechugas de pollo cocidas y deshebradas (o setas para versión vegana)',
      '6 tomatillos verdes cocidos',
      '1 taza de hojas de espinaca, cilantro y epazote',
      '1/4 taza de pepitas de calabaza tostadas',
      'Rábanos, orégano seco y limones para acompañar'
    ],
    steps: [
      'Licúa los tomatillos con las hierbas verdes, pepitas tostadas y un poco de caldo.',
      'En una olla grande hierve el maíz con el caldo restante.',
      'Vierte la salsa verde colada y cocina a fuego medio por 20 minutos para integrar sabores.',
      'Añade el pollo o setas y sazona con sal al gusto.',
      'Sirve bien caliente acompañado de rábanos laminados, orégano y jugo de limón.'
    ]
  }
};

function initRecipeModal() {
  const modal = document.getElementById('recipeModal');
  const closeBtn = document.querySelector('.recipe-modal-close');
  const titleEl = document.getElementById('modalRecipeTitle');
  const metaEl = document.getElementById('modalRecipeMeta');
  const ingsEl = document.getElementById('modalRecipeIngredients');
  const stepsEl = document.getElementById('modalRecipeSteps');

  const viewBtns = document.querySelectorAll('.btn-view-recipe');

  viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.product-card');
      const title = card?.querySelector('.product-title')?.textContent.trim() || 'Receta Casera';
      
      const recipeData = recipesDatabase[title] || {
        time: '30 minutos',
        servings: '4 porciones',
        difficulty: 'Fácil',
        ingredients: [
          'Ingredientes frescos de temporada',
          'Aceite de oliva y hierbas aromáticas',
          'Sal y especias al gusto'
        ],
        steps: [
          'Lava y prepara todos los ingredientes.',
          'Cocina a fuego medio siguiendo la técnica tradicional.',
          'Prueba la sazón, ajusta y sirve de inmediato.'
        ]
      };

      if (titleEl) titleEl.textContent = title;
      if (metaEl) metaEl.innerHTML = `<span>⏱️ ${recipeData.time}</span> • <span>👥 ${recipeData.servings}</span> • <span>⭐ ${recipeData.difficulty}</span>`;
      
      if (ingsEl) {
        ingsEl.innerHTML = recipeData.ingredients.map(ing => `<li>${ing}</li>`).join('');
      }

      if (stepsEl) {
        stepsEl.innerHTML = recipeData.steps.map(step => `<li>${step}</li>`).join('');
      }

      modal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    modal?.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* ==========================================================================
   4. FILTRADO POR CATEGORÍAS
   ========================================================================== */
function initCategoryFilter() {
  const categoryItems = document.querySelectorAll('.category-item');
  const cards = document.querySelectorAll('.product-card');

  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      categoryItems.forEach(c => c.classList.remove('active'));
      item.classList.add('active');

      const filter = item.dataset.category || 'all';
      const label = item.querySelector('.category-label')?.textContent.trim();

      cards.forEach(card => {
        const cat = card.dataset.category || '';
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.opacity = '0.35';
        }
      });

      showToast(`Categoría: ${label}`);
    });
  });
}

/* ==========================================================================
   5. FORMULARIO COMUNITARIO: COMPARTIR RECETA
   ========================================================================== */
function initShareRecipeForm() {
  const form = document.getElementById('shareRecipeForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('shareTitulo');

    if (!titleInput?.value.trim()) {
      showToast('Por favor, indica el nombre de tu receta');
      return;
    }

    showToast('¡Receta enviada a la comunidad! Será publicada tras una breve revisión.');
    form.reset();
  });
}

/* ==========================================================================
   6. CONTACTO Y ASISTENCIA
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre')?.value.trim();
    const email = document.getElementById('email')?.value.trim();

    if (!nombre || !email) {
      showToast('Por favor completa los campos requeridos');
      return;
    }

    showToast('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.');
    form.reset();
  });
}

/* ==========================================================================
   7. COOKIES & ACCESIBILIDAD
   ========================================================================== */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookiesBtn');

  if (localStorage.getItem('saborvivo_cookies') === 'true') {
    banner?.classList.add('hidden');
  }

  acceptBtn?.addEventListener('click', () => {
    banner?.classList.add('hidden');
    localStorage.setItem('saborvivo_cookies', 'true');
    showToast('Preferencias guardadas');
  });
}

function initFloatingFeatures() {
  // Pestaña "SUGERIR RECETA"
  document.querySelector('.floating-feedback-tab')?.addEventListener('click', () => {
    const target = document.getElementById('compartir');
    target?.scrollIntoView({ behavior: 'smooth' });
    showToast('Comparte aquí tu platillo con la comunidad');
  });

  // Botón WhatsApp Comunidad
  document.querySelector('.floating-whatsapp-btn')?.addEventListener('click', () => {
    showToast('Conectando con el canal comunitario de recetas...');
  });

  // Accesibilidad
  document.querySelector('.floating-accessibility-btn')?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
    showToast('Modo de alto contraste alternado');
  });
}

/* Toast Global */
let toastTimer;
function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
