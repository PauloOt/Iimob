# CLAUDE.md — Projeto I.Imob

Site estático da consultora imobiliária **Vera**. HTML + CSS + JS puros — sem framework, sem build step.

---

## Duas marcas independentes

| Marca | Landing page | Grid de imóveis | CSS |
|---|---|---|---|
| **I.Imob Standard** | `index.html` | `projetos.html` | `StyleSheets/style_Imob.css` |
| **I.Imob Luxo** | `Imob_luxo_index.html` | `projetos_luxo.html` | `StyleSheets/style_Imob_luxo.css` |

**JS compartilhado:** `JS/script.js` — afeta todas as 4 páginas.

---

## Estrutura de arquivos

```
IIMOB/
├── index.html
├── Imob_luxo_index.html
├── projetos.html
├── projetos_luxo.html
├── dashboard.html
├── JS/
│   ├── script.js          ← único JS para todas as páginas
│   └── dashboard.js
├── StyleSheets/
│   ├── style_Imob.css
│   ├── style_Imob_luxo.css
│   └── style_dashboard.css
└── fotos/                 ← criar pasta; ainda não adicionadas
```

---

## Regras críticas

1. **Caminhos sempre relativos** — `index.html`, nunca `/index.html`
2. **CSS separados** — Standard usa `style_Imob.css`, Luxo usa `style_Imob_luxo.css`; nunca misturar
3. **JS é compartilhado** — qualquer mudança em `script.js` afeta as 4 páginas
4. **Modal usa event delegation** — nunca substituir por `addEventListener` direto nos botões; o carrossel manipula o DOM dinamicamente e isso quebraria
5. **Cards nas duas páginas** — ao adicionar/alterar card, replicar no carrossel (homepage) E no grid (projetos)
6. **`data-tipo` minúsculo** — o filtro JS usa `.toLowerCase()`; valores: `venda | curadoria | lancamento` (Standard) / `cobertura | casa | apartamento | lancamento` (Luxo)
7. **Cores via CSS variables** — nunca hardcodar hex no HTML; usar `var(--terra)`, `var(--champa)` etc.
8. **`projetos_luxo.html` tem `<style>` inline no `<head>`** — é intencional; estilos específicos do grid Luxo

---

## Design — I.Imob Standard

**Estética:** Editorial minimal — revista de arquitetura japonesa-ocidental.

### Paleta
```css
--bone: #F5F0E8        /* fundo principal */
--charcoal: #1A1A18    /* texto */
--terra: #b8974a       /* acento dourado */
--navy: #1A1A2E        /* fundo seções escuras */
--navy-footer: #0e0e1e
```

### Tipografia
```css
--f-display: 'Tenor Sans', Georgia, serif
--f-body:    'Libre Baskerville', Georgia, serif
--f-mono:    'DM Mono', monospace
```

---

## Design — I.Imob Luxo

**Estética:** Art déco noturno — belle époque, escuro refinado.

### Paleta
```css
--night: #060606       /* fundo principal */
--champa: #c9a84c      /* acento ouro champanhe */
--pearl: #f0ebe2       /* texto */
```

### Tipografia
```css
--f-display: 'IM Fell English', Georgia, serif
--f-sans:    'Jost', system-ui, sans-serif
--f-mono:    'DM Mono', monospace
```

O símbolo `◆` é usado como bullet/separador decorativo em todo o Luxo.

---

## JavaScript (`script.js`)

Cada função verifica se os elementos existem antes de rodar (`if (!element) return`).

| Função | Descrição |
|---|---|
| `initCursor()` | Cursor dot + ring — só desktop |
| `initNavbar()` | Navbar fixa + hamburger mobile |
| `initReveal()` | IntersectionObserver em `.reveal` |
| `initCounters()` | Contadores animados no hero Luxo |
| `initLeadForm()` | Validação + máscara tel + submissão ao Supabase |
| `initCarousel()` | Carrossel 2/pág desktop · 1 mobile + filtros + swipe |
| `initProjetosFilter()` | Filtro do grid em `projetos.html` e `projetos_luxo.html` |
| `initModalImovel()` | Modal de detalhes (event delegation) |
| `initSmoothScroll()` | Scroll suave para âncoras `#` |
| `initLightbox()` | Lightbox para `.img-zoom` |
| `initCookieBanner()` | Banner LGPD — localStorage, expira 30 dias |

**Supabase** — leads são salvos via `_saveLeadToSupabase()`. Credenciais no topo de `script.js`.

---

## Como adicionar card de imóvel

### Standard (`.imovel-card`)
```html
<div class="imovel-card"
     data-tipo="venda"
     data-bairro="Nome do Bairro"
     data-titulo="Título"
     data-preco="R$ 000.000"
     data-desc="Descrição para o modal."
     data-local="Bairro, Cidade — SP"
     data-area="000m²"
     data-quartos="0 dorm."
     data-img="fotos/imovel-nome.jpg">
  <div class="imovel-img-wrap">
    <img src="fotos/imovel-nome.jpg" alt="Título" class="img-zoom" />
    <span class="imovel-tag venda">Venda</span>
  </div>
  <div class="imovel-info">
    <div class="imovel-preco">R$ 000.000</div>
    <div class="imovel-titulo">Título</div>
    <div class="imovel-local">📍 Bairro, Cidade — SP</div>
    <div class="imovel-detalhes">
      <div class="imovel-detalhe">🛏 <strong>0</strong> dorm.</div>
      <div class="imovel-detalhe">📐 <strong>000</strong> m²</div>
      <div class="imovel-detalhe">🚗 <strong>0</strong> vagas</div>
    </div>
  </div>
  <div class="imovel-card-actions">
    <button class="btn-ghost btn-ver-imovel">Ver detalhes →</button>
    <a href="https://wa.me/5511986755485?text=Interesse%20em%20[Imóvel]"
       class="btn-primary" target="_blank"><span>WhatsApp</span></a>
  </div>
</div>
```

### Luxo (`.imovel-lx-card`)
```html
<div class="imovel-lx-card"
     data-tipo="cobertura"
     data-bairro="Nome do Bairro"
     data-titulo="Título"
     data-preco="R$ 0.000.000"
     data-desc="Descrição para o modal."
     data-local="Bairro, São Paulo — SP"
     data-area="000m²"
     data-quartos="0 suítes"
     data-img="fotos/imovel-luxo-nome.jpg">
  <div class="imovel-lx-img-wrap">
    <img src="fotos/imovel-luxo-nome.jpg" alt="Título" class="img-zoom" />
    <div class="imovel-lx-overlay"></div>
    <span class="imovel-lx-tag exclusivo">◆ Exclusivo</span>
  </div>
  <div class="imovel-lx-info">
    <div class="imovel-lx-preco">R$ 0.000.000</div>
    <div class="imovel-lx-titulo">Título</div>
    <div class="imovel-lx-local">Bairro, São Paulo — SP</div>
    <div class="imovel-lx-specs">
      <div class="imovel-lx-spec">🛏 <strong>0 suítes</strong></div>
      <div class="imovel-lx-spec">📐 <strong>000 m²</strong></div>
      <div class="imovel-lx-spec">🏊 <strong>Piscina</strong></div>
    </div>
  </div>
  <div class="imovel-lx-card-actions">
    <button class="btn-lx-ghost btn-ver-imovel">Ver detalhes →</button>
    <a href="https://wa.me/5511999999999?text=Interesse%20em%20[Imóvel]"
       class="btn-lx-primary" target="_blank"><span>Agendar Visita</span></a>
  </div>
</div>
```

> Adicionar sempre nas **duas páginas**: carrossel (homepage) + grid (projetos).

---

## Pendências antes de publicar

| Item | Status |
|---|---|
| WhatsApp Luxo | `5511999999999` — substituir pelo real |
| CRECI | `000000` — preencher |
| Textos Lorem ipsum | Sobre e Depoimentos |
| Fotos da consultora | hero + sobre em ambas as marcas |
| Fotos dos imóveis | todos os cards |
| Integração CRM | RD Station — ver `initLeadForm()` em `script.js` |
| Política de privacidade | criar `politica-de-privacidade.html` |

---

## Referência rápida de classes

| Classe | Uso |
|---|---|
| `.reveal` | Animação de entrada no scroll |
| `.btn-primary` / `.btn-outline` / `.btn-ghost` | Botões Standard |
| `.btn-lx-primary` / `.btn-lx-outline` / `.btn-lx-ghost` | Botões Luxo |
| `.btn-ver-imovel` | **Obrigatório** no botão de detalhes para o modal funcionar |
| `.img-zoom` | Foto clicável no lightbox |
| `.imovel-card` / `.imovel-lx-card` | Cards Standard / Luxo |
| `.filtro-btn` / `.filtro-btn-lx` | Botões de filtro Standard / Luxo |
| `.section-label` / `.section-title` | Label e título de seção |
