# HabitOS Web

Uma plataforma web moderna e mobile-first para a gestão inteligente de condomínios, conectando Síndicos, Porteiros e Moradores em um ecossistema digital centralizado.

## Tecnologias Utilizadas

- **React 18** com **TypeScript**
- **Vite** para build super-rápido
- **Tailwind CSS v4** (Design System v0) para estilização utilitária e Dark Mode
- **React Router Dom** para roteamento
- **Lucide React** para ícones limpos e responsivos
- **Axios** para consumo de API REST
- **StompJS / SockJS** para comunicação em tempo real via WebSockets

## Funcionalidades e Telas

O sistema é dividido em três perfis principais de acesso, cada um com suas próprias ferramentas:

### 1. Aplicativo do Morador (Mobile-First)
- **Home**: Feed interativo com QR Code dinâmico com cor de status inteligente.
- **Perfil Completo**: Gestão de Dados Pessoais, Moradores Adicionais (com convite de acesso), Meus Pets e Veículos.
- **Configurações e Segurança**: Ajuste fino de Notificações, Central de Ajuda, Alteração de Senha com força de segurança e Gerenciamento de Sessões ativas.
- **Ouvidoria**: Formulário intuitivo para abertura de chamados, sugestões e reclamações.
- **Reservas e Boletos**: Integração visual para pagamentos e uso de áreas comuns.

### 2. Painel da Portaria
- Gestão de Encomendas (Chegada e Retirada).
- Controle de Visitantes e Prestadores de Serviço (Check-in rápido).
- Módulo de Consulta de Veículos.

### 3. Painel do Síndico (Admin)
- Dashboard Financeiro (Resumo de Arrecadação, Despesas e Inadimplência).
- Gestão de Boletos (Filtro por status).
- Aprovação de Reservas de Áreas Comuns.
- Painel de Ouvidoria para acompanhamento e resposta a chamados.
- Gestão de Avisos e Comunicados Oficiais.

## Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn
- Backend rodando em Spring Boot (Porta 8080)

### Passo a Passo

1. Instale as dependências do projeto:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse a aplicação no seu navegador:
```text
http://localhost:5173
```

## Acesso de Teste

Utilize as credenciais de homologação abaixo (a senha padrão para todos é `123456`):

- **Morador:** `carlos.silva@email.com`
- **Portaria:** `porteiro@condominio.com`
- **Síndico:** `sindico@condominio.com`

---
*Desenvolvido para revolucionar a administração condominial.*
