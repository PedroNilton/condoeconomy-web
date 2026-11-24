# Política de Segurança — HabitOS Web (CondoEconomy)

A segurança dos dados dos moradores, porteiros, síndicos e administradoras é prioridade no projeto **HabitOS Web (`condoeconomy-web`)**. Este documento descreve as versões suportadas, o processo de divulgação responsável de vulnerabilidades e os controles de segurança implementados no front-end.

---

## Versões Suportadas

As correções de segurança são aplicadas continuamente na branch principal (`main`):

| Versão / Branch | Stack Base | Suporte a Correções de Segurança |
| :--- | :--- | :---: |
| `main` (atual) | React 19 + TypeScript 6 + Vite 8 | Sim |
| Releases / commits anteriores | — | Não |

---

## Como Reportar uma Vulnerabilidade

Caso identifique qualquer falha de segurança (como XSS, vazamento de credenciais, bypass de proteção de rota, falha na autenticação WebSocket ou dependência vulnerável):

1. **Não abra uma Issue pública** contendo detalhes exploráveis ou provas de conceito (PoC).
2. Utilize o recurso privado de **GitHub Security Advisories** deste repositório (*Aba `Security` → `Advisories` → `Report a vulnerability`*) ou entre em contato diretamente com o mantenedor do repositório.
3. Inclua no relato:
   - Descrição clara do problema e impacto potencial;
   - Rota ou componente afetado (ex.: `/app/boletos`, `AuthGuard`, `useWebSocket`);
   - Passos objetivos para reprodução (e versão do navegador/ambiente, se aplicável);
   - Sugestão de mitigação, caso possua.

### Prazos de Referência
- **Confirmação de recebimento:** até 48 horas úteis.
- **Triagem e classificação de severidade:** até 5 dias úteis.
- **Correção e divulgação coordenada:** priorizada conforme impacto (crítico/alto tratado imediatamente).

---

## Controles de Segurança Implementados no Front-end (AppSec)

1. **Autenticação Híbrida e Encerramento Seguro de Sessão (`src/services/api.ts`):**
   - Suporte a `Authorization: Bearer <jwt>` combinado ao envio automático do cookie `HttpOnly` (`HABITOS_SESSION`) via `withCredentials: true`.
   - Interceptador de respostas `401 Unauthorized` que limpa o estado local de sessão e redireciona com segurança para `/login`.
   - O logout em todas as personas aciona `POST /api/v1/auth/logout` no back-end para incrementar o `tokenVersion` (*Token Kill Switch*), revogando criptograficamente o token no servidor.

2. **Controle de Acesso Baseado em Papéis no Cliente (`src/components/AuthGuard.tsx`):**
   - Validação de estrutura e expiração (`exp`) do JWT no cliente via `parseToken`.
   - Isolamento de namespaces por perfil (`ROLE_MORADOR` → `/app`, `ROLE_PORTEIRO` → `/portaria`, `ROLE_SINDICO` / `ROLE_ADMIN` / `ROLE_SUPER_ADMIN` → `/admin`), atuando em conjunto com o RBAC autoritativo da API (`@EnableMethodSecurity`).

3. **Sanitização Defensiva de Entradas (`src/utils/security.ts`):**
   - Remoção de caracteres de controle ASCII e bytes nulos (`sanitizarEntrada`) e detecção preventiva de assinaturas de XSS e SQL Injection (`contemAmeacas`) antes do envio ao servidor.

4. **Prevenção contra DOM XSS em Impressão (`src/utils/escapeHtml.ts`):**
   - Escape estrito de entidades HTML (`&`, `<`, `>`, `"`, `'`) em todos os campos dinâmicos renderizados em janelas de impressão (`document.write` para comprovantes de boletos e atas de assembleia).

5. **WebSocket/STOMP Autenticado (`src/hooks/useWebSocket.ts`):**
   - Injeção do header `Authorization: Bearer <token>` no frame STOMP `CONNECT` e seleção automática entre `ws://` e `wss://` conforme o protocolo da página.

6. **Cabeçalhos HTTP de Segurança no Nginx (`nginx.conf`):**
   - `X-Frame-Options: SAMEORIGIN` (mitigação de *Clickjacking*);
   - `X-Content-Type-Options: nosniff` (prevenção de *MIME sniffing*);
   - `Referrer-Policy: strict-origin-when-cross-origin` (redução de exposição de URLs sensíveis).

---

## Checklist de Segurança para Deploy em Produção

- [ ] Publicar exclusivamente sob **HTTPS (TLS 1.2+)** para habilitar `wss://` e cookies `Secure`.
- [ ] Configurar `VITE_API_URL` apontando para o domínio HTTPS da API sem versionar arquivos `.env` reais no Git.
- [ ] Alinhar `CORS_ALLOWED_ORIGINS` no back-end (`condoeconomy-api`) exatamente ao domínio de origem do front-end.
- [ ] Executar periodicamente `npm audit` e `npm run lint` (`oxlint`) antes de publicar novas versões.
- [ ] Nunca utilizar as credenciais de homologação listadas no `README.md` em ambientes de produção.

---

## Repositório Relacionado

Para detalhes sobre segurança no servidor, isolamento Multi-Tenant, Step-Up Authentication, proteção contra força bruta, webhooks e conformidade LGPD, consulte também a política de segurança da API em **[`PedroNilton/condoeconomy-api`](https://github.com/PedroNilton/condoeconomy-api)**.
