/* ============================================================
   SCRIPT.JS — I.Imob & I.Imob Luxo (v2)
   Novidades: Carrossel, Filtro por Bairro, Página Projetos
   ============================================================ */

/* ============================================================
   1. CURSOR PERSONALIZADO
   ============================================================ */
function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .imovel-card, .imovel-lx-card').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.width = '52px'; ring.style.height = '52px'; });
    el.addEventListener('mouseleave', () => { ring.style.width = '32px'; ring.style.height = '32px'; });
  });
}

/* ============================================================
   2. NAVBAR
   ============================================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

  const menuBtn    = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      menuBtn.classList.toggle('active');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuBtn.classList.remove('active');
      });
    });
  }
}

/* ============================================================
   3. REVEAL ON SCROLL
   ============================================================ */
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
}

/* ============================================================
   4. CONTADOR ANIMADO
   ============================================================ */
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const step = target / 55;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current >= target) clearInterval(timer);
  }, 18);
}
function initCounters() {
  const statsSection = document.querySelector('.hero-stats, .hero-luxo-stats');
  if (!statsSection) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-num, .lx-stat-num').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target || el.textContent), el.dataset.suffix || '');
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(statsSection);
}

/* ============================================================
   5. FORMULÁRIO DE LEADS
   ============================================================ */
function initLeadForm() {
  const form = document.getElementById('leadForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-lead, .btn-lead-lx');
    const original = btn.textContent;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('[I.Imob] Lead capturado:', data);
    // TODO: integrar com CRM aqui
    // fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) })

    btn.textContent = '✓ Ótimo! Entraremos em contato em breve.';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; form.reset(); }, 5000);
  });

  const telInput = form.querySelector('input[type="tel"]');
  if (telInput) {
    telInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
      else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
      e.target.value = v;
    });
  }
}

/* ============================================================
   6. CARROSSEL (novo em v2)
   ────────────────────────────────────────────────────────────
   Funciona tanto com .imovel-card (Standard) quanto
   com .imovel-lx-card (Luxo).
   ============================================================ */
function initCarousel() {
  const track = document.getElementById('carouselTrackStd');
  if (!track) return;

  const viewport  = track.closest('.carousel-viewport');
  const wrapper   = track.closest('.carousel-wrapper');
  const prevBtn   = wrapper.querySelector('.carousel-prev');
  const nextBtn   = wrapper.querySelector('.carousel-next');
  const dotsContainer = document.getElementById('carouselDots');
  const emptyMsg  = document.getElementById('carouselEmpty');

  // Detecta se é luxo ou standard
  const isLuxo = !!track.querySelector('.imovel-lx-card');
  const cardSelector = isLuxo ? '.imovel-lx-card' : '.imovel-card';

  let allCards  = [];   // todos os cards originais
  let visible   = [];   // cards atualmente visíveis (após filtro)
  let current   = 0;    // índice da "página" atual
  const perPage = window.innerWidth <= 768 ? 1 : 2;

  // Popula allCards na inicialização
  allCards = Array.from(track.querySelectorAll(cardSelector));

  // ── Buildagem do dropdown de bairros ──────────────────────
  const selectEl = document.getElementById('filtroBairroSelect');
  if (selectEl) {
    const bairros = [...new Set(
      allCards.map(c => (c.dataset.bairro || '').trim()).filter(Boolean)
    )].sort();
    bairros.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      selectEl.appendChild(opt);
    });
  }

  // ── Render ────────────────────────────────────────────────
  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const pages = Math.ceil(visible.length / perPage);
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Página ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(d);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function goTo(index) {
    const pages = Math.ceil(visible.length / perPage);
    if (pages === 0) return;
    current = Math.max(0, Math.min(index, pages - 1));

    // largura de cada card + gap
    const cardEl = visible[0];
    if (!cardEl) return;
    const gap = isLuxo ? 28.8 : 24;  // 1.8rem / 1.5rem in px
    const cardW = cardEl.offsetWidth + gap;
    track.style.transform = `translateX(-${current * perPage * cardW}px)`;
    updateDots();
  }

  function renderVisible() {
    // Mostra/oculta cards de acordo com o filtro
    current = 0;
    track.style.transform = 'translateX(0)';

    allCards.forEach(c => {
      const show = visible.includes(c);
      c.style.display = show ? '' : 'none';
    });

    if (emptyMsg) {
      emptyMsg.classList.toggle('visible', visible.length === 0);
    }
    buildDots();
  }

  // ── Filtro combinado (tipo + bairro) ──────────────────────
  let activeTipo  = 'todos';
  let activeBairro = '';

  function applyFilters() {
    visible = allCards.filter(card => {
      const tipo   = (card.dataset.tipo   || '').toLowerCase();
      const bairro = (card.dataset.bairro || '').toLowerCase();

      const tipoMatch  = activeTipo === 'todos' || tipo === activeTipo;
      const bairroMatch = !activeBairro ||
        bairro.includes(activeBairro.toLowerCase());

      return tipoMatch && bairroMatch;
    });
    renderVisible();
  }

  // Botões de tipo
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTipo = btn.dataset.filtro || 'todos';
      applyFilters();
    });
  });

  // Input de texto
  const textInput = document.getElementById('filtroBairroText');
  if (textInput) {
    textInput.addEventListener('input', e => {
      activeBairro = e.target.value.trim();
      if (selectEl) selectEl.value = '';   // reseta dropdown
      applyFilters();
    });
  }

  // Select de bairro
  if (selectEl) {
    selectEl.addEventListener('change', e => {
      activeBairro = e.target.value;
      if (textInput) textInput.value = '';  // reseta texto
      applyFilters();
    });
  }

  // Navegação prev / next
  prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

  // Touch/swipe
  let touchStartX = 0;
  viewport.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Init
  visible = [...allCards];
  renderVisible();
}

/* ============================================================
   7. MODAL DE IMÓVEL
   ============================================================ */
function initModalImovel() {
  const modal      = document.getElementById('modalImovel');
  const modalBg    = document.getElementById('modalBg');
  const modalClose = document.getElementById('modalClose');
  if (!modal) return;

  document.querySelectorAll('.btn-ver-imovel').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.imovel-card, .imovel-lx-card');
      if (!card) return;
      modal.querySelector('#modalTitulo').textContent  = card.dataset.titulo  || '';
      modal.querySelector('#modalPreco').textContent   = card.dataset.preco   || '';
      modal.querySelector('#modalDesc').textContent    = card.dataset.desc    || '';
      modal.querySelector('#modalImg').src             = card.dataset.img     || '';
      modal.querySelector('#modalTipo').textContent    = card.dataset.tipo    || '';
      modal.querySelector('#modalArea').textContent    = card.dataset.area    || '';
      modal.querySelector('#modalQuartos').textContent = card.dataset.quartos || '';
      modal.querySelector('#modalLocal').textContent   = card.dataset.local   || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  modalBg    && modalBg.addEventListener('click', closeModal);
  modalClose && modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ============================================================
   8. FILTRO DA PÁGINA projetos.html
   ────────────────────────────────────────────────────────────
   Mesma lógica do carrossel, mas aplicada ao grid estático
   ============================================================ */
function initProjetosFilter() {
  const grid = document.getElementById('projetosGrid');
  if (!grid) return;

  const cards      = Array.from(grid.querySelectorAll('.imovel-card'));
  const emptyEl    = document.getElementById('projetosEmpty');
  const countEl    = document.getElementById('resultadoCount');
  const textInput  = document.getElementById('filtroBairroText');
  const selectEl   = document.getElementById('filtroBairroSelect');

  // Popula dropdown
  if (selectEl) {
    const bairros = [...new Set(cards.map(c => (c.dataset.bairro || '').trim()).filter(Boolean))].sort();
    bairros.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      selectEl.appendChild(opt);
    });
  }

  let activeTipo   = 'todos';
  let activeBairro = '';

  function applyFilters() {
    let shown = 0;
    cards.forEach(card => {
      const tipo   = (card.dataset.tipo   || '').toLowerCase();
      const bairro = (card.dataset.bairro || '').toLowerCase();
      const ok = (activeTipo === 'todos' || tipo === activeTipo) &&
                 (!activeBairro || bairro.includes(activeBairro.toLowerCase()));
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (emptyEl) {
      emptyEl.style.display = shown === 0 ? 'block' : 'none';
      const termEl = document.getElementById('termoBuscado');
      if (termEl) termEl.textContent = activeBairro || activeTipo;
    }
    if (countEl) {
      countEl.textContent = shown === 1 ? '1 imóvel encontrado' : `${shown} imóveis encontrados`;
    }
  }

  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTipo = btn.dataset.filtro || 'todos';
      applyFilters();
    });
  });

  if (textInput) {
    textInput.addEventListener('input', e => {
      activeBairro = e.target.value.trim();
      if (selectEl) selectEl.value = '';
      applyFilters();
    });
  }
  if (selectEl) {
    selectEl.addEventListener('change', e => {
      activeBairro = e.target.value;
      if (textInput) textInput.value = '';
      applyFilters();
    });
  }

  applyFilters(); // contagem inicial
}

/* ============================================================
   9. SMOOTH SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ============================================================
   10. LIGHTBOX
   ============================================================ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg   = lightbox.querySelector('#lbImg');
  const lbClose = lightbox.querySelector('#lbClose');

  document.querySelectorAll('.img-zoom').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLb() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  lbClose && lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
}

/* ============================================================
   11. TOAST
   ============================================================ */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `position:fixed;bottom:6rem;left:50%;transform:translateX(-50%) translateY(20px);background:#0D0D0D;color:#C9A84C;padding:.7rem 1.5rem;border-radius:100px;font-size:.78rem;letter-spacing:.1em;border:1px solid rgba(201,168,76,.3);opacity:0;transition:all .3s;pointer-events:none;z-index:9000;white-space:nowrap;font-family:'DM Sans',sans-serif;`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2200);
}

/* ============================================================
   COOKIE BANNER — LGPD
   ============================================================ */
function initCookieBanner() {
  const banner  = document.getElementById('cookieBanner');
  if (!banner) return;

  const KEY     = 'iimob_cookie_consent';
  const DAYS    = 30;

  // Já respondeu antes? Não mostra.
  const saved = localStorage.getItem(KEY);
  if (saved) return;

  // Abre com pequeno delay para não "piscar" no carregamento
  setTimeout(() => banner.classList.add('visible'), 800);

  function setConsent(value) {
    const expires = Date.now() + DAYS * 864e5; // ms em 30 dias
    localStorage.setItem(KEY, JSON.stringify({ value, expires }));
    banner.classList.remove('visible');
  }

  document.getElementById('cookieAccept') .addEventListener('click', () => setConsent('accepted'));
  document.getElementById('cookieDecline').addEventListener('click', () => setConsent('declined'));
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavbar();
  initReveal();
  initCounters();
  initLeadForm();
  initCarousel();        // ← carrossel (homepage Standard + Luxo)
  initProjetosFilter();  // ← filtro grid (projetos.html)
  initModalImovel();
  initSmoothScroll();
  initLightbox();
  initCookieBanner();
});