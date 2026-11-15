# CondoEconomy — Especificação de design e telas (v1)

Documento para um agente de código (Claude no Antigravity) aplicar o redesign do front-end **CondoEconomy Web**. Ele foi escrito para ser lido sozinho. As telas de referência estão na pasta `referencia-html/` (um arquivo por tela). Os nomes dos arquivos aparecem em cada seção como **Ref:**.

---

## 0. Leia primeiro: instruções para o agente

### 0.1 Objetivo
Alterar o front-end existente do CondoEconomy para que fique visualmente e comportamentalmente igual às telas de referência: mesmo design system, mesmos componentes, mesmos estados e fluxos. **Não é para recriar o projeto.** É uma reescrita da camada visual sobre o código que já funciona.

### 0.2 Contexto técnico (confirme lendo o repositório; se divergir, o repositório vence)
- Front: `github.com/PedroNilton/condoeconomy-web` — React 18 + TypeScript, Vite, Tailwind CSS v4, React Router DOM, Lucide React, Axios, StompJS/SockJS. Mobile-first, dark mode.
- API: `github.com/PedroNilton/condoeconomy-api` — Java 21, Spring Boot 3.3, Spring Security com JWT, PostgreSQL, WebSocket (STOMP).
- Perfis (roles): `ROLE_SINDICO`, `ROLE_PORTEIRO`, `ROLE_MORADOR`.
- Regras que o repositório já define e que devem ser **preservadas**: o Axios desloga automaticamente em 401/403; as reservas têm status PENDENTE / APROVADO / REJEITADO; a UI da Portaria usa botões grandes e fontes monoespaçadas; o morador cai em uma home focada no uso pessoal (boletos, reservas, veículos).

### 0.3 Regras de ouro
1. **Visual primeiro.** Não altere contratos da API, rotas existentes, autenticação, interceptors, contextos/estado globais nem a lógica de negócio que já funciona.
2. **Não recrie do zero.** Para cada tela: leia o componente atual, encontre a seção correspondente desta spec, e reescreva a camada visual preservando hooks, chamadas e estado.
3. **O HTML de referência é a fonte de verdade visual** (medidas, cores, espaçamento, estados). Não copie o CSS cru: traduza para Tailwind e componentes reutilizáveis. Os dados dos HTMLs são fictícios.
4. **Itens marcados `[BACKEND]`** dependem de endpoints/campos que talvez não existam. Verifique a API. Se não existir, **não invente endpoint nem dado fixo**: esconda atrás de uma feature flag (ou deixe de fora) e liste no relatório final.
5. **O que existe só nos mockups e não vai para o app:** (a) toasts que apenas simulam uma chamada real (ex.: "Lembrete enviado"): no app, dispare a chamada real e mostre o toast no sucesso; (b) a faixa amarela e os botões "Pré-visualizar" da tela `morador-13-notificacoes.html`; (c) dados de exemplo.
6. **Em caso de dúvida, pergunte** (veja a seção 9) em vez de assumir.
7. **Trabalhe em fases pequenas** (seção 7), uma tela ou componente por commit, com mensagens de commit **em português**.
8. **Tema claro e escuro e acessibilidade são obrigatórios** em toda tela (seção 2.6 e 2.11).

### 0.4 Legenda
- `[VISUAL]` pode aplicar já, sem mudar a API.
- `[BACKEND]` precisa de endpoint/campo novo; verifique antes.
- `[DECISÃO]` ponto a confirmar com o dono do produto (Pedro).

### 0.5 Como trabalhar
1. Leia o repositório e produza um **mapa "tela atual → seção desta spec"** (rotas, arquivos, componentes). Mostre ao Pedro antes de editar.
2. Execute a Fase 0 (tokens, fontes, tema) e a Fase 1 (componentes base).
3. Depois, uma tela por vez, na ordem da seção 7. Após cada fase: `build`, `lint` e checagem visual em claro/escuro, larguras 360px e 412px.
4. Ao final, entregue um relatório: o que foi aplicado, o que ficou atrás de feature flag e o que não foi possível.

---

## 1. Produto em um minuto

Plataforma mobile-first de gestão de condomínio, com atualização em tempo real (WebSocket) e três perfis:

| Perfil | Faz |
|---|---|
| **Morador** | Boletos, reservas de áreas comuns, veículos, pets, moradores adicionais, ouvidoria, notificações, perfil |
| **Portaria** | Visitantes, encomendas, conferência de convidados de reservas, consulta de placa, atendimento de chamados |
| **Síndico** | Avisos, aprovação de reservas, assembleias (votações), chamados escalados, painel financeiro |

**Fluxos entre perfis (a spec das telas depende deles):**
1. Morador solicita reserva → Síndico aprova ou recusa (com motivo) → a taxa entra no próximo boleto → morador é notificado → Portaria vê as reservas aprovadas do dia e confere os convidados.
2. Morador abre chamado na Ouvidoria → Portaria atende, responde e resolve, **ou escala** → Síndico assume e resolve → morador é notificado.
3. Portaria registra encomenda → morador recebe push → Portaria registra a entrega e **quem retirou**.
4. Portaria registra visitante (ou lê QR de convite): Espera → Liberar entrada → No local → Registrar saída.
5. Síndico publica aviso → moradores são notificados → síndico vê quantas unidades viram.
6. Síndico cria pauta de assembleia → moradores votam (1 voto por unidade) → resultado e quórum.
7. Síndico emite boleto/lança despesa/dá baixa manual → tudo vai para uma trilha de auditoria imutável.

Escala de referência dos mockups: **168 unidades** (14 blocos × 12 apartamentos), boleto de **R$ 650,00**. Formato de unidade: `Bloco 03 · Apto 02`.

---

## 2. Design system

### 2.1 Direção visual: "moderno e tech"
- Neutro dominante, **um único acento** (roxo-azulado). Cor só para ação e status.
- Bordas de 1px, quase nenhuma sombra, sem gradientes, sem ilustração decorativa, ícones de linha.
- **Dados em mono:** números, valores, horários, placas, códigos, unidades e contadores usam IBM Plex Mono.
- Alvos de toque de pelo menos 44px (Portaria: 46–54px).
- Nenhum ícone sem rótulo na navegação.
- Textos em *sentence case* ("Emitir boleto", "Nova reserva"), não em Title Case.

### 2.2 Cores

| Token no mockup | Nome Tailwind sugerido | Claro | Escuro | Uso |
|---|---|---|---|---|
| `--bg` | `canvas` | `#FAFAFA` | `#0E0F12` | Fundo da página; fundo de campos dentro de cards |
| `--card` | `surface` | `#FFFFFF` | `#17181D` | Cards, botões de ícone, bottom nav, sheets |
| `--border` | `line` | `#E4E4E8` | `#262832` | Bordas e divisores 1px |
| `--border-strong` | `line-strong` | `#D3D3D9` | `#33353F` | Botão secundário; barras neutras |
| `--text` | `ink` | `#16181D` | `#ECEDF0` | Texto principal |
| `--dim` | `dim` | `#75767E` | `#90919A` | Texto secundário |
| `--faint` | `faint` | `#A9AAB1` | `#5D5E67` | Eyebrow, placeholder, ícones inativos, horários |
| `--primary` | `brand` | `#4338CA` | `#6C63F5` | Ação principal, item ativo, links |
| `--primary-hover` | `brand-hover` | `#372CB0` | `#8079F7` | Hover do botão primário |
| `--primary-dim` | `brand-soft` | `#EEF0FF` | `#201E3A` | Fundo de item selecionado, destaque "não lido", banners informativos |
| `--primary-ink` | `brand-ink` | `#FFFFFF` | `#FFFFFF` | Texto sobre `brand` |
| `--success` | `ok` | `#16A34A` | `#34D399` | Pago, aprovado, no local, online |
| `--success-dim` | `ok-soft` | `#EAF8EF` | `#122A22` | Fundo de badge/nota de sucesso |
| `--warning` | `warn` | `#B45309` | `#F5A855` | Pendente, atenção, espera longa |
| `--warning-dim` | `warn-soft` | `#FEF3E2` | `#2E2214` | Fundo de badge/nota de atenção |
| `--danger` | `bad` | `#DC2626` | `#F87171` | Vencido, recusado, erro, ação destrutiva |
| `--danger-dim` | `bad-soft` | `#FDECEC` | `#331A1A` | Fundo de badge/nota de erro |
| `--disabled-bg` | `disabled` | `#F1F1F3` | `#1D1E24` | Fundo de controle desabilitado (nos mockups usa-se `opacity: .4`) |
| `--disabled-text` | `disabled-ink` | `#B4B5BC` | `#4A4B54` | Texto desabilitado |
| `--grid-line` | `grid-line` | `#ECECEE` | `#17181D` | Só na grade de fundo do login |

Outros valores fixos: overlay de sheet `rgba(10,10,14,.45)`; texto sobre botão `danger` sólido `#FFFFFF`; toast = fundo `ink` e texto `canvas` (inverte nos dois temas).

**Cores de veículo** (seletor de cor): Prata `#DFE3E8`, Preto `#1C1D22`, Branco `#F5F5F5` (com borda `#D8D8DC`), Cinza `#6B7280`, Vermelho `#B91C1C`, Azul `#1D4ED8`, Verde musgo `#4B5320`, Verde `#166534`, Amarelo `#EAB308`, Laranja `#EA580C`, Marrom `#78350F`, Vinho `#7C2D92`.
**Cores de pet:** Preto `#1C1D22`, Branco `#F5F5F5`, Marrom `#78350F`, Laranja/Caramelo `#EA9E3B`, Cinza `#8A8F98`, Rajado/Mesclado `linear-gradient(135deg,#1C1D22 50%,#F5F5F5 50%)`.

### 2.3 Semântica de status (use sempre estas cores para estes estados)

| Domínio | Estado → cor |
|---|---|
| Boleto | PAGO → `ok` · VENCIDO → `bad` (card com borda `bad` na tela do morador) · EM ABERTO / A VENCER → neutro ou `warn` quando "vence em breve" |
| Reserva | PENDENTE → `warn` · APROVADA → `ok` · RECUSADA / CANCELADA → `bad` |
| Visitante | EM ESPERA → `warn` · NO LOCAL → `ok` · SAIU → neutro |
| Encomenda | AGUARDANDO → `warn` · ENTREGUE → `ok` |
| Chamado (ouvidoria) | ABERTO / NOVO → neutro · EM ANDAMENTO → `brand` · RESOLVIDO → `ok` · categoria SEGURANÇA → `bad` |
| Assembleia | EM VOTAÇÃO → `brand` · AGENDADA → `warn` · ENCERRADA → neutro |
| Notificação | Emergência → `bad` (mesmo depois de lida); demais → neutro |
| Tempo de espera longo | texto e borda `warn` (limites nas telas) |

### 2.4 Tipografia
Fontes (Google Fonts): **Manrope** 400/500/600/700/800 (texto e UI) e **IBM Plex Mono** 400/500/600 (dados).
`font-family`: `'Manrope', system-ui, -apple-system, sans-serif` e `'IBM Plex Mono', ui-monospace, monospace`.

| Uso | Fonte | Tamanho | Peso | Observações |
|---|---|---|---|---|
| Título do app no header | Manrope | 19px | 800 | letter-spacing −0.01em |
| Subtítulo do header (usuário/condomínio) | Mono | 10.5px | 600 | MAIÚSCULAS, cor `brand` |
| Eyebrow da página | Manrope | 11px | 700 | MAIÚSCULAS, +0.06em, `faint` |
| H1 da página | Manrope | 21px (22px em saudação) | 800 | −0.01em |
| Título de seção | Manrope | 11px | 700 | MAIÚSCULAS, +0.05em, `faint` |
| Título de card | Manrope | 14.5px | 700 | |
| Título de linha / item | Manrope | 13.5px | 700 | |
| Corpo / prévia | Manrope | 12.5–13px | 400–500 | `dim`, line-height 1.5 |
| Legenda | Manrope | 11–11.5px | 400–600 | `dim` ou `faint` |
| Botão | Manrope | 13.5–14.5px | 700 | |
| Campo (input) | Manrope | 14px | 400 | |
| Rótulo de campo no sheet | Manrope | 12px | 700 | MAIÚSCULAS, +0.04em, `dim` |
| Aba (rótulo) | Manrope | 12px | 700 | |
| Aba / chip (contador) | Mono | 14px / 12–13px | 600 | |
| Badge | Mono | 9–10.5px | 700 | pílula, MAIÚSCULAS |
| Dado em linha (unidade, apto, placa, hora) | Mono | 12–14px | 600 | |
| Número em destaque (KPI, valor) | Mono | 24–30px | 600 | letter-spacing −0.02em |
| Campo de placa | Mono | 19px | 600 | +0.08em, MAIÚSCULAS |
| Rótulo do bottom nav | Manrope | 9.5px | 600 | |

### 2.5 Layout, espaçamento e forma
- **Container:** `max-width: 412px`, centralizado, `min-height: 100dvh`, fundo `canvas`. No desktop o app aparece como uma coluna de celular.
- **Padding horizontal de página:** 18px. Header: `padding-top: 16px + env(safe-area-inset-top)`, `padding-bottom: 6px`. Page head: `padding-top: 10px`.
- **`main`:** `padding: 14–16px 18px 100–110px` (o espaço de baixo evita o bottom nav). Gap 10px entre cards de lista; 20–22px entre seções.
- **Cards:** borda 1px `line`, raio **14px** (linhas e cards de lista) ou **16px** (hero, KPI, login), padding 14px (lista) / 16px (grande). Divisor interno: 1px `line` com `padding-top` 10–12px.
- **Raios:** botão CTA e busca 12 · campo de sheet 10 · chip 9–10 · aba (container 12 / item 9) · badge e pílula 999 · botão de ícone 11 · FAB 11–12 · mini-botão 8 · sheet 20 (só cantos de cima).
- **Sombras:** praticamente nenhuma. Exceções: card do login `0 1px 2px rgba(16,17,20,.04), 0 20px 40px -28px rgba(16,17,20,.18)`; sheet `0 -10px 40px rgba(0,0,0,.15)`.
- **Safe-area:** respeitar `env(safe-area-inset-top/bottom)` no header e no bottom nav. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Movimento:** sheet `transform .25s ease`; overlay `opacity .2s`; toast `.25s`; switch `.15s`; pulso "ao vivo" 2.4–2.6s `ease-in-out`. **Respeitar `prefers-reduced-motion`** (desligar o pulso).

### 2.6 Tema claro e escuro
- Atributo `data-theme="light|dark"` no `<html>`. Sem atributo, seguir `prefers-color-scheme`.
- Os componentes **não usam `dark:`**: as cores vêm de variáveis CSS que trocam de valor por tema.
- O botão de tema (header ou Perfil) alterna o atributo e **persiste** a escolha (o app já tem um botão de tema; mantenha a lógica de persistência existente).

### 2.7 Implementação sugerida em Tailwind v4 (`src/index.css`)
```css
@import "tailwindcss";

:root {
  --bg:#FAFAFA; --card:#FFFFFF; --border:#E4E4E8; --border-strong:#D3D3D9;
  --text:#16181D; --dim:#75767E; --faint:#A9AAB1;
  --primary:#4338CA; --primary-hover:#372CB0; --primary-dim:#EEF0FF; --primary-ink:#FFFFFF;
  --success:#16A34A; --success-dim:#EAF8EF;
  --warning:#B45309; --warning-dim:#FEF3E2;
  --danger:#DC2626; --danger-dim:#FDECEC;
  --disabled-bg:#F1F1F3; --disabled-text:#B4B5BC;
  --grid-line:#ECECEE;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:#0E0F12; --card:#17181D; --border:#262832; --border-strong:#33353F;
    --text:#ECEDF0; --dim:#90919A; --faint:#5D5E67;
    --primary:#6C63F5; --primary-hover:#8079F7; --primary-dim:#201E3A; --primary-ink:#FFFFFF;
    --success:#34D399; --success-dim:#122A22;
    --warning:#F5A855; --warning-dim:#2E2214;
    --danger:#F87171; --danger-dim:#331A1A;
    --disabled-bg:#1D1E24; --disabled-text:#4A4B54;
    --grid-line:#17181D;
  }
}
:root[data-theme="dark"] {
  --bg:#0E0F12; --card:#17181D; --border:#262832; --border-strong:#33353F;
  --text:#ECEDF0; --dim:#90919A; --faint:#5D5E67;
  --primary:#6C63F5; --primary-hover:#8079F7; --primary-dim:#201E3A; --primary-ink:#FFFFFF;
  --success:#34D399; --success-dim:#122A22;
  --warning:#F5A855; --warning-dim:#2E2214;
  --danger:#F87171; --danger-dim:#331A1A;
  --disabled-bg:#1D1E24; --disabled-text:#4A4B54;
  --grid-line:#17181D;
}

@theme inline {
  --font-sans: "Manrope", system-ui, -apple-system, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --color-canvas: var(--bg);
  --color-surface: var(--card);
  --color-line: var(--border);
  --color-line-strong: var(--border-strong);
  --color-ink: var(--text);
  --color-dim: var(--dim);
  --color-faint: var(--faint);
  --color-brand: var(--primary);
  --color-brand-hover: var(--primary-hover);
  --color-brand-soft: var(--primary-dim);
  --color-brand-ink: var(--primary-ink);
  --color-ok: var(--success);   --color-ok-soft: var(--success-dim);
  --color-warn: var(--warning); --color-warn-soft: var(--warning-dim);
  --color-bad: var(--danger);   --color-bad-soft: var(--danger-dim);

  --radius-card: 14px;
  --radius-hero: 16px;
  --radius-control: 12px;
  --radius-field: 10px;
  --radius-sheet: 20px;
  --spacing-page: 18px;
}
```
Uso: `bg-canvas text-ink`, `bg-surface border border-line rounded-card`, `text-dim`, `bg-brand text-brand-ink`, `bg-ok-soft text-ok`, `font-mono`, `px-page`. Carregue as fontes no `index.html` (`<link>` do Google Fonts) ou via pacote.

### 2.8 Componentes

> Cada componente deve virar um componente React reutilizável (TypeScript), com variantes tipadas.

**C1 — AppHeader**
- Esquerda: título do app (19px/800) e, abaixo, subtítulo em mono (10.5px, MAIÚSCULAS, `brand`). Síndico: "Síndico" + "Ana Laura (síndica)". Portaria: "Portaria" + nome do condomínio. Use **o nome/cargo vindos do usuário logado**, uma única vez (não repita o cargo: no app atual aparecia "(SÍNDICA) (SÍNDICO(A))").
- Direita: botão de tema e botão de sair, 40×40, raio 11, borda `line`, fundo `surface`.
- Variante Morador: saudação (ver `morador-01-home`) em vez do título de app.

**C2 — PageHead**
- Eyebrow (11px MAIÚSCULAS `faint`) + H1 (21px/800) + ações opcionais à direita (FAB ou botão primário). O H1 deve caber em **uma linha**; não coloque controles ao lado dele que forcem quebra: ações vão abaixo ou à direita só se couberem.

**C3 — BottomNav** (fixo, largura 100% até 412px, fundo `surface`, borda superior 1px)
- Item: ícone 20px + rótulo 9.5px/600, empilhados, cor `faint`; ativo `brand`. **Sempre com rótulo.**
- Selo numérico (badge): círculo `brand`, texto branco 9px/700, mín. 15px, no canto do ícone; some quando 0; o número é **dinâmico**.
- Morador (5): Início, Boletos, Reservas, Veículos, Perfil. Portaria (6): Início, Visitantes, Encomendas (selo = aguardando), Reservas, Ouvidoria, Veículos. Síndico (5): Avisos, Reservas (selo = pendentes), Assembleia, Ouvidoria (selo = novos), Condomínio.

**C4 — SegmentedTabs com contador**
- Container: fundo `surface`, borda 1px, raio 12, padding 3, grid de colunas iguais, gap 3. Item: rótulo 12px/700 e, embaixo, contador mono 14px/600; raio 9; ativo `brand-soft` com texto `brand`.
- Usado em: Visitantes (4), Encomendas (3), Reservas portaria (4), Ouvidoria portaria (3), Reservas síndico (3), Assembleias (3), Ouvidoria síndico (3), Painel financeiro (3).

**C5 — FilterChips** (pílulas roláveis): raio 999, borda 1px, texto 12px/700 `dim`, contador mono; ativo `brand-soft` com borda `brand`. Usado em Boletos do morador e do síndico.

**C6 — SearchInput:** altura 44–46, raio 12, ícone de lupa 16px à esquerda (`faint`), foco com outline 2px `brand`.

**C7 — Row / ListCard**
- Card `surface`, borda `line`, raio 14, padding 14. Linha: ícone em caixa 36–38px (fundo `canvas`, borda `line`, raio 10) + bloco de texto (título 13.5px/700, subtítulo 11.5–12px `dim`, dados mono) + à direita badge/valor/ação.
- Lista agrupada: um card com divisores 1px entre linhas (Perfil, Central de ajuda).

**C8 — Badge:** mono 9–10px/700, pílula, padding 3–4px × 7–9px, MAIÚSCULAS; fundo `*-soft` e texto na cor semântica (seção 2.3).

**C9 — Button**
- `primary`: fundo `brand`, texto `brand-ink`, hover `brand-hover`/brightness 1.06, active `translateY(1px)`.
- `secondary`: `surface`, borda `line-strong` (ou `line`), texto `ink`.
- `danger`: fundo `bad`, texto branco. `ghost-danger`: fundo `surface`, texto `bad`.
- `mini` (ação dentro da linha): padding 5×10, 11.5–12px/700, raio 8.
- Alturas: CTA 46–50 (raio 12); ação de card 44–46; Portaria nunca abaixo de 46.
- Desabilitado: `opacity .4` + `cursor: not-allowed`. Foco: outline 2px `brand`, offset 2px.

**C10 — Field / MonoField:** altura 46 (busca 44, placa 54), raio 10–12, borda `line`, fundo `canvas` (dentro de card/sheet) ou `surface` (na página), 14px. Campos de código (placa, bloco, apto, valor) em mono. Textarea: min-height 80–120, sem resize. Foco: outline 2px `brand`, offset 1px. Rótulo acima, 12px/700 MAIÚSCULAS `dim`.

**C11 — ChoiceChips** (seleção única; substitui `<select>` e texto livre): chip raio 9–10, padding 9–10 × 12, 12.5px/600, borda `line`, fundo `canvas`; selecionado: borda `brand`, fundo `brand-soft`, texto `brand`. Semântica: `radiogroup`. **ColorSwatchPicker:** círculos 34–38px; selecionado com borda 2px `brand` e "✓" branco; nome da cor no `title`/legenda.

**C12 — Toggle:** 40×23, trilho `line` (ligado `brand`), thumb branco 18px que desliza 17px; área clicável é o rótulo inteiro. Linha: título 13.5px/700 + descrição 11.5px `dim`.

**C13 — BottomSheet**
- Overlay `rgba(10,10,14,.45)`; sheet fixo embaixo, largura até 412px, fundo `surface`, raio 20 20 0 0, padding 20, `max-height: 92vh` com rolagem interna, entra com `translateY` .25s. Fecha por: overlay, botão "Cancelar/Voltar" ou botão ✕. Título 16.5–17px/800. Rodapé com 2 botões em grid (`1fr 1.4fr`): secundário à esquerda, primário à direita.
- Variante **ConfirmSheet:** título, nota explicando o efeito ("a taxa entra no próximo boleto…"), botão de confirmar (`danger` quando destrutivo).

**C14 — Toast:** fixo, centralizado, `bottom: 84px` (acima do bottom nav; 24px onde não há nav), fundo `ink` e texto `canvas`, raio 10, 13px/600, some em ~2–2.6s. Só aparece **depois do sucesso** da ação real.

**C15 — EmptyState:** card centralizado, caixa de ícone 56–60px, título 14–15px/800, texto 12.5px `dim`. **Texto específico por aba/filtro** (ver cada tela). O estado "tudo em dia" usa ícone de check em `ok`.

**C16 — InlineConfirm (excluir em 2 etapas):** ao tocar na lixeira, o card expande uma linha com "Remover X?" + [Cancelar] [Remover] (`danger`). Nunca excluir com um toque só.

**C17 — StatCard/KPI:** card raio 14–16, rótulo 10.5–11px, número mono 24px (ou 30px no hero). Número "apagado" (`faint`) quando 0; ênfase quando há pendência.

**C18 — ProgressBar:** altura 7–9, raio 999, trilho `line`. Variante **stack** (pago `ok` + atraso `bad`) e variante **com marcador de quórum** (traço vertical 2×14px `ink` na posição do percentual mínimo).

**C19 — InfoBanner/Note:** `brand-soft` com texto `brand` (informativo), `warn-soft`/`warn` (atenção), `bad-soft`/`bad` (bloqueio), `ok-soft`/`ok` (sucesso), 12px, line-height 1.5, raio 10–12, padding 10–13.

**C20 — LiveIndicator:** ponto 6px `ok` pulsando + "AO VIVO" mono 10px `ok`.

**C21 — Thread (conversa):** bolhas máx. 86% de largura, raio 14, padding 10×12, 13px; morador à esquerda (`canvas` + borda); portaria à direita (neutra); síndico à direita (`brand-soft`); rodapé da bolha em mono 10px com autor e tempo relativo. Campo de resposta fixo no rodapé do sheet (input 46px + botão "Enviar"), Enter envia.

**C22 — IconChip/Avatar:** caixa 36–42px raio 10–12; avatar de pessoa: círculo com iniciais (`brand-soft`/`brand`) e, se houver foto, a foto.

### 2.9 Ícones
Use **Lucide React** (traço 2px, cantos arredondados, 15–20px conforme o contexto). Mapeamento sugerido:

| Uso | Lucide |
|---|---|
| Início / Condomínio | `Home` |
| Boletos | `Receipt` ou `FileText` |
| Reservas / calendário | `Calendar` / `CalendarDays` |
| Veículos | `Car` |
| Perfil / pessoa | `User` |
| Moradores adicionais | `Users` |
| Pets | `PawPrint` |
| Ouvidoria / chamado | `MessageSquare` (com alerta: `MessageSquareWarning`) |
| Avisos | `Megaphone` |
| Assembleia | `ClipboardCheck` |
| Encomenda | `Package` |
| Visitantes | `UserCheck` / `UserPlus` |
| QR | `QrCode` |
| Ler etiqueta | `ScanBarcode` |
| Buscar | `Search` |
| Adicionar | `Plus` |
| Voltar | `ChevronLeft` / `ArrowLeft` |
| Avançar | `ChevronRight` |
| Notificações | `Bell` |
| Tema | `Sun` / `Moon` |
| Sair | `LogOut` |
| Segurança | `ShieldCheck` / `Shield` |
| Cadeado | `Lock` |
| Mostrar/ocultar senha | `Eye` / `EyeOff` |
| Excluir | `Trash2` |
| Enviar | `Send` |
| Fixar | `Pin` |
| Menu ⋯ | `MoreVertical` |
| Despesa | `DollarSign` / `Wallet` |
| Ajuda | `HelpCircle` |
| Atenção | `AlertTriangle` |
| Câmera/foto | `Camera` |
| Check | `Check` / `CheckCircle2` |

### 2.10 Conteúdo e formatação
- Idioma **pt-BR**. Moeda: `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` → `R$ 1.234,56`.
- Datas curtas `dd/mm`, completas `dd/mm/aaaa`, hora `HH:mm`. Tempo relativo: "agora", "há 12 min", "há 3 h", "há 2 dias"; boleto: "Venceu há 4 dias", "Vence em 3 dias".
- Unidade: `Bloco 03 · Apto 02` (sempre estruturada em bloco + apto, em mono). Placa: `ABC-1D23` (Mercosul) ou `ABC-1234`, sempre MAIÚSCULA e mono.
- Aspas e apóstrofos tipográficos (’ “ ”) nos textos exibidos; reticências "…" quando necessário.
- Não repetir o cargo/nome do usuário em texto duplicado.

### 2.11 Acessibilidade
- Contraste: texto `ink`/`dim` sobre `canvas`/`surface` e texto de status sobre `*-soft` devem manter contraste legível nos dois temas.
- Foco visível em tudo que é interativo. Elementos clicáveis são `<button>`/`<a>`, nunca `div` sem papel.
- Abas com `role="tablist"`, chips de escolha com `role="radiogroup"`, sheets com `role="dialog"` + `aria-modal` + foco preso e retorno do foco ao fechar, Esc fecha.
- Botões só com ícone têm `aria-label`.
- `prefers-reduced-motion` desliga animações; `aria-live="polite"` no toast.

---

## 3. Telas: Login e Morador

> Em todas as telas: container 412px, tema claro/escuro, textos em pt-BR, estados vazios específicos. As rotas são as que já existem no projeto; **não renomeie rotas**.

### 3.0 Login (compartilhado)
**Ref:** `01-login.html` · **Tag:** `[VISUAL]`
- **Fundo:** `canvas` com grade de linhas de 34px na cor `grid-line`.
- **Marca:** logo 26×26 raio 7 em `brand` (3 barras brancas de alturas diferentes) + "CondoEconomy" 16px/800.
- **Card:** `surface`, raio 16, padding 28/26/24, sombra do login (seção 2.5). Título "Entrar" 19px/700; subtítulo 13.5px `dim`.
- **Seletor de perfil** (3 abas: Síndico · Portaria · Morador) com subtítulo que muda: Síndico "Painel da administração — financeiro, reservas e ouvidoria." · Portaria "Encomendas, visitantes e prestadores de serviço." · Morador "Seus boletos, reservas e chamados em um só lugar."
- **Campos:** E-mail (`autocomplete="email"`), Senha (`current-password`). Linha: checkbox "Lembrar de mim" (accent `brand`) + link "Esqueci minha senha" (`brand`, 700). Botão primário "Entrar" de largura total.
- **Rodapé do card:** ponto `ok` pulsando + "Sincronização em tempo real ativa" (mono 11px) e link "Precisa de ajuda?".
- **Erro de login** (não existe no mockup; extrapolação): InfoBanner `bad` acima do botão, "E-mail ou senha incorretos."
- `[DECISÃO]` O perfil real vem da conta (`ROLE_*` no JWT). O seletor do mockup só muda o texto de ajuda. **Não deixe o seletor influenciar autenticação**, a não ser que o login atual já faça isso. Se não fizer, prefira remover o seletor e manter só um texto genérico.

### 3.1 Home do morador
**Ref:** `morador-01-home.html` · **Tag:** `[VISUAL]`
- **Aviso:** esta é uma versão inicial. **O app real já tem uma home própria** (card de destaque com o próximo boleto, tiles de atalhos como Agendar área, Meus veículos, Assembleia e Ouvidoria, e uma seção "Acompanhe seu condomínio"). **Mantenha a estrutura atual** e aplique só os tokens e componentes desta spec. Do mockup, aproveite:
  - **Header:** saudação "Olá, Carlos" (16.5px/800) e unidade em mono ("BLOCO-B · APTO-204"); à direita, botão de tema e **sino** (36×36). O sino só mostra o ponto `bad` quando há notificação **não lida** e leva a `morador-13`.
  - **Boleto atual:** rótulo, descrição ("Setembro · condomínio"), valor 24px/800, badge "VENCE EM 3 DIAS" (`warn`) e botão "Ver boleto".
  - **Minhas reservas:** linhas com badge PENDENTE/APROVADO e link "Nova reserva".
  - **Encomendas e visitantes:** linha "1 encomenda na portaria · Chegou hoje às 14:20".
  - **Acesso rápido:** tiles "QR de acesso" ("Mostrar na portaria") e "Ouvidoria" (mostra o chamado em andamento).
- **BottomNav do morador (canônico):** Início, Boletos, Reservas, Veículos, Perfil. A Ouvidoria é acessada pelo tile da home e pela Central de ajuda.

### 3.2 Meus boletos
**Ref:** `morador-02-boletos.html` · **Tag:** `[VISUAL]`
- Header com voltar e título "Meus boletos".
- **Resumo:** card com "Em aberto" (valor 19px/800 em `bad` quando há vencido) e "Próximo vencimento" (ex.: "10 out").
- **FilterChips:** Todos · Pendentes · Pagos · Atrasados (o filtro é local).
- **Card de boleto:** descrição ("Agosto · condomínio", 14px/700) + vencimento em mono ("VENCIDO EM 10/08", "VENCE EM 10/09", "PAGO EM 08/07") + badge à direita; rodapé com valor (17px/800) e link de ação: **"Pagar agora"** (vencido), **"Ver boleto"** (em aberto), **"Ver recibo"** (pago). **Vencido:** borda `bad`.
- Estados: lista vazia por filtro.

### 3.3 Reservas (lista, nova reserva, confirmação)
**Ref:** `morador-03-reservas.html` (3 visões na mesma tela) · **Tag:** `[VISUAL]` (+ `[BACKEND]` no motivo de recusa)
- **Lista:** eyebrow "Espaços comuns", H1 "Reservas", FAB 42×42 `brand` com "+". Seção "Minhas reservas atuais": linha com ícone da área, nome, "Sáb, 14 nov · 14h–18h" e badge PENDENTE (`warn`) / APROVADO (`ok`) / REJEITADO (`bad`). BottomNav com Reservas ativo.
- **Nova reserva** (tela cheia com voltar):
  1. "Qual espaço deseja reservar?": 2 cards selecionáveis (Salão de festas, Churrasqueira) com ícone, nome e lotação ("Até 60 / 20 pessoas": **exemplo**, use os dados reais da API). Selecionado: borda `brand` + fundo `brand-soft`.
  2. Data (campo de data).
  3. **Início** e **Fim** (horário livre, padrão 14:00 e 18:00). Validação: fim depois do início; data não passada.
  4. "Lista de convidados (opcional)": campo + botão "Add"; cada convidado vira uma tag removível (`brand-soft`).
  5. InfoBanner: "Reservas estão sujeitas à aprovação do síndico. Valores serão incluídos automaticamente no seu próximo boleto após aprovação."
  6. Botão "Solicitar reserva".
- **Confirmação:** círculo de check (`ok-soft`), "Solicitação enviada!", texto, resumo (Área, Data, Horário, Status PENDENTE) e botão "Ver minhas reservas".
- `[BACKEND]` Quando o síndico recusar, mostrar o **motivo** (campo novo) na linha REJEITADO.

### 3.4 Veículos
**Ref:** `morador-04-veiculos.html` · **Tag:** `[VISUAL]` (`[BACKEND]` para cor e vaga, se não existirem)
- **Lista:** eyebrow "Garagem", H1 "Veículos", FAB. Seção "Meus veículos cadastrados". Linha: caixa 38px **preenchida com a cor do veículo** + ícone de carro (branco em fundos escuros, cinza-escuro em claros), placa em mono 13.5px/700, "Marca Modelo · Cor" e badge mono "VAGA G-14".
- **Cadastro** (tela cheia): Placa (mono, MAIÚSCULA automática, `maxlength 8`), Marca e Modelo (2 colunas), **Cor** (12 swatches da seção 2.2, com nome no `title`), Vaga na garagem (opcional).
- **Confirmação:** "Veículo cadastrado!" + resumo (Placa em mono, Marca/Modelo, Cor, Vaga) + "Ver meus veículos". Texto: a portaria já consegue identificar o veículo na entrada.
- Esses mesmos dados alimentam a consulta de placa da Portaria (`portaria-06`).

### 3.5 Perfil
**Ref:** `morador-05-perfil.html` · **Tag:** `[VISUAL]`
- **Card de perfil** centralizado: avatar 64px (iniciais `brand`/`brand-soft`) com ponto `ok` de sincronização; nome 16.5px/800; badge mono "MORADOR"; unidade em mono ("BLOCO-AMORGOS · APTO-01").
- **Card "Meu QR de acesso"** (`brand-soft`): caixa 44px, título `brand`, subtítulo "Mostrar na portaria", chevron. Abre o QR existente.
- **Grupos de linhas** (C7 agrupada): **Minha unidade** (Dados pessoais · Moradores adicionais · Meus pets · Meus veículos), **Configurações** (Modo escuro [toggle] · Notificações · Segurança e senha), **Suporte** (Central de ajuda). Cada linha: caixa 32px + rótulo 13.5px/600 + chevron.
- **"Sair do aplicativo":** linha centralizada em texto `bad`, sem botão grande.

### 3.6 Dados pessoais
**Ref:** `morador-06-dados-pessoais.html` · **Tag:** `[VISUAL]` (`[BACKEND]` para upload de foto)
- Avatar 76px com botão de editar sobreposto (26px `brand`, ícone de lápis/câmera) e dica "Toque no ícone para alterar a foto".
- **Editáveis:** Nome completo; Telefone (WhatsApp) com máscara `(00) 00000-0000`.
- **Somente leitura**, em grupo "Vinculado à unidade": E-mail, Apartamento, Bloco (valores em mono), com nota de cadeado: "E-mail, apartamento e bloco são definidos pela administração. Pra mudar algo aqui, fale com a Central de Ajuda." **O morador não pode editar a própria unidade** (a API também deve impedir).
- Botão "Salvar alterações" → toast "Alterações salvas".

### 3.7 Moradores adicionais
**Ref:** `morador-07-moradores-adicionais.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` no acesso ao app)
- Header com voltar, título e FAB 38px. Seção "Quem mais mora no apartamento".
- **Linha:** ícone, nome, parentesco; badge mono verde "COM ACESSO AO APP" quando tem login próprio; lixeira → **InlineConfirm** ("Remover Fulana?").
- **Sheet "Novo morador":** Nome completo; **Grau de parentesco** em chips (Cônjuge · Filho(a) · Pai · Mãe · Outro, com campo "Especifique o parentesco" em "Outro"); toggle **"Dar acesso ao aplicativo"** (descrição: "Enviamos um convite por e-mail pra essa pessoa criar o próprio login e ver boletos, reservas etc.") que revela o campo de e-mail; botões Cancelar/Salvar. Toast "Morador adicionado"; o item entra na lista.
- `[BACKEND]` Parentesco padronizado e fluxo de convite por e-mail.

### 3.8 Meus pets
**Ref:** `morador-08-pets.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` para cor e foto)
- **Por que existe:** o síndico e a portaria identificam o dono de um animal numa ocorrência (ex.: gato que arranhou um carro) pela **cor, espécie e raça**. Por isso cor e foto são importantes.
- InfoBanner no topo: "Cadastre com cor e raça certas — é assim que a portaria e o síndico identificam seu pet em caso de ocorrência (ex: um animal solto ou uma reclamação de vizinho)."
- **Linha:** avatar 42px preenchido com a **cor do pet** + ícone de pata branco; nome; "Espécie · Cor · Raça"; lixeira com InlineConfirm.
- **Sheet "Novo pet":** upload de foto (caixa tracejada 56px + dica "Uma foto ajuda muito na hora de identificar o pet numa ocorrência."), Nome, **Espécie** em chips (Cachorro · Gato · Outro + campo), **Cor predominante** (6 swatches da seção 2.2 + "Selecionado: Preto"), Raça (opcional, texto livre).

### 3.9 Configurar notificações
**Ref:** `morador-09-config-notificacoes.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` nos tipos novos)
- Texto de apoio: "Escolha como quer ser avisado — cada tipo de aviso tem o canal que faz mais sentido pra ele."
- **Tabela** (card): cabeçalho "Tipo de aviso | Push | E-mail"; linhas com ícone, título e subtítulo; interruptor só nos canais que fazem sentido, "—" nos outros:
  - Encomendas: só Push · Boletos: Push + E-mail · Reservas: só Push · Comunicados do síndico: Push + E-mail · Resumo semanal: só E-mail.
  - **Emergência (pânico e avisos urgentes):** cadeado nos dois canais, **sempre ativa**.
- Nota `warn`: "Avisos de emergência (pânico, comunicados urgentes) ficam sempre ativos em todos os canais — não é possível desativar."
- Botão "Salvar preferências" → toast "Preferências salvas".
- `[BACKEND]` **Recomendado:** incluir as categorias **Ouvidoria (respostas aos meus chamados)** e **Votações (nova pauta aberta)**. Sem elas o morador não é avisado dessas coisas.

### 3.10 Segurança e senha
**Ref:** `morador-10-seguranca-e-senha.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` em sessões)
- Banner informativo: "Sua senha nunca é armazenada em texto puro (usamos hash) e toda a conexão com o servidor é criptografada via HTTPS. Nunca compartilhe sua senha com terceiros ou com a portaria." **Não escreva "criptografia de ponta a ponta"** (é tecnicamente incorreto para este sistema).
- **Alterar senha:** Senha atual · Nova senha · Confirmar nova senha, **todos com botão de mostrar/ocultar** (`Eye`/`EyeOff`).
  - **Força da nova senha** (3 barras + rótulo): ≥ 8 caracteres = 1 barra ("Senha fraca", `bad`); com maiúscula e número = 2 ("Senha média", `warn`); com símbolo e ≥ 10 caracteres = 3 ("Senha forte", `ok`).
  - **Confirmação:** se diferente, borda `bad` e texto "As senhas não coincidem."
  - Botão "Atualizar senha". Use o endpoint atual de troca de senha.
- **Sessões ativas** (`[BACKEND]`): linha por dispositivo (ícone, "iPhone de Carlos", "Aracaju, SE · agora"); a atual com badge "ESTE DISPOSITIVO"; as outras com link "Encerrar". Botão `danger`-suave **"Encerrar todas as outras sessões"** (**não** derruba a sessão atual) + nota "Isso desconecta qualquer dispositivo que não seja este, sem afetar sua sessão atual."

### 3.11 Central de ajuda
**Ref:** `morador-11-central-de-ajuda.html` · **Tag:** `[VISUAL]`
- Header com voltar + busca "Buscar em perguntas frequentes" (filtra o FAQ ao digitar).
- **Perguntas frequentes** (acordeão em um card, sinal "+" que gira 45° ao abrir): (1) Como funciona a aprovação de reservas? (PENDENTE até o síndico analisar, em até 48h; a taxa entra no próximo boleto após aprovar) · (2) Quando meu boleto é gerado? · (3) Como cadastro meu veículo ou pet? · (4) Por que não recebi uma notificação? (conferir Perfil → Notificações; emergência sempre chega) · (5) Posso dar acesso ao app pra outro morador? (Moradores adicionais → "Dar acesso ao aplicativo"). **Ajuste os textos às regras reais** (ex.: dia de vencimento).
- **Canais oficiais:** "Falar com o síndico" (subtítulo "Abrir chamado via ouvidoria" → `morador-12`) e "Ligar para portaria" ("Atendimento 24h", link `tel:`). **Documentos:** "Regimento interno" e "Convenção do condomínio" (abrem os PDFs existentes). Todas as linhas com **chevron** (não use o ícone de link externo).
- **Card de suporte** (`brand-soft`): "Problemas com o app?" + texto + botão "Enviar e-mail" (`mailto:`).
- Rodapé discreto em mono: "CONDOECONOMY · V1.0.0" (leia a versão real do `package.json`/ambiente).

### 3.12 Ouvidoria do morador
**Ref:** `morador-12-ouvidoria.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` na conversa)
- **Lista:** ícone de mensagem + "Ouvidoria" (19px/800) + "Fale direto com a administração." + FAB. Card de chamado: assunto (14px/700) + badge (**ABERTO** neutro · **EM ANDAMENTO** `brand` · **RESOLVIDO** `ok`), prévia da mensagem, e rodapé com categoria em mono ("RECLAMAÇÃO") e data.
- **Nova mensagem** (tela cheia): **Categoria em chips** (Reclamação · Manutenção · Segurança · Sugestão · Elogio · Outro), Assunto, Mensagem (textarea, `maxlength 500`, contador "0/500"), botão com ícone `Send`. Sucesso: toast "Mensagem enviada" e o chamado novo aparece no topo como ABERTO.
- `[DECISÃO]` Rótulo do botão: o app diz "Enviar para Síndico", mas a portaria atende primeiro e escala se necessário. Prefira "Enviar" ou "Enviar para a administração".
- `[BACKEND]` **Recomendado:** ao tocar no chamado, abrir a **conversa** (C21) com as respostas da portaria/síndico. Hoje a lista só mostra a mensagem inicial.

### 3.13 Notificações (lista)
**Ref:** `morador-13-notificacoes.html` · **Tag:** `[VISUAL]` (`[BACKEND]` se não houver estado "lida")
- Header: voltar + "Notificações (2)" (contador de não lidas) + link "Marcar todas como lidas" (`brand`, 12px/700).
- **Item:** ícone em caixa 38px por categoria (Encomenda `Package`, Boleto `Receipt`, Reserva `Calendar`, Comunicado `Megaphone`, **Emergência `AlertTriangle` em `bad-soft` sempre**), título 13.5px/700, mensagem 12px `dim`, tempo em mono ("HÁ 12 MIN", "ONTEM", "HÁ 2 DIAS").
- **Comportamento (definitivo):**
  - Não lida: fundo `brand-soft` + ponto de 7px `brand` ao lado do título.
  - Ao tocar (ou em "Marcar todas"): some o fundo, **mas o ponto continua nas notificações de hoje** (ele passa a significar "foi hoje", não "não lida"). Notificações de dias anteriores não têm ponto.
  - O contador do título e o ponto do sino na Home acompanham as não lidas.
- **Estado vazio:** sino grande + "Nenhuma notificação por enquanto".
- **Não implemente** a faixa amarela e os botões "Pré-visualizar" do mockup (são só demonstração). O app mostra a lista ou o estado vazio **automaticamente**, conforme os dados.

---

## 4. Telas: Portaria

> Regra do perfil: **botões grandes (≥ 46px)** e **dados em mono**. Header "Portaria" + nome do condomínio. BottomNav de 6 itens (seção 2.8, C3).

### 4.1 Painel
**Ref:** `portaria-01-painel.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` no feed)
- **Ações rápidas** (grade 2×2, tiles de 92px de altura, raio 16, ícone 22px `brand`, rótulo 13.5px/700): **Registrar visitante** (principal, fundo `brand`, ícone e texto brancos) · Receber encomenda · Ler QR de acesso · Consultar placa. Cada tile leva à tela correspondente.
- **Visão geral:** 3 cards lado a lado (Encomendas aguardando · Visitantes hoje · Ouvidoria pendente), cada um com ícone em caixa de 28px e número mono 24px. **Zero fica "apagado" (`faint`); número maior que zero ganha ênfase** (ícone `brand-soft` nas encomendas, `warn-soft` na ouvidoria). Os cards são clicáveis.
- **Atividade recente** + LiveIndicator "AO VIVO" (`[BACKEND]`, via WebSocket): linhas com horário mono (`HH:mm`), evento em negrito ("Encomenda registrada", "Visitante entrou", "Encomenda entregue", "Visitante saiu") e detalhe ("Bloco 05 · Apto 201").

### 4.2 Visitantes
**Ref:** `portaria-02-visitantes.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` nos estados e campos novos)
- **PageHead:** eyebrow "Controle de acesso", H1 "Visitantes hoje". Abaixo, 2 botões de 50px: **"Ler QR"** (secundário, ícone `QrCode`) e **"Registrar"** (primário, `UserPlus`). Busca "Buscar visitante, apto ou placa". **Abas:** Todos · Espera · No local · Saíram (com contadores).
- **Card:** nome 14.5px/700; tipo (Visitante/Prestador/Entregador/Motorista de app) e tag mono "CONVITE QR" quando o morador convidou; badge **EM ESPERA** (`warn`) / **NO LOCAL** (`ok`) / **SAIU** (neutro); destino em mono ("Bloco 03 · Apto 102"); meta em mono: espera → "Aguardando há N min" (**≥ 5 min: texto e borda do card em `warn`**); no local → "Entrada 13:58", "42 min no local", placa; saiu → "Entrada" e "Saída".
- **Ação por card (botão 46px):** Espera → **"Liberar entrada"** (primário) → vira No local · No local → **"Registrar saída"** (secundário) → vira Saíram · Saíram → sem ação. Os contadores atualizam.
- **Ordem:** Espera, No local, Saíram.
- **Sheet "Registrar visitante":** Nome; Tipo (chips: Visitante · Prestador · Entregador · Motorista de app); Destino (Bloco e Apto, mono); Placa (opcional, mono MAIÚSCULA, 8 caracteres). Ao registrar: entra em **Espera**, a aba Espera é selecionada, toast "Visitante registrado na espera".
- **Vazios por aba:** Todos "Nenhum visitante hoje — Registre entradas na hora ou leia o QR de convite." · Espera "Ninguém na espera — Quando alguém chegar, ele aparece aqui até ser liberado." · No local "Ninguém no local agora — Visitantes liberados ficam aqui até registrar a saída." · Saíram "Nenhuma saída hoje — As saídas registradas aparecem aqui." · Busca "Nada encontrado".
- `[DECISÃO]` Assumi que **Espera = aguardando liberação**. Confirme o significado no sistema.
- `[BACKEND]` Status ESPERA/NO_LOCAL/SAIU, tipo, placa, flag de convite QR, horários de entrada e saída. "Ler QR" abre o leitor existente.

### 4.3 Encomendas
**Ref:** `portaria-03-encomendas.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` em "retirada por")
- **PageHead:** eyebrow "Recepção", H1 "Encomendas"; botões **"Ler etiqueta"** (secundário, `ScanBarcode`) e **"Receber"** (primário). Busca "Código, morador ou unidade". Abas: Todas · Aguardando · Entregues (contadores).
- **Card:** **a unidade vem primeiro** (mono 14.5px/600, "Bloco 05 · Apto 201") + badge AGUARDANDO (`warn`) / ENTREGUE (`ok`); "Destinatário · Transportadora" (13px); código de rastreio em mono 11px `faint`; meta mono: "Chegou 05/11 · 16:21 · há 2 dias" (**aguardando há ≥ 3 dias: texto e borda `warn`**); entregue: "Retirada 06/11 · 10:05 · por João Lima (destinatário)".
- **Ação:** "Entregar" (primário, 46px) nos aguardando.
- **Ordem:** aguardando primeiro, **mais antigas no topo**; entregues, mais recentes primeiro. O **selo do BottomNav** mostra quantas estão aguardando.
- **Sheet "Confirmar entrega":** resumo (unidade · nome), **"Quem está retirando?"** (chips "O próprio destinatário" / "Outra pessoa", esta revela "Nome de quem retirou"), botão "Confirmar entrega". Grava **quem retirou**.
- **Sheet "Receber encomenda":** nota "Registre na chegada, o morador é avisado."; Destino (Bloco e Apto); Destinatário ("Nome na etiqueta"); **Transportadora em chips** (Correios · Mercado Livre · Amazon · Shopee · Outra); Código de rastreio (opcional, mono); botão "Registrar e avisar". Toast "Encomenda registrada, morador avisado" (o morador recebe push).
- Guarde a unidade como **bloco + apto separados** (formato único, busca confiável).
- **Vazios por aba** (mesmo padrão de 4.2).

### 4.4 Reservas e convidados
**Ref:** `portaria-04-reservas-e-convidados.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` no check-in)
- **Função:** a portaria **acompanha** as reservas (quem aprova é o síndico) e **confere os convidados** na chegada. PageHead: eyebrow "Áreas comuns", H1 "Reservas e convidados"; busca "Buscar reserva, morador ou área"; abas **Hoje (padrão)** · Solicitações · Aprovadas · Recusadas.
- **Aba Hoje:** card com ícone da área, nome, horário mono ("14:00–18:00") e badge de situação: **EM ANDAMENTO** (`ok`, card com borda `ok`) · **COMEÇA ÀS 18:00** (`brand-soft`) · **ENCERROU** (neutro); "Bloco 05 · Apto 201 · Ana Beatriz"; linha "**2 de 6** convidados chegaram" + link "Ver lista/Ocultar".
  - **Lista expandida:** cada convidado com botão de 40px **"Chegou"** que vira "✓ 14:32" (`ok-soft`, mono); tocar de novo desfaz. Convidados adicionados na hora ganham o rótulo "Adicionado na portaria". Campo "Adicionar convidado" + "Add".
  - **Sem lista enviada:** nota `warn` "O morador não enviou lista. Confirme com ele antes de liberar a entrada."
- **Solicitações:** somente leitura, badge **AGUARDANDO SÍNDICO**, com dia e horário na linha. **Aprovadas:** agenda agrupada por dia (Hoje, Amanhã, "Sáb, 14 nov"). **Recusadas:** badge RECUSADA.
- `[BACKEND]` Check-in por convidado (com horário), convidado adicionado pela portaria. **Ideia futura:** o "Chegou" poderia registrar a pessoa em Visitantes.

### 4.5 Ouvidoria (atendimento)
**Ref:** `portaria-05-ouvidoria.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` na conversa e na escalada)
- **PageHead:** eyebrow "Atendimento" + LiveIndicator, H1 "Ouvidoria"; busca "Buscar assunto, morador ou unidade"; abas **Abertos · Em andamento · Resolvidos**.
- **Card:** tag mono da categoria (**SEGURANÇA em `bad`**) e tempo ("há 8 min"; **sem atendimento há ≥ 3 h: texto e borda `warn`**); assunto 14.5px/700; prévia (2 linhas); rodapé com unidade mono + "· Nome" e link "Ver conversa" / "Conversa (n)".
- **Ações:** Abertos → **"Iniciar atendimento"** · Em andamento → **"Responder"** + **"Resolver"** · Resolvidos → "Resolvido há X" + **"Reabrir"**.
- **Ordem em Abertos:** Segurança primeiro, depois os mais antigos.
- **Conversa** (sheet com Thread, C21): autor e tempo em cada bolha; campo "Escrever resposta ao morador". Em Abertos, a **primeira resposta inicia o atendimento** e move o chamado para Em andamento (dica: "Ao responder, o atendimento é iniciado e o chamado vai para Em andamento."). Em Resolvidos: nota `ok` "Chamado resolvido … Reabra para responder novamente."
- **Vazios:** Abertos "Nenhum chamado aberto — Chamados de moradores aparecem aqui em tempo real." etc.
- `[BACKEND][DECISÃO]` **Escalar para o síndico** (não está no mockup, mas o fluxo existe: a tela do síndico recebe os "chamados escalados"). Adicione em Em andamento um botão secundário **"Escalar para o síndico"** que abre um sheet com **"Nota para o síndico"** (obrigatória, explicando por que escalou). Depois de escalar, o card mostra o badge **ESCALADO AO SÍNDICO** (`brand-soft`) e some a ação de escalar. A nota aparece na tela do síndico (5.4).

### 4.6 Veículos (consultar placa)
**Ref:** `portaria-06-veiculos-consultar-placa.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` na busca e no aviso)
- **PageHead:** eyebrow "Garagem e acesso", H1 "Consultar placa". **Card de busca:** rótulo "PLACA DO VEÍCULO"; campo de 54px com lupa e botão limpar (×), texto mono 19px/600 +0.08em; **MAIÚSCULA automática e traço após o 3º caractere**; botão "Consultar" (primário, 54px).
  - **Validação:** habilitado só com 7 caracteres válidos (`^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$`, cobre Mercosul e antiga). Se tiver 7 e for inválida: dica `warn` "Formato inválido. Use ABC-1D23 (Mercosul) ou ABC-1234.". Dica padrão: "Digite a placa inteira, ou só um pedaço para ver sugestões." Enter consulta.
- **Sugestões** (2 a 6 caracteres): lista de até 5 placas que contêm o trecho, entre veículos de moradores e visitantes no local; linha: placa mono, "Modelo · Cor", e à direita **MORADOR** (`ok`) + unidade ou **VISITANTE** (`brand`) + "no local". Tocar consulta. Sem resultado: "Nenhuma placa parecida entre moradores e visitantes no local."
- **Repouso (sem digitar):** seção **"Visitantes com veículo no local"** (placa, "Nome → destino", tempo no local) e **"Consultas recentes"** (placa, "há 12 min", rótulo MORADOR / VISITANTE / NÃO ENCONTRADA).
- **Resultado:** card com badge **VEÍCULO DE MORADOR** (`ok`, borda `ok`) / **VISITANTE NO LOCAL** (`brand-soft`) / **NÃO ENCONTRADA** (`warn`, borda `warn`); **placa em destaque** (caixa com borda 2px `ink`, raio 9, mono 24px/600 +0.1em); linha do carro com bolinha da cor + "Modelo · Cor".
  - Morador: Unidade, Morador, Vaga. Visitante: Visitante, Destino, Entrada (hora · tempo no local). Não encontrada: texto explicativo.
  - **Ações:** "Avisar morador" / "Avisar morador do destino" (push; **a portaria não vê o telefone do morador**) + "Nova consulta". Não encontrada: **"Registrar como visitante"** (abre o cadastro de `4.2` com a placa preenchida) + "Nova consulta".
- `[BACKEND]` Busca por placa e por trecho (veículos de moradores + visitantes ativos), endpoint de "avisar morador".

---

## 5. Telas: Síndico

> Header "Síndico" + "Ana Laura (síndica)" (nome e cargo **do usuário logado, uma vez só**). BottomNav de 5 itens: **Avisos · Reservas · Assembleia · Ouvidoria · Condomínio** (o item "Condomínio" é o Painel financeiro).

### 5.1 Início (Avisos)
**Ref:** `sindico-01-inicio-avisos.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` nos recursos de aviso e nos agregados)
- **Problema resolvido:** a primeira tela do síndico era só a lista de avisos que ele mesmo publicou. Agora ela responde "o que precisa de mim hoje?" **antes** do mural.
- **Saudação:** "Bom dia/Boa tarde/Boa noite, Ana Laura" (22px/800, pela hora) + data por extenso e condomínio (12.5px `dim`).
- **Atalhos** (chips): Moradores · Encomendas · Segurança. `[DECISÃO]` Os nomes são suposição sobre os 3 ícones sem rótulo do header atual; **mantenha os destinos que já existem** e só adicione rótulo de texto.
- **"Precisa da sua atenção"** (card agrupado, linhas clicáveis com chevron): **Reservas para aprovar** (ícone `warn-soft`; "A mais antiga espera há 1 dia"; contador mono 20px) · **Chamados abertos** (`bad-soft`; "1 é de segurança") · **Boletos vencidos** (`brand-soft`; "R$ 2.880,00 em aberto"). Leva a Reservas, Ouvidoria e Painel financeiro. `[BACKEND]` agregados (podem vir de endpoints existentes).
- **"Hoje no condomínio":** 3 StatCards (Visitantes hoje · Encomendas aguardando · Reservas hoje).
- **Mural de avisos:** H2 18px/800 + botão **"Novo aviso"** (primário 38px).
  - **Card de aviso:** borda esquerda de **3px `brand`**; título 14.5px/700 (com ícone `Pin` 13px `brand` se fixado); tag mono da categoria; chip de data mono ("03/09/2026", `brand` sobre `brand-soft`) + menu ⋯; texto 12.5px `dim`; rodapé: "Enviado por: Síndico" (`brand`, 11px/700) e, à direita, **"Visto por 118 de 168"** (mono 10px) com barra de 4px `ok`. `[BACKEND]` visualizações.
  - **Menu ⋯:** "Fixar no topo/Desafixar" e "Excluir" (com InlineConfirm "Excluir este aviso?").
  - **Ordem:** fixados primeiro, depois os mais recentes. Estado vazio: "Nenhum aviso publicado. Use "Novo aviso" para comunicar algo aos moradores."
  - **Sheet "Novo aviso":** Título; Mensagem; **Categoria** (chips: Aviso geral · Manutenção · Limpeza · Segurança · Evento · Financeiro); **Quem recebe** (chips "Todo o condomínio" / "Blocos específicos", este revela uma grade de 7 colunas com botões 01–14 de seleção múltipla); texto de alcance em mono ("Alcance: 168 unidades" / "Alcance: 2 bloco(s) · 24 unidades" / "Escolha ao menos um bloco"); toggles **"Fixar no topo do mural"** e **"Notificar moradores agora"** ("Envia push. Quem desativou comunicados nas preferências não recebe.", ligado por padrão). "Publicar aviso" só habilita com título, mensagem e alcance > 0. Toast "Aviso publicado para 168 unidades · push enviado".
  - `[BACKEND]` Categoria, audiência por blocos, fixado, contagem de visualizações, push opcional.

### 5.2 Reservas (aprovações)
**Ref:** `sindico-02-reservas.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` em motivo, taxa e conflito)
- **PageHead:** eyebrow "Aprovações", H1 "Reservas"; abas **Pendentes · Aprovadas · Recusadas** (contadores). O **selo de Reservas no BottomNav** = pendentes.
- **Card pendente:** ícone da área, nome, "Sáb, 14 nov · 19:00–23:00" (mono) e "há 3 h" à direita; "Bloco 05 · Apto 201 · Ana Beatriz"; linha com "**25** convidados" e "Taxa **R$ 250,00**"; **situação financeira da unidade** (ponto `ok` "Unidade em dia" / `warn` "Unidade com 1 boleto vencido"); ações **[Recusar] [Aprovar]** (Aprovar em `brand`). **Ordem:** os mais antigos primeiro.
  - **Conflito com reserva já aprovada** (mesma área e horário sobrepostos): card com borda `bad`, nota `bad-soft` "Conflita com reserva já aprovada (Bloco 07 · Apto 302, 15:00–20:00). Não dá para aprovar." e **botão Aprovar desabilitado**.
  - **Concorrência com outra solicitação pendente:** nota `warn-soft` "Concorre com outra solicitação no mesmo horário (unidade, pedida há 1 dia). Aprovar uma bloqueia a outra." Ao aprovar uma, a outra passa a ter o conflito acima.
- **Aprovar** → ConfirmSheet "Aprovar reserva": resumo (Área, Quando, Unidade, Morador) + nota "A taxa de R$ 250,00 entra automaticamente no próximo boleto da unidade e o morador é notificado." (+ aviso se houver rival). Botão "Confirmar aprovação". Toast "Reserva aprovada, morador notificado".
- **Recusar** → sheet com **Motivo obrigatório** em chips (Horário indisponível · Área em manutenção · Fora das regras do regimento · Outro motivo); botão "Confirmar recusa" (`danger`) desabilitado até escolher. O morador **vê o motivo**.
- **Aprovadas:** agenda por dia; ação **"Cancelar reserva"** (`ghost-danger`) → sheet com motivo e nota "A taxa é removida do boleto e o morador é notificado do cancelamento." → vai para Recusadas como **CANCELADA**.
- **Recusadas:** badge RECUSADA/CANCELADA + nota "Motivo informado ao morador: …".
- **Vazios:** Pendentes mantém "**Tudo em dia!** Não há reservas aguardando sua aprovação." (ícone de check `ok`).
- `[BACKEND]` Taxa por área (exemplos: Salão R$ 250, Churrasqueira R$ 80, **vêm da configuração**), decisão com motivo, **validação de conflito no servidor** (o front só antecipa), cancelamento com remoção da taxa, situação financeira da unidade.

### 5.3 Assembleias
**Ref:** `sindico-03-assembleias.html` · **Tag:** `[BACKEND]` (módulo novo; o visual pode ser feito já)
- **PageHead:** eyebrow "Decisões", H1 "Assembleias", botão **"Nova pauta"** (primário) ao lado do título; abas **Em votação · Agendadas · Encerradas**.
- **Card:** título, badge (EM VOTAÇÃO `brand-soft` · AGENDADA `warn-soft` · ENCERRADA neutro), descrição; tempo em mono ("Encerra em 2 dias · 12/11 · 20:00"; **menos de 24 h → `warn`**, "Encerra em 5 h").
  - **Participação:** "72 de 168 unidades · 43%" + barra com **marcador do quórum mínimo**; barra `ok` ao atingir, `warn` abaixo; nota "Quórum atingido" (`ok`) ou "Faltam 12 unidades para o quórum" (`warn`).
  - **Resultado por opção:** rótulo, "41 · 57%" (mono) e barra de 7px; a **líder em `brand`**, as outras em `line-strong`.
  - **Ações:** Em votação → **"Lembrar quem falta"** (envia lembrete só às unidades que não votaram; toast "Lembrete enviado a N unidades que ainda não votaram") e **"Encerrar agora"** (ConfirmSheet). Agendada → "Abre em dd/mm · hh:mm · encerra …", opções em chips, "Quórum mínimo 50%", **"Cancelar pauta"** (ConfirmSheet). Encerrada → "Encerrada em …", participação final ("Quórum não atingido (55 de 84 unidades necessárias)" quando for o caso), resultado, **"Opção mais votada: X"** e **"Baixar resultado (PDF)"**.
  - **Não escreva "Aprovada/Rejeitada".** Mostre só a opção mais votada: regras de maioria e quórum dependem da convenção e da lei.
- **Sheet "Nova pauta":** Título; Descrição; **Tipo** (Sim / Não / Abstenção · Múltipla escolha, esta com 2 campos iniciais e "+ Adicionar opção" até 5); **Início** (Agora · Agendar, este revela data e hora); **Duração** (24 horas · 3 dias · 7 dias); **Quórum mínimo** (30% · 50% · 66%); toggles **"Mostrar resultado parcial aos moradores"** (desligado: só o síndico acompanha a contagem até encerrar) e **"Notificar moradores ao abrir"** (ligado). Nota: "Cada unidade tem 1 voto, registrado pelo morador titular. Confira na convenção do condomínio o quórum e o prazo de convocação exigidos." "Publicar pauta" só habilita com título, descrição e opções válidas.
- **Vazio geral:** ícone de gráfico + "Nenhuma assembleia — Crie uma nova pauta para os moradores votarem."
- `[BACKEND]` Pauta, opções, **votos (1 por unidade, pelo titular)**, quórum, janela de votação, notificação de abertura, exportação em PDF. A tela de voto do morador **não foi desenhada** (hoje há só o tile "Assembleia" na home).
- `[DECISÃO]` Peso do voto (por unidade ou por fração ideal), quórum e prazos de convocação, regra de maioria, e validade do voto online: **validar com advogado/convenção**.

### 5.4 Ouvidoria (chamados escalados)
**Ref:** `sindico-04-ouvidoria.html` · **Tag:** `[VISUAL]` (+ `[BACKEND]` na escalada e na conversa)
- **PageHead:** eyebrow "Ouvidoria" + LiveIndicator, H1 "Demandas dos moradores" (**uma linha**), apoio "Chamados escalados pela portaria para a administração."; busca; abas **Novos · Em andamento · Resolvidos**. O **selo de Ouvidoria no BottomNav** = novos.
- **Substitui:** o filtro `<select>` "Todos os Status" (virou abas com contador) e o botão de atualizar (a tela é em tempo real; se no sistema real ela **não** atualiza sozinha, mantenha o botão).
- **Card:** tag da categoria (+ SEGURANÇA `bad`) e "Escalado há 20 min" (**≥ 24 h sem ninguém assumir: `warn` + borda `warn`**); assunto; prévia; caixa **"Nota da portaria: …"** (fundo `canvas`, borda, 12px, até 3 linhas) explicando por que foi escalado; rodapé com unidade mono + nome e "Conversa (n)".
- **Ações:** Novos → **"Assumir atendimento"** · Em andamento → **"Responder"** + **"Resolver"** · Resolvidos → "Resolvido há X" + **"Reabrir"**. **Ordem em Novos:** Segurança primeiro, depois os mais antigos.
- **Conversa:** bolhas de **morador** (esquerda), **portaria** (direita, neutra) e **síndico** (direita, `brand-soft`, autor "Você"). A primeira resposta **assume** o chamado (Novos → Em andamento).
- **Resolver** → sheet "Resolver chamado" com **"Resposta final ao morador (opcional)"**; toast "Chamado resolvido, morador notificado".
- **Vazio em Novos:** ícone de check em anel `ok` + "**Tudo em dia!** Nenhum chamado escalado para a administração no momento."
- `[BACKEND]` Status ESCALADO/EM_ANDAMENTO/RESOLVIDO, nota da portaria, mensagens com papel do autor, resolução com mensagem final, notificação ao morador.

### 5.5 Painel financeiro (aba Condomínio)
**Ref:** `sindico-05-painel-financeiro.html` · **Tag:** `[BACKEND]` (a maior parte; o visual pode ser feito já)
- **PageHead:** eyebrow "Tesouraria", H1 "Painel financeiro". **Dois botões de larguras iguais** abaixo do título: **"Emitir boleto"** (primário) e **"Lançar despesa"** (secundário). (No app atual o título quebrava em 2 linhas e um botão passava da borda.)
- **Card de saldo (hero):** rótulo "Saldo do mês · Novembro/2026"; valor mono 30px/600 (negativo → `bad` com "−"); linha de 3 mini-números: **Arrecadado · Em atraso (`bad`) · Despesas**. **Saldo = arrecadado − despesas.**
- **Card de arrecadação:** "R$ 102.700,00 de R$ 109.200,00" + percentual; **barra empilhada** (pago `ok` + atraso `bad` + restante `line`) com legenda "158 pagos · 10 em atraso".
- **Alerta de inadimplência** (`bad-soft`, só se houver atraso): "**Inadimplência de 6,0%**" (unidades em atraso ÷ unidades) + "10 unidades com boleto em atraso, somando R$ 6.500,00 (sem multa e juros)." + botões **"Ver inadimplentes"** (abre Boletos filtrado em Vencidos e rola até as abas) e **"Enviar cobrança"** (lembrete a todas as inadimplentes; registra na auditoria).
- **Abas:** **Boletos · Despesas · Auditoria** (curtas, com contador; no app atual eram longas e a terceira ficava cortada).
- **Boletos:** busca "Buscar unidade ou morador"; FilterChips **Todos · Vencidos · Em aberto · Pagos** (contadores), **padrão "Vencidos"**. Linha: ícone (`bad-soft` vencido / `ok-soft` pago / neutro), unidade mono 13px/600, nome 12px `dim`, "**Venceu há 4 dias**" (`bad`, 700) / "Vence em N dias · dd/mm" / "Pago em dd/mm"; à direita valor mono + mini-botão **"Dar baixa"** (ou badge PAGO). Ordem: vencidos (mais atrasados primeiro), em aberto (por vencimento), pagos (recentes). Paginação "Mostrar mais (N)".
  - **Tocar na linha** abre o **detalhe** (sheet): Descrição, Vencimento, Valor original; **vencido:** Multa, Juros (dias) e **Total atualizado**; **pago:** Pago em e Forma (com "(baixa manual)" quando for o caso). Ações: **"Enviar lembrete"** e **"Dar baixa"**.
  - **Dar baixa** (confirmação obrigatória): **Forma de pagamento** (chips PIX · Dinheiro · Transferência · Outro), **Data** (padrão hoje), **Valor recebido** (preenchido com o total atualizado; mono); nota "A baixa manual fica registrada na Trilha de auditoria com o seu nome."; "Confirmar baixa". Toast "Baixa registrada em Bloco X · Apto Y".
  - `[DECISÃO]` **Multa e juros:** o mockup usa multa de **2%** e juros de **1% ao mês, proporcionais aos dias**. São os valores usuais quando a convenção não define outros. **Confirme com a convenção** do condomínio. Os valores devem vir de configuração, não fixos no código.
- **Despesas:** linha de resumo "Total R$ 93.700,00 · pagas R$ 63.600,00 · a pagar R$ 30.100,00"; linhas com ícone, descrição 13px/700, "Categoria · Paga em dd/mm / Vence em dd/mm", valor mono e badge **PAGA** ou mini-botão **"Marcar paga"**. Ordem: a pagar primeiro (por data), depois pagas. **Sheet "Lançar despesa":** Descrição; **Categoria** (chips: Manutenção · Pessoal · Energia · Água · Limpeza · Seguro · Outros); Valor e Data; **Situação** (Já paga · A pagar).
- **Emitir boleto (avulso):** sheet com **Unidade** (Bloco 1–14 e Apto 1–12; **no app real, use um seletor/autocomplete de unidades vindo da API** e valide que a unidade existe), **Tipo** (chips: Taxa extra · Multa · Reserva de área · Outro), Descrição (opcional), Valor e Vencimento; nota com o nome do morador quando a unidade é encontrada. O boleto mensal é gerado pelo sistema; este é o avulso.
- **Auditoria:** lista (card) com data/hora mono 10.5px, texto 13px e "por Ana Laura"/"Sistema". Registra: baixa manual, boleto emitido, despesa lançada/marcada paga, cobrança e lembrete enviados. Nota: "Registros da trilha não podem ser editados nem apagados. Toda baixa, emissão e despesa fica aqui."
- `[BACKEND]` Agregados (arrecadado, em atraso, despesas, saldo), baixa manual (forma, data, valor, usuário), CRUD de despesas, **log de auditoria append-only**, envio de cobrança/lembrete, emissão avulsa, configuração de multa/juros. Quando o boleto é pago de verdade pelo banco, a baixa deve ser **automática** (integração bancária); a manual é só para exceções.

---

## 6. O que é só visual e o que precisa de backend

Antes de implementar qualquer item `[BACKEND]`, **leia a API** (`condoeconomy-api`) e confirme o que já existe. A tabela diz o que cada recurso pede; os nomes de campo são sugestões, **adapte aos nomes reais**.

| # | Recurso | Tela(s) | O que pede da API | 
|---|---|---|---|
| 1 | Notificações lidas/não lidas e categoria | morador-13 | Campos `lida`, `categoria`, `criadaEm`; marcar uma e marcar todas como lidas |
| 2 | Preferências por tipo e canal | morador-09 | Salvar preferências por categoria/canal; categorias novas **OUVIDORIA** e **VOTACAO**; EMERGENCIA não editável |
| 3 | Pets com cor, espécie, raça e foto | morador-08 | Campos `cor`, `especie`, `raca`, `fotoUrl`; upload de imagem |
| 4 | Veículo com cor e vaga | morador-04 | Campos `cor`, `vaga` |
| 5 | Moradores adicionais: parentesco e acesso ao app | morador-07 | `parentesco` padronizado, `acessoApp`, convite por e-mail |
| 6 | Sessões ativas | morador-10 | Listar sessões/dispositivos, encerrar uma, encerrar todas as outras (preservando a atual) |
| 7 | Foto de perfil | morador-06 | Upload e URL da foto |
| 8 | Motivo de recusa visível ao morador | morador-03, sindico-02 | Campo `motivo` na decisão da reserva |
| 9 | Taxa por área e lançamento no boleto | sindico-02 | Valor configurado por área; ao aprovar, lançar no próximo boleto; ao cancelar, remover |
| 10 | Conflito de horário | sindico-02 | **Validação no servidor** de sobreposição (mesma área e horário); o front só antecipa o aviso |
| 11 | Conversa na Ouvidoria | morador-12, portaria-05, sindico-04 | Mensagens por chamado (autor, papel, texto, data); notificação a cada resposta |
| 12 | Escalar chamado | portaria-05, sindico-04 | Status/etapa "escalado", **nota da portaria**, "assumir", "resolver" com mensagem final, "reabrir" |
| 13 | Visitantes com estados | portaria-02 | Status ESPERA / NO_LOCAL / SAIU, tipo, placa, flag de convite QR, horários de entrada e saída |
| 14 | Encomendas: retirada | portaria-03 | `transportadora`, `codigo`, `retiradoPorNome`, `retiradoPorTipo` (destinatário/outra pessoa); push ao registrar |
| 15 | Check-in de convidados | portaria-04 | Convidado com `chegouEm`; convidado adicionado pela portaria |
| 16 | Consulta de placa | portaria-06 | Busca por placa inteira **e por trecho** (veículos de moradores + visitantes no local); "avisar morador" (push) |
| 17 | Feed de atividade da portaria | portaria-01 | Eventos em tempo real (WebSocket) |
| 18 | Avisos: categoria, público por blocos, fixar, visualizações, push | sindico-01 | `categoria`, `blocos[]`, `fixado`, contagem de unidades que viram, flag de push |
| 19 | Agregados de atenção do síndico | sindico-01 | Contagens (reservas pendentes, chamados abertos e de segurança, boletos vencidos e soma) |
| 20 | Assembleias (módulo completo) | sindico-03 | Pauta, opções, **voto por unidade (titular)**, quórum, janela, notificação, PDF de resultado |
| 21 | Financeiro | sindico-05 | Agregados do mês; baixa manual (forma, data, valor, usuário); despesas; **auditoria append-only**; cobrança/lembrete; emissão avulsa; multa/juros configuráveis |

**Só visual (pode aplicar já, sem mudar a API):** tokens, fontes, tema, todos os componentes (C1–C22), BottomNav com rótulos, abas/filtros com contador, estados vazios, ordenação e destaques de atenção que usam dados já existentes, formatação de datas/moeda/unidade/placa, validações de formulário no front.

---

## 7. Plano de implementação em fases

Faça **uma fase por vez**, rode `build` e `lint` ao final de cada uma e peça aprovação do Pedro antes da seguinte.

**Fase 0 — Fundamentos.** Fontes (Manrope e IBM Plex Mono), tokens e tema (seção 2.7), container de 412px, utilitários mono. *Pronto quando:* uma página de teste mostra todos os tokens nos dois temas e as duas fontes carregam.

**Fase 1 — Componentes base.** C1 a C22 em `src/components/ui/` (TypeScript, variantes tipadas) e uma **página interna de showcase** (só em desenvolvimento) comparável a `00-design-system.html`. *Pronto quando:* o showcase reproduz o arquivo de referência em claro e escuro.

**Fase 2 — Navegação e Login.** AppHeader, BottomNav por perfil (com selos dinâmicos) e a tela de Login (3.0). *Pronto quando:* os 3 perfis navegam com os rótulos corretos e o login mantém a autenticação atual intacta.

**Fase 3 — Morador** (nesta ordem): Perfil → Dados pessoais → Moradores adicionais → Pets → Veículos → Configurar notificações → Segurança e senha → Central de ajuda → Boletos → Reservas → Ouvidoria → Notificações (lista) → Home (**só tokens/componentes**, sem recriar a estrutura).

**Fase 4 — Portaria:** Painel → Visitantes → Encomendas → Reservas e convidados → Ouvidoria → Veículos (consultar placa).

**Fase 5 — Síndico:** Início (avisos) → Reservas → Ouvidoria → Painel financeiro → Assembleias.

**Fase 6 — Itens `[BACKEND]`.** Um a um, **só depois de confirmar o endpoint** (seção 6), cada um atrás de feature flag. Se o endpoint não existir, registre no relatório e não improvise.

**Por fase:** commits pequenos em português (por exemplo, "Aplica design system na tela de Pets"), sem misturar refatoração de lógica com mudança visual.

---

## 8. Checklist de qualidade (rode em cada tela)

- [ ] Funciona em **claro e escuro**, sem cores fora dos tokens e sem prefixo `dark:`.
- [ ] Larguras **360, 390 e 412px**; no desktop aparece como coluna central de 412px.
- [ ] `safe-area` respeitada no header e no BottomNav; nada fica escondido atrás da barra de navegação.
- [ ] Todo botão tem altura adequada (≥ 44px; Portaria ≥ 46px) e foco visível; navegação por teclado funciona; Esc fecha sheets.
- [ ] Ícones sem texto têm `aria-label`; o BottomNav tem rótulos.
- [ ] Estados vazios **específicos por aba/filtro** e estado de carregamento/erro tratados.
- [ ] Dados em mono (valores, horários, placas, unidades, contadores); formatação pt-BR.
- [ ] Nenhum texto duplicado (ex.: cargo do usuário), nenhum "criptografia de ponta a ponta".
- [ ] Toasts só aparecem após sucesso real; ações destrutivas têm confirmação (InlineConfirm ou ConfirmSheet).
- [ ] `prefers-reduced-motion` respeitado.
- [ ] **Sem regressão:** rotas, autenticação, logout automático em 401/403, chamadas de API e WebSocket continuam funcionando.
- [ ] `build` e `lint` passam.

---

## 9. Pontos a confirmar com o Pedro (pergunte antes de assumir)

1. **Login:** manter ou remover o seletor de perfil (Síndico/Portaria/Morador)? (3.0)
2. **Home do morador:** confirmar que a estrutura **atual** é mantida e só ganha tokens/componentes. (3.1)
3. **Atalhos do síndico:** quais são os destinos reais dos 3 ícones do header atual? (Moradores/Encomendas/Segurança é suposição.) (5.1)
4. **Fluxo portaria → síndico:** confirmar o "Escalar para o síndico" e quem pode escalar. (4.5, 5.4)
5. **"Espera" nos visitantes:** significado exato do estado. (4.2)
6. **Multa e juros** de boletos atrasados, **dia de vencimento** e demais regras da convenção. (5.5, 3.11)
7. **Votação:** peso do voto (unidade ou fração ideal), quórum, prazos de convocação, regra de maioria e validade do voto online; validar com advogado. (5.3)
8. **Taxas e lotação das áreas comuns** (valores de exemplo: Salão R$ 250 / 60 pessoas; Churrasqueira R$ 80 / 20 pessoas). (3.3, 5.2)
9. **Quem aprova reservas:** assumido o síndico; a portaria só acompanha. (4.4, 5.2)
10. **Limites de alerta** usados como exemplo: visitante em espera ≥ 5 min; encomenda aguardando ≥ 3 dias; chamado sem atendimento ≥ 3 h na portaria e ≥ 24 h no síndico. Confirmar ou ajustar. (4.2, 4.3, 4.5, 5.4)
11. **Rótulo do botão** de envio da Ouvidoria do morador. (3.12)
12. **Categorias novas de notificação** (Ouvidoria e Votações). (3.9)
13. **Baixa automática** de boleto por integração bancária (a manual é exceção). (5.5)
14. **Nome do condomínio e dados de exemplo** ("Mar Egeu", "Ana Laura", "Carlos Silva") são fictícios: devem vir do usuário/condomínio logado.

---

## 10. Prompt de abertura sugerido (cole no agente)

> Leia `docs/design/CONDOECONOMY_DESIGN_SPEC.md` inteiro e abra a pasta `docs/design/referencia-html/` (um HTML por tela). Seu trabalho é **aplicar esse design system ao front-end existente** do CondoEconomy Web, **sem alterar rotas, autenticação, chamadas de API nem a lógica de negócio**.
>
> Comece **só** com o mapeamento: leia o repositório e me entregue uma tabela "tela atual → seção da spec", mais a lista de itens `[BACKEND]` que a API já suporta e os que não. **Não edite nada ainda.** Depois que eu aprovar, executamos a Fase 0 e a Fase 1, e seguimos fase por fase. Pergunte antes de assumir qualquer ponto da seção 9.

**Para fases seguintes**, use: *"Execute a Fase N da seção 7 do spec, usando os arquivos de referência indicados em cada tela. Ao terminar, rode build e lint, liste o que mudou e o que ficou pendente."*

---

## Anexo A — Índice dos arquivos de referência (`referencia-html/`)

| Arquivo | Seção da spec |
|---|---|
| `00-design-system.html` | 2 (cores, tipografia, espaçamento, componentes) |
| `01-login.html` | 3.0 |
| `morador-01-home.html` | 3.1 (versão inicial; o app real tem home própria) |
| `morador-02-boletos.html` | 3.2 |
| `morador-03-reservas.html` | 3.3 (lista + nova reserva + confirmação) |
| `morador-04-veiculos.html` | 3.4 |
| `morador-05-perfil.html` | 3.5 |
| `morador-06-dados-pessoais.html` | 3.6 |
| `morador-07-moradores-adicionais.html` | 3.7 |
| `morador-08-pets.html` | 3.8 |
| `morador-09-config-notificacoes.html` | 3.9 |
| `morador-10-seguranca-e-senha.html` | 3.10 |
| `morador-11-central-de-ajuda.html` | 3.11 |
| `morador-12-ouvidoria.html` | 3.12 |
| `morador-13-notificacoes.html` | 3.13 (ignore a faixa amarela e os botões "Pré-visualizar") |
| `portaria-01-painel.html` | 4.1 |
| `portaria-02-visitantes.html` | 4.2 |
| `portaria-03-encomendas.html` | 4.3 |
| `portaria-04-reservas-e-convidados.html` | 4.4 |
| `portaria-05-ouvidoria.html` | 4.5 |
| `portaria-06-veiculos-consultar-placa.html` | 4.6 |
| `sindico-01-inicio-avisos.html` | 5.1 |
| `sindico-02-reservas.html` | 5.2 |
| `sindico-03-assembleias.html` | 5.3 |
| `sindico-04-ouvidoria.html` | 5.4 |
| `sindico-05-painel-financeiro.html` | 5.5 |

**Como ler os HTMLs:** cada arquivo é autocontido (CSS e JavaScript no próprio arquivo) e abre direto no navegador. O JavaScript existe só para demonstrar os estados e fluxos; **os dados são fictícios** e os avisos (toasts) representam chamadas reais que o app deve fazer. Em caso de conflito entre este texto e o HTML, **o HTML vence para medidas e cores**; este texto vence para regras de negócio e para o que é `[BACKEND]`.
