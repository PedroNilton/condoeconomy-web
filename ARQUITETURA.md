# Arquitetura e Estrutura - CondoEconomy Web

Este documento mapeia a arquitetura e as escolhas técnicas do Front-end (Aplicação Web) do ecossistema CondoEconomy. O projeto é estruturado para garantir uma experiência de usuário (UX) premium e um desenvolvimento ágil.

## 1. Stack Tecnológica
- **React 18**: Biblioteca base da interface, utilizando *Functional Components* e *Hooks*.
- **TypeScript**: Tipagem estática para evitar bugs de runtime e melhorar o ecossistema de desenvolvimento (IntelliSense).
- **Vite**: Empacotador (Bundler) ultrarrápido, substituindo o Webpack/CRA, oferecendo Hot-Module-Replacement (HMR) instantâneo.
- **Tailwind CSS (v4)**: Framework CSS utilitário para estilização rápida, responsividade e suporte nativo ao Modo Escuro (Dark Mode).
- **Lucide React**: Biblioteca de ícones vetoriais leves e modernos.
- **Axios**: Cliente HTTP para chamadas à API REST.

## 2. Estrutura de Diretórios (`/src`)

A estrutura segue uma abordagem de divisão por *Features/Contextos* (Domínios de Usuário):

```text
src/
 ├── components/       # Componentes burros (Dumb) e reaproveitáveis (Ex: Layouts, Botões)
 ├── contexts/         # Gerenciamento de Estado Global via React Context (Ex: ThemeContext)
 ├── pages/            # Telas da aplicação (Smart Components), divididas por Perfil:
 │    ├── Admin/       # Rotas restritas ao Síndico (Painel de Reservas, Financeiro)
 │    ├── Morador/     # App do Morador (Home, Boletos, Veículos, Assembleia)
 │    ├── Portaria/    # Dashboard Operacional (Encomendas, Busca de Carros, Visitantes)
 │    └── Public/      # Rotas deslogadas (Login, Auto-Checkin de visitantes)
 ├── services/         # Configuração do Axios e interceptadores (Injeção de JWT)
 ├── App.tsx           # Roteamento central com `react-router-dom` e `AuthGuard`
 └── main.tsx          # Ponto de montagem no DOM
```

## 3. Padrões de Projeto (Patterns)
- **AuthGuard (Private Routes)**: Um componente de ordem superior (HOC) que envolve rotas protegidas no `App.tsx`. Ele checa a presença do token JWT e verifica se a `ROLE` do usuário tem permissão para acessar aquele módulo. Caso contrário, redireciona o tráfego.
- **Mobile-First Design**: Toda tela dentro de `/pages/Morador` é desenhada primeiro para telas pequenas (dispositivos móveis), utilizando layouts em coluna, enquanto `/pages/Admin` é focada em Desktop (painéis de controle ricos).
- **Interceptadores HTTP**: O arquivo `api.ts` contém interceptadores globais que capturam erros `401 Unauthorized` (Token expirado) para forçar o logout automático do usuário em tempo real.
