# Arquitetura e Estrutura — HabitOS Web (CondoEconomy)

Este documento descreve a arquitetura de Front-end, o Design System e os padrões de segurança da aplicação web **HabitOS / CondoEconomy Web**.

---

## 1. Stack Tecnológica

- **React 19 (`^19.2.8`)**: Componentes funcionais, hooks customizados e carregamento assíncrono de rotas (`React.lazy` + `Suspense`).
- **TypeScript 6 (`~6.0.2`)**: Tipagem estática estrita em toda a camada de domínio, contratos de API e propriedades do Design System.
- **Vite 8 (`^8.2.2`)**: Bundler com code-splitting automático por rota e geração de PWA (`vite-plugin-pwa`).
- **Tailwind CSS v4 (`^4.3.3`)**: Configurado em `src/index.css` via `@theme` com tokens semânticos que alternam automaticamente entre Modo Claro (`:root`) e Modo Escuro (`.dark`).
- **Axios (`^1.20.0`)**: Cliente HTTP centralizado em `src/services/api.ts` com suporte híbrido a header `Authorization: Bearer` e cookie `HttpOnly` (`withCredentials: true`).
- **STOMP over WebSocket (`@stomp/stompjs`)**: Sincronização reativa em tempo real com autenticação JWT no frame `CONNECT`.
- **Oxlint (`^1.79.0`)**: Linter estático de alta velocidade para regras de React, hooks e TypeScript.

---

## 2. Estrutura de Diretórios (`/src`)

```text
src/
 ├── components/
 │    ├── ui/               # Família de 21 componentes oficiais do Design System
 │    ├── Layout/           # Shell operacional da Portaria (DashboardLayout)
 │    ├── UI/               # Modal genérico compatível com tokens semânticos
 │    └── AuthGuard.tsx     # Proteção de rotas por autenticação e RBAC (ROLE_*)
 ├── contexts/
 │    ├── NotificationContext.tsx # Contadores em tempo real (WebSocket + REST)
 │    └── ThemeContext.tsx        # Persistência e alternância de tema Claro/Escuro
 ├── hooks/
 │    └── useWebSocket.ts   # Cliente STOMP autenticado via JWT com reconexão automática
 ├── pages/
 │    ├── Admin/            # Telas do Síndico (Avisos, Reservas, Assembleia, Ouvidoria, Finanças, Moradores, CondoStore, Auditoria)
 │    ├── Chamados/         # Operação de chamados na Portaria (escalonamento e Thread)
 │    ├── Dashboard/        # Home operacional da Portaria (Fila de Atenção e KPIs)
 │    ├── DesignSystem/     # Catálogo interativo dos 21 componentes (/design-system)
 │    ├── Encomendas/       # Gestão de pacotes na Portaria
 │    ├── Login/            # Login, Recuperação de Senha (OTP) e Central de Ajuda
 │    ├── Morador/          # Super-app do Morador (Home, Boletos, Reservas, Visitantes, Encomendas, Assembleia, Ouvidoria, CondoStore, Perfil/LGPD)
 │    ├── Notificacoes/     # Central de Notificações do Morador
 │    ├── Portaria/         # Consulta rápida de Veículos por placa/unidade
 │    ├── Public/           # Auto Check-in público de visitantes via QR Code
 │    ├── Reservas/         # Controle de portaria das reservas e lista de convidados do dia
 │    └── Visitantes/       # Check-in/Check-out e leitor de QR Code na Portaria
 ├── services/
 │    └── api.ts            # Instância Axios e interceptadores 401/JWT
 ├── utils/
 │    ├── escapeHtml.ts     # Escape de entidades HTML contra DOM XSS em janelas de impressão
 │    └── security.ts       # Sanitização defensiva de formulários no cliente
 ├── App.tsx                # Definição central de rotas com code-splitting
 ├── index.css              # Tokens semânticos CSS (--bg, --card, --text, --primary, etc.)
 └── main.tsx               # Ponto de entrada da árvore React
```

---

## 3. Design System e Tokens Semânticos

Seguindo a especificação [CONDOECONOMY_DESIGN_SPEC.md](docs/design/CONDOECONOMY_DESIGN_SPEC.md), a aplicação adota um **shell mobile-first unificado de `412px`** (`MobileFrame`) para todas as três personas (**Morador**, **Portaria** e **Síndico**):

- **Tipografia:** `Inter` para interface e leitura editorial; `DM Mono` (`font-mono`) com `tabular-nums` para placas, unidades, valores monetários, protocolos, timers e linhas digitáveis.
- **Paleta Semântica Estrita (`src/index.css`):**
  - Superfícies e texto: `bg-canvas` (`--bg`), `bg-surface` (`--card`), `border-line` (`--border`), `border-line-strong` (`--border-strong`), `text-ink` (`--text`), `text-dim` (`--dim`), `text-faint` (`--faint`).
  - Marca: `bg-brand` / `text-brand` (`#1E40AF` no claro / `#3B82F6` no escuro), `bg-brand-soft` (`--primary-dim`).
  - Estados semânticos:
    - Sucesso (`ok`): `text-ok`, `bg-ok-soft`
    - Atenção (`warn`): `text-warn`, `bg-warn-soft`
    - Crítico / Erro (`bad`): `text-bad`, `bg-bad-soft`

---

## 4. Padrões de Segurança e Sessão

1. **RBAC no Cliente (`AuthGuard.tsx`):** Decodifica o JWT via função pura `parseToken`, valida expiração (`exp`) e garante que cada papel (`ROLE_MORADOR`, `ROLE_PORTEIRO`, `ROLE_SINDICO`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`) acesse exclusivamente seu namespace de rotas (`/app`, `/portaria` ou `/admin`).
2. **Defesa em Profundidade contra XSS:**
   - Inputs de texto passam por validação/sanitização em `src/utils/security.ts`.
   - Relatórios de impressão (`window.open` + `document.write` para boletos e atas de assembleia) aplicam `escapeHtml` (`src/utils/escapeHtml.ts`) em todos os dados dinâmicos.
3. **Comunicação em Tempo Real Autenticada (`useWebSocket.ts`):** O hook injeta o JWT no header STOMP `Authorization: Bearer <token>` durante o frame `CONNECT`, alinhado ao `ChannelInterceptor` do back-end.
4. **Encerramento Seguro de Sessão:** O logout nas 3 personas chama `POST /api/v1/auth/logout` antes de limpar o estado local, garantindo o incremento do `tokenVersion` (*Token Kill Switch*) no servidor.
