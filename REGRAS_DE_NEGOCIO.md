# Regras de Negócio e UX — HabitOS Web (CondoEconomy)

Este documento descreve como o Front-end implementa as regras de negócio, os limiares operacionais, o roteamento por perfil e os fluxos críticos de confirmação definidos no [CONDOECONOMY_DESIGN_SPEC.md](docs/design/CONDOECONOMY_DESIGN_SPEC.md).

---

## 1. Roteamento e Confinamento por Perfil (RBAC)

Após a autenticação em `/login`, o usuário é direcionado automaticamente para o ambiente correspondente à sua `ROLE`:

- **Morador (`ROLE_MORADOR` → `/app`):**
  - Navegação inferior (`BottomNav`) com 5 abas: `Início` (`/app`), `Boletos` (`/app/boletos`), `Reservas` (`/app/reservas`), `Ouvidoria` (`/app/ouvidoria`) e `Perfil` (`/app/perfil`).
  - Acesso bloqueado a qualquer rota de `/portaria` ou `/admin` via `AuthGuard`.

- **Portaria (`ROLE_PORTEIRO` → `/portaria`):**
  - Navegação inferior com 6 abas operacionais: `Início` (`/portaria`), `Visitantes` (`/portaria/visitantes`), `Encomendas` (`/portaria/encomendas`), `Reservas` (`/portaria/reservas`), `Chamados` (`/portaria/chamados`) e `Veículos` (`/portaria/veiculos`).
  - Badges dinâmicos atualizados via WebSocket (`/topic/visitantes`, `/topic/encomendas`, `/topic/chamados`, `/topic/reservas`).

- **Síndico / Administração (`ROLE_SINDICO`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN` → `/admin`):**
  - Navegação inferior com 5 abas gerenciais: `Avisos` (`/admin`), `Reservas` (`/admin/reservas`), `Assembleia` (`/admin/assembleia`), `Ouvidoria` (`/admin/ouvidoria`) e `Finanças` (`/admin/financas`), além de atalhos diretos para `Moradores` (`/admin/moradores`), `CondoStore` (`/admin/condostore`) e `Auditoria` (`/admin/auditoria`).

---

## 2. Limiares Operacionais e Regras de Negócio na UI

### 2.1. Fila de Atenção da Portaria (`/portaria`)
Um item entra automaticamente na seção **"Atenção agora"** da Portaria quando atinge qualquer um dos seguintes critérios:
- **Visitante aguardando liberação:** tempo de espera **`>= 5 minutos`**.
- **Encomenda pendente de retirada:** parada na portaria há **`>= 3 dias`**.
- **Chamado na portaria:** status `ABERTO` sem atendimento há **`>= 3 horas`**.

### 2.2. Fila de Atenção do Síndico (`/admin`)
Um item entra na fila prioritária do Síndico quando:
- Um chamado foi **escalonado pela portaria** (`escaladoSindico === true`), exibindo a **Nota da portaria** anexada; ou
- Um chamado permanece aberto/sem resolução há **`>= 24 horas`**; ou
- Há reservas de áreas comuns com status `PENDENTE_APROVACAO`.

### 2.3. Boletos e Encargos Moratórios (`/app/boletos` e `/admin/financas`)
- Boletos com status `VENCIDO` (ou `PENDENTE` com data de vencimento ultrapassada) destacam o total em aberto em vermelho semântico (`text-bad`).
- No detalhamento do boleto vencido, a interface exibe a memória de cálculo com **Multa de `2%`** e **Juros de mora de `1% a.m.` (pro rata die)** sobre o valor nominal.
- **Baixa Manual pelo Síndico:** exige **Step-Up Authentication** em `ConfirmSheet`, solicitando a senha atual do síndico enviada no header `X-Step-Up-Password`.

### 2.4. Reservas de Áreas Comuns (`/app/reservas`, `/portaria/reservas`, `/admin/reservas`)
- O formulário valida obrigatoriamente que o horário de término é posterior ao horário de início (`fim > inicio`).
- O back-end valida conflito por **janela de horário (`inicio`–`fim`)** na mesma área e data, permitindo reservas em turnos distintos no mesmo dia.
- Quando o síndico recusa uma solicitação em `/admin/reservas`, o preenchimento do **motivo da recusa** é obrigatório e fica visível para o morador no card da reserva `REJEITADA`.

### 2.5. Ouvidoria e Escalonamento (`/app/ouvidoria`, `/portaria/chamados`, `/admin/ouvidoria`)
- Categorias suportadas: `RECLAMACAO`, `MANUTENCAO`, `SUGESTAO`, `DUVIDA`, `SEGURANCA`, `ELOGIO` e `OUTROS`.
- Ao escalonar um chamado para o síndico na Portaria, o porteiro preenche obrigatoriamente a **Nota para o síndico** em um `BottomSheet`.
- Todas as 3 personas contam com histórico de mensagens (`Thread`) integrado a `GET/POST /api/v1/chamados/{id}/mensagens`.

### 2.6. Assembleias Virtuais (`/app/assembleia` e `/admin/assembleia`)
- Moradores inadimplentes têm o voto bloqueado conforme o **Art. 1.335, III do Código Civil**.
- Após registrar o voto, a opção escolhida fica destacada e o botão é travado para impedir múltiplos votos da mesma unidade.
- Pautas encerradas permitem ao síndico gerar e imprimir a **Ata Oficial de Assembleia Virtual** com apuração completa de quórum.

---

## 3. Padrões de Confirmação e Feedback Visual

- **Proibição de diálogos nativos:** A aplicação não utiliza `window.alert()` ou `window.confirm()`.
- **Ações destrutivas em listas** (remover veículo, pet, morador adicional, aviso ou zerar estoque) utilizam `InlineConfirm` ou `ConfirmSheet`.
- **Feedbacks transitórios** (código PIX copiado, senha alterada, comunicado publicado) utilizam o componente `Toast` padronizado na base do `MobileFrame`.
