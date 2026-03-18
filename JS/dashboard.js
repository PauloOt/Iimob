/* ================================================================
   DASHBOARD.JS — I.Imob
   Painel privado da consultora Vera
   ================================================================ */

const SUPABASE_URL = 'https://qtbmgavyfkixvgoqmhjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym1nYXZ5ZmtpeHZnb3FtaGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTAzNzIsImV4cCI6MjA4OTQyNjM3Mn0.CffnPD07Cu9Jq1j8wkZK9MTuxrJffG8EpLeVFUh6z2U';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let allLeads = [];
let charts   = {};

/* ── CHART DEFAULTS ──────────────────────────────────────── */
Chart.defaults.color          = '#666';
Chart.defaults.borderColor    = 'rgba(240,235,226,.06)';
Chart.defaults.font.family    = "'DM Mono', monospace";
Chart.defaults.font.size      = 11;

/* ================================================================
   AUTH
   ================================================================ */
async function checkAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    showDashboard(session.user.email);
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display    = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard(email) {
  document.getElementById('loginScreen').style.display    = 'none';
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('userEmail').textContent = email;
  loadData();
}

/* Login */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn      = document.getElementById('loginBtn');
  const errorEl  = document.getElementById('loginError');
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Entrando...';
  errorEl.textContent = '';

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = 'E-mail ou senha incorretos.';
    btn.disabled = false;
    btn.textContent = 'Entrar';
  } else {
    showDashboard(data.user.email);
  }
});

/* Logout */
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  showLogin();
});

/* ================================================================
   DATA
   ================================================================ */
async function loadData() {
  document.getElementById('leadsBody').innerHTML =
    '<tr><td colspan="8" class="table-state">Carregando leads...</td></tr>';

  const { data, error } = await db
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('leadsBody').innerHTML =
      '<tr><td colspan="8" class="table-state">Erro ao carregar dados.</td></tr>';
    console.error('[Dashboard] Erro:', error.message);
    return;
  }

  allLeads = data || [];
  updateKPIs();
  renderCharts();
  renderTable(allLeads);

  const now = new Date();
  document.getElementById('lastUpdate').textContent =
    'Atualizado às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

document.getElementById('btnRefresh').addEventListener('click', loadData);

/* ================================================================
   KPIs
   ================================================================ */
function updateKPIs() {
  const total = allLeads.length;

  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  const semana = allLeads.filter(l => new Date(l.created_at) >= semanaAtras).length;

  const standard = allLeads.filter(l => (l.origem || 'standard').toLowerCase() === 'standard').length;
  const luxo     = allLeads.filter(l => (l.origem || '').toLowerCase() === 'luxo').length;

  animateKPI('kpiTotal',    total);
  animateKPI('kpiSemana',   semana);
  animateKPI('kpiStandard', standard);
  animateKPI('kpiLuxo',     luxo);
}

function animateKPI(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  if (target === 0) { el.textContent = '0'; return; }
  const step  = Math.max(1, Math.floor(target / 35));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 28);
}

/* ================================================================
   CHARTS
   ================================================================ */
function renderCharts() {
  renderTimeline();
  renderInteresse();
  renderOrigem();
}

/* Timeline — leads por dia (30 dias) */
function renderTimeline() {
  const days   = [];
  const counts = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label   = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dateStr = d.toISOString().slice(0, 10);
    days.push(label);
    counts.push(allLeads.filter(l => l.created_at.slice(0, 10) === dateStr).length);
  }

  if (charts.timeline) charts.timeline.destroy();
  charts.timeline = new Chart(document.getElementById('chartTimeline'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Leads',
        data: counts,
        borderColor: '#c9a84c',
        backgroundColor: 'rgba(201,168,76,.08)',
        borderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#c9a84c',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 10, color: '#555' }, grid: { color: 'rgba(240,235,226,.04)' } },
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#555' }, grid: { color: 'rgba(240,235,226,.04)' } }
      }
    }
  });
}

/* Donut — por interesse */
function renderInteresse() {
  const map = {};
  allLeads.forEach(l => {
    const k = l.interesse || 'Não informado';
    map[k] = (map[k] || 0) + 1;
  });
  const labels = Object.keys(map);
  const data   = Object.values(map);
  const palette = ['#c9a84c','#e8c96a','#a88830','#786020','#888','#555','#333'];

  if (charts.interesse) charts.interesse.destroy();
  charts.interesse = new Chart(document.getElementById('chartInteresse'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: palette.slice(0, labels.length),
        borderColor: '#111',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, boxWidth: 10, font: { size: 10 }, color: '#777' }
        }
      }
    }
  });
}

/* Bar — Standard vs Luxo */
function renderOrigem() {
  const standard = allLeads.filter(l => (l.origem || 'standard').toLowerCase() === 'standard').length;
  const luxo     = allLeads.filter(l => (l.origem || '').toLowerCase() === 'luxo').length;

  if (charts.origem) charts.origem.destroy();
  charts.origem = new Chart(document.getElementById('chartOrigem'), {
    type: 'bar',
    data: {
      labels: ['Standard', 'Luxo'],
      datasets: [{
        data: [standard, luxo],
        backgroundColor: ['rgba(240,235,226,.1)', 'rgba(201,168,76,.18)'],
        borderColor:     ['rgba(240,235,226,.25)', '#c9a84c'],
        borderWidth: 1,
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#555' }, grid: { color: 'rgba(240,235,226,.04)' } },
        x: { ticks: { color: '#777' }, grid: { display: false } }
      }
    }
  });
}

/* ================================================================
   TABLE
   ================================================================ */
function renderTable(leads) {
  const tbody  = document.getElementById('leadsBody');
  const footer = document.getElementById('tableFooter');

  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-state">Nenhum lead encontrado.</td></tr>';
    footer.textContent = '';
    return;
  }

  tbody.innerHTML = leads.map(l => {
    const date = new Date(l.created_at).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    const origem      = (l.origem || 'standard').toLowerCase();
    const badgeClass  = origem === 'luxo' ? 'badge-luxo' : 'badge-standard';
    const esc = v => (v || '—').replace(/</g, '&lt;');

    return `
      <tr>
        <td>${date}</td>
        <td>${esc(l.nome)}</td>
        <td>${esc(l.telefone)}</td>
        <td>${esc(l.email)}</td>
        <td>${esc(l.interesse)}</td>
        <td>${esc(l.orcamento)}</td>
        <td>${esc(l.cidade)}</td>
        <td><span class="badge-origem ${badgeClass}">${origem}</span></td>
      </tr>`;
  }).join('');

  footer.textContent = `${leads.length} lead${leads.length !== 1 ? 's' : ''} encontrado${leads.length !== 1 ? 's' : ''}`;
}

/* Search & filter */
function applyFilters() {
  const search = document.getElementById('tableSearch').value.toLowerCase().trim();
  const origem = document.getElementById('tableFilter').value.toLowerCase();

  const filtered = allLeads.filter(l => {
    const matchOrigem  = !origem || (l.origem || 'standard').toLowerCase() === origem;
    const matchSearch  = !search ||
      (l.nome     || '').toLowerCase().includes(search) ||
      (l.email    || '').toLowerCase().includes(search) ||
      (l.telefone || '').includes(search) ||
      (l.cidade   || '').toLowerCase().includes(search);
    return matchOrigem && matchSearch;
  });

  renderTable(filtered);
}

document.getElementById('tableSearch').addEventListener('input', applyFilters);
document.getElementById('tableFilter').addEventListener('change', applyFilters);

/* ================================================================
   EXPORT CSV
   ================================================================ */
document.getElementById('btnExport').addEventListener('click', () => {
  const headers = ['Data','Nome','Telefone','E-mail','Interesse','Orçamento','Cidade','Mensagem','Origem'];
  const rows = allLeads.map(l => [
    new Date(l.created_at).toLocaleString('pt-BR'),
    l.nome, l.telefone, l.email,
    l.interesse, l.orcamento, l.cidade, l.mensagem, l.origem
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `leads_iimob_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ── INIT ────────────────────────────────────────────────── */
checkAuth();
