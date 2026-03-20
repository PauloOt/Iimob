/* ============================================================
   SCRIPT.JS — I.Imob & I.Imob Luxo (v2)
   Novidades: Carrossel, Filtro por Bairro, Página Projetos
   ============================================================ */

/* ── SUPABASE ────────────────────────────────────────────── */
const _SB_URL = 'https://qtbmgavyfkixvgoqmhjt.supabase.co';
const _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym1nYXZ5ZmtpeHZnb3FtaGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTAzNzIsImV4cCI6MjA4OTQyNjM3Mn0.CffnPD07Cu9Jq1j8wkZK9MTuxrJffG8EpLeVFUh6z2U';

function _loadSupabase() {
  return new Promise(resolve => {
    if (window.supabase) { resolve(); return; }
    const s   = document.createElement('script');
    s.src     = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload  = resolve;
    s.onerror = resolve; // falha silenciosa — não quebra o site
    document.head.appendChild(s);
  });
}

async function _saveLeadToSupabase(payload) {
  await _loadSupabase();
  if (!window.supabase) return;
  const db = window.supabase.createClient(_SB_URL, _SB_KEY);
  const { error } = await db.from('leads').insert([payload]);
  if (error) console.warn('[I.Imob] Supabase:', error.message);
}

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

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn      = form.querySelector('.btn-lead, .btn-lead-lx');
    const original = btn.textContent;
    btn.textContent = '⏳ Enviando...';
    btn.disabled    = true;

    const formData = new FormData(form);
    const raw      = Object.fromEntries(formData.entries());

    // Detecta origem (Standard ou Luxo) pela classe do formulário
    const origem = form.classList.contains('lead-lx-form') ? 'luxo' : 'standard';

    // Normaliza campos que têm nomes diferentes nos dois formulários
    const payload = {
      nome:      raw.nome      || '',
      email:     raw.email     || '',
      telefone:  raw.telefone  || '',
      interesse: raw.interesse || '',
      orcamento: raw.orcamento || raw.valor || '',
      cidade:    raw.cidade    || raw.local || '',
      mensagem:  raw.mensagem  || '',
      origem,
    };

    await _saveLeadToSupabase(payload);

    btn.textContent = '✓ Ótimo! Entraremos em contato em breve.';
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
   ────────────────────────────────────────────────────────────
   Usa event delegation para funcionar com cards do carrossel
   ============================================================ */
function initModalImovel() {
  const modal      = document.getElementById('modalImovel');
  const modalBg    = document.getElementById('modalBg');
  const modalClose = document.getElementById('modalClose');
  if (!modal) return;

  // Event delegation — captura cliques em qualquer .btn-ver-imovel,
  // inclusive os dentro do carrossel que são manipulados dinamicamente
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-ver-imovel');
    if (!btn) return;
    const card = btn.closest('.imovel-card, .imovel-lx-card');
    if (!card) return;
    document.getElementById('modalTitulo').textContent  = card.dataset.titulo  || '';
    document.getElementById('modalPreco').textContent   = card.dataset.preco   || '';
    document.getElementById('modalDesc').textContent    = card.dataset.desc    || '';
    document.getElementById('modalImg').src             = card.dataset.img     || '';
    document.getElementById('modalTipo').textContent    = card.dataset.tipo    || '';
    document.getElementById('modalArea').textContent    = card.dataset.area    || '';
    document.getElementById('modalQuartos').textContent = card.dataset.quartos || '';
    document.getElementById('modalLocal').textContent   = card.dataset.local   || '';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
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

  // Suporta tanto .imovel-card (Standard) quanto .imovel-lx-card (Luxo)
  const cards     = Array.from(grid.querySelectorAll('.imovel-card, .imovel-lx-card'));
  const emptyEl   = document.getElementById('projetosEmpty');
  const countEl   = document.getElementById('resultadoCount');
  const textInput = document.getElementById('filtroBairroText');
  const selectEl  = document.getElementById('filtroBairroSelect');

  // Popula dropdown de bairros
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
      const label = shown === 1 ? '1 imóvel encontrado' : `${shown} imóveis encontrados`;
      countEl.textContent = label;
    }
  }

  // Suporta tanto .filtro-btn (Standard) quanto .filtro-btn-lx (Luxo)
  document.querySelectorAll('.filtro-btn, .filtro-btn-lx').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn, .filtro-btn-lx').forEach(b => b.classList.remove('active'));
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
   LEAD POPUP — comentar initLeadPopup() no INIT para desativar
   ============================================================ */
function initLeadPopup() {
  const overlay = document.getElementById('leadPopupOverlay');
  if (!overlay) return;

  const KEY     = 'iimob_leadpopup';
  const DAYS    = 7;
  const DELAY   = 20000; // 20 segundos

  // Não exibir se já foi visto recentemente
  const saved = localStorage.getItem(KEY);
  if (saved) {
    try {
      const { expires } = JSON.parse(saved);
      if (Date.now() < expires) return;
    } catch (_) {}
  }

  const card        = document.getElementById('leadPopupCard');
  const closeBtn    = document.getElementById('popupClose');
  const skipBtn     = document.getElementById('popupSkip');
  const submitBtn   = document.getElementById('popupSubmit');
  const nameInput   = document.getElementById('popupName');
  const contactInput= document.getElementById('popupContact');
  const consentBox  = document.getElementById('popupConsent');
  const channelBtns = document.querySelectorAll('.popup-channel-btn');
  const successEl   = document.getElementById('popupSuccess');
  const formEl      = document.getElementById('popupForm');

  let channel = 'whatsapp';

  function dismiss(markSeen = true) {
    overlay.classList.remove('open');
    if (markSeen) {
      const expires = Date.now() + DAYS * 864e5;
      localStorage.setItem(KEY, JSON.stringify({ expires }));
    }
  }

  // Troca entre WhatsApp / Email
  channelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      channel = btn.dataset.channel;
      channelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      contactInput.placeholder = channel === 'whatsapp'
        ? '(00) 00000-0000'
        : 'seu@email.com';
      contactInput.type = channel === 'whatsapp' ? 'tel' : 'email';
    });
  });

  // Máscara telefone (reusa lógica existente)
  contactInput.addEventListener('input', () => {
    if (channel !== 'whatsapp') return;
    let v = contactInput.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6)      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    contactInput.value = v;
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    if (!nameInput.value.trim() || !contactInput.value.trim() || !consentBox.checked) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const payload = {
      nome:    nameInput.value.trim(),
      canal:   channel,
      contato: contactInput.value.trim(),
      origem:  'popup_consultoria',
      pagina:  window.location.pathname,
    };

    console.log('[Luxo] Lead popup:', payload);
    await _saveLeadToSupabase(payload);

    // Mostra sucesso
    formEl.style.display     = 'none';
    successEl.style.display  = 'block';
    setTimeout(() => dismiss(true), 3000);
  });

  closeBtn.addEventListener('click', () => dismiss(true));
  skipBtn .addEventListener('click', () => dismiss(true));
  overlay .addEventListener('click', e => { if (e.target === overlay) dismiss(true); });

  // Abre após delay
  setTimeout(() => overlay.classList.add('open'), DELAY);
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
  initLeadPopup(); // ← comentar esta linha para desativar o popup
});