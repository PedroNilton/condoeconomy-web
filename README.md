# CondoEconomy Web 🏢

Uma plataforma web moderna e mobile-first para a gestão inteligente de condomínios, conectando Síndicos, Porteiros e Moradores em um ecossistema digital centralizado.

## 🚀 Tecnologias Utilizadas

- **React 18** com **TypeScript**
- **Vite** para build super-rápido
- **Tailwind CSS v4** para estilização utilitária e Dark Mode
- **React Router Dom** para roteamento
- **Lucide React** para ícones limpos e responsivos
- **Axios** para consumo de API REST
- **StompJS / SockJS** para comunicação em tempo real via WebSockets

## ✨ Funcionalidades e Telas

O sistema é dividido em três "perfis" principais de acesso, cada um com suas próprias ferramentas:

### 1. Painel do Síndico (Admin)
- Dashboard Financeiro (Resumo de Arrecadação, Despesas e Inadimplência).
- Gestão de Boletos (Filtro por status: Pago, Pendente, Atrasado).
- Aprovação de Reservas de Áreas Comuns.
- Painel de Ouvidoria (Gerenciamento de chamados abertos pelos moradores).
- Gestão de Avisos e Comunicados Oficiais.

### 2. Painel da Portaria
- Gestão de Encomendas (Chegada e Retirada).
- Controle de Visitantes e Prestadores de Serviço (Check-in rápido).

### 3. Aplicativo do Morador
- Visualização de Boletos e Pagamentos.
- Solicitação de Reservas de Espaços Comuns (Churrasqueira, Salão de Festas).
- Abertura de Chamados e Tickets na Ouvidoria.
- Histórico de Visitantes e Encomendas.
- Geração de QR Code de Acesso.

### Interface
- **Mobile-First:** Layout baseado em "Cards", 100% otimizado para celulares.
- **Dark Mode:** Botão de alternância com suporte nativo em todas as telas, garantindo alto contraste e conforto visual.

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

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

## 🔐 Acesso de Teste (Mock)
Utilize as credenciais abaixo para testar os diferentes perfis (a senha padrão para todos é `admin`):

- **Morador:** `carlos.silva@email.com`
- **Portaria:** `porteiro@condominio.com`
- **Síndico:** `sindico@condominio.com`

---
*Desenvolvido para revolucionar a administração condominial.*
