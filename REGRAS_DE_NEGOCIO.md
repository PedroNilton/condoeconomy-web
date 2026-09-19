# Regras de Negócio e UX - CondoEconomy Web

Este documento mapeia como o Front-end lida com as regras de negócio, a navegação condicional e a experiência do usuário (UX) do ecossistema CondoEconomy.

## 1. Tratamento de Perfis (Autenticação)
A interface é dinamicamente renderizada com base na `ROLE` recebida no token JWT (salvo no `localStorage`).

- **Morador (`ROLE_MORADOR`)**:
  - Cai automaticamente na tela inicial `/home` após o login.
  - O menu de navegação é focado no uso pessoal (Meus Boletos, Minhas Reservas, Meus Veículos).
  - Qualquer tentativa de acessar rotas de `/admin` ou `/portaria` resulta em redirecionamento de segurança via `AuthGuard`.

- **Portaria (`ROLE_PORTEIRO`)**:
  - Direcionado para o dashboard operacional `/portaria`.
  - A interface é desenhada com botões grandes e fontes monoespaçadas (ex: Consulta de Placas) para facilitar o uso noturno e ágil na guarita.
  - Sistema de Notificações Ativas: Badges vermelhas alertam sobre visitantes aguardando na cancela ou encomendas pendentes.

- **Síndico (`ROLE_SINDICO` / `ROLE_ADMIN`)**:
  - Acesso liberado ao `/admin`.
  - Tem visão gerencial (Gráficos, KPIs financeiros, taxa de inadimplência).

## 2. Regras de Interface (UX/UI)

### 2.1. Assembleias e Votações
- O botão de votar só deve estar habilitado para moradores adimplentes e desde que não tenham votado anteriormente.
- Assim que o voto é computado e o Back-end retorna sucesso 200 OK, a interface desabilita os botões de opção e exibe um `CheckCircle` verde ("Voto Registrado").

### 2.2. Operação de Portaria (Busca de Veículos)
- O `input` da placa sempre converte o texto para `uppercase` (letras maiúsculas) instantaneamente para facilitar a leitura.
- Regra visual: Placas autorizadas disparam um card `border-green-500` com a etiqueta "Morador Autorizado". Placas não encontradas alertam em vermelho para bloquear a cancela.

### 2.3. Reservas
- No portal do morador, as reservas devem apresentar status com codificação de cores:
  - `PENDENTE`: Amarelo/Laranja (Aguardando Síndico).
  - `APROVADO`: Verde (Confirmado).
  - `REJEITADO`: Vermelho (Data indisponível).

## 3. Padrões de Qualidade
- **Mobile-First:** Todas as telas de Morador assumem que o usuário está no celular.
- **Dark Mode Nativo:** Respeito à preferência do sistema do usuário, trocando estilos do Tailwind de `bg-white` para `dark:bg-slate-900`.
- **Comunicação de Erros:** O Axios intercepta respostas `401/403` e desloga o usuário automaticamente se o token estiver expirado, garantindo a integridade da sessão.
