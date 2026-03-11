/* ============================================================
   SCRIPT.JS — I.Imob & I.Imob Luxo
   Arquivo JavaScript compartilhado entre as duas páginas
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
    mouseX = e.clientX;
    mouseY = e.clientY;
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

  const hoverEls = document.querySelectorAll('a, button, .card, .imovel-card, .color-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width  = '52px';
      ring.style.height = '52px';
      ring.style.opacity = '1';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width  = '32px';
      ring.style.height = '32px';
    });
  });
}

/* ============================================================
   2. NAVBAR — SCROLL BEHAVIOR
   ============================================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Menu mobile toggle
  const menuBtn = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      menuBtn.classList.toggle('active');
    });
    // Fechar ao clicar num link
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
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, (entry.target.dataset.delay || 0) * 1 || i * 70);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ============================================================
   4. CONTADOR ANIMADO (STATS)
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
  const statsSection = document.querySelector('.hero-stats');
  if (!statsSection) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stats   = entry.target.querySelectorAll('.stat-num');
        const targets = Array.from(stats).map(el => parseInt(el.dataset.target || el.textContent));
        const sufixes = Array.from(stats).map(el => el.dataset.suffix || '');
        stats.forEach((el, i) => animateCounter(el, targets[i], sufixes[i]));
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

    const btn = form.querySelector('.btn-lead');
    const original = btn.textContent;

    // Coleta dados (você pode integrar com RD Station, HubSpot, etc.)
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('[I.Imob] Lead capturado:', data);
    // TODO: enviar para seu CRM aqui
    // fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) })

    btn.textContent = '✓ Ótimo! Entraremos em contato em breve.';
    btn.disabled = true;
    btn.style.opacity = '0.85';

    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      btn.style.opacity = '';
      form.reset();
    }, 5000);
  });

  // Máscara de telefone
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
   6. GALERIA / SLIDER DE IMÓVEIS
   ============================================================ */
function initImoveisSlider() {
  const sliders = document.querySelectorAll('.imoveis-slider');
  sliders.forEach(slider => {
    const track  = slider.querySelector('.slider-track');
    const btnPrev = slider.querySelector('.btn-prev');
    const btnNext = slider.querySelector('.btn-next');
    const dots    = slider.querySelectorAll('.slider-dot');
    if (!track) return;

    let current = 0;
    const cards = track.querySelectorAll('.imovel-card');
    const total = cards.length;

    function goTo(index) {
      current = (index + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    btnPrev && btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext && btnNext.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // Auto-play a cada 5s
    let autoplay = setInterval(() => goTo(current + 1), 5000);
    slider.addEventListener('mouseenter', () => clearInterval(autoplay));
    slider.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => goTo(current + 1), 5000);
    });
  });
}

/* ============================================================
   7. FILTRO DE IMÓVEIS
   ============================================================ */
function initFiltroImoveis() {
  const filtros = document.querySelectorAll('.filtro-btn');
  const cards   = document.querySelectorAll('.imovel-card[data-tipo]');
  if (!filtros.length) return;

  filtros.forEach(btn => {
    btn.addEventListener('click', () => {
      filtros.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tipo = btn.dataset.filtro;
      cards.forEach(card => {
        const match = tipo === 'todos' || card.dataset.tipo === tipo;
        card.style.opacity    = match ? '1' : '0.3';
        card.style.transform  = match ? '' : 'scale(0.97)';
        card.style.pointerEvents = match ? '' : 'none';
      });
    });
  });
}

/* ============================================================
   8. MODAL DE IMÓVEL
   ============================================================ */
function initModalImovel() {
  const modal    = document.getElementById('modalImovel');
  const modalBg  = document.getElementById('modalBg');
  const modalClose = document.getElementById('modalClose');
  if (!modal) return;

  document.querySelectorAll('.btn-ver-imovel').forEach(btn => {
    btn.addEventListener('click', () => {
      // Preenche o modal com dados do card pai
      const card = btn.closest('.imovel-card');
      if (!card) return;
      modal.querySelector('#modalTitulo').textContent  = card.dataset.titulo  || 'Imóvel';
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

  modalBg   && modalBg.addEventListener('click', closeModal);
  modalClose && modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ============================================================
   9. COPIAR HEX (paleta de cores)
   ============================================================ */
function initCopyHex() {
  document.querySelectorAll('[data-hex]').forEach(el => {
    el.addEventListener('click', () => {
      const hex = el.dataset.hex;
      navigator.clipboard.writeText(hex).catch(() => {});
      showToast(`✓ ${hex} copiado!`);
    });
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:6rem;left:50%;
      transform:translateX(-50%) translateY(20px);
      background:#0D0D0D;color:#C9A84C;
      padding:0.7rem 1.5rem;border-radius:100px;
      font-size:0.78rem;letter-spacing:0.1em;
      border:1px solid rgba(201,168,76,0.3);
      opacity:0;transition:all 0.3s;pointer-events:none;
      z-index:9000;white-space:nowrap;
      font-family:'DM Sans',sans-serif;
    `;
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
   10. SMOOTH SCROLL PARA ÂNCORAS
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
   11. LIGHTBOX DE IMAGENS
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

  function closeLb() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  lbClose && lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
}

/* ============================================================
   INIT — Inicializa tudo quando o DOM estiver pronto
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavbar();
  initReveal();
  initCounters();
  initLeadForm();
  initImoveisSlider();
  initFiltroImoveis();
  initModalImovel();
  initCopyHex();
  initSmoothScroll();
  initLightbox();
});
