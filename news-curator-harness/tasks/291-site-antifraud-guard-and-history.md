# Task 291: Trava Anti-Fraude de Cadastro de Sites (1ª e 2ª Vez OK, 3ª Vez Bloqueia com Alerta de Suporte)

## Status
DONE

## Contexto
O usuário solicitou um histórico perpétuo para evitar que alguém crie uma conta com `email1` e cadastre `sitedoemail1`, depois que vencer o período cancele a assinatura, crie outra conta e cadastre o mesmo `sitedoemail1` para enganar o sistema.
A regra exigida é:
- **1ª vez (Conta 1)**: OK (permite cadastro);
- **2ª vez (Conta 2)**: OK (permite cadastro);
- **3ª vez em diante (Conta 3+)**: Emite um alerta na interface, **não permite o cadastro desse site**, pede para o usuário **procurar o suporte** e gera log de erro em `SystemErrorLog`.

## Escopo de Implementação

### 1. Proteção no Cadastro e Edição de Destinos WordPress (`/api/wordpress/sites` e `/api/wordpress/sites/[id]`)
1. Em `src/app/api/wordpress/sites/route.ts` (`POST`):
   - Antes de chamar `createWordPressSite`, invocar `SiteAntifraudService.validateAndRecordSiteRegistration({ rawUrl: url, workspaceId, sourceContext: "WORDPRESS_SITE", reqPath: "/api/wordpress/sites" })`.
   - Se `allowed === false`:
     - Retornar HTTP `403` com `{ error: check.blockedMessage, siteBlockedByAntifraud: true, attemptNumber: check.attemptNumber, supportRequired: true }`.
     - Garantir que `SystemErrorLog` foi gravado com os detalhes do `workspaceId` atual e dos `workspaceId`s anteriores.
   - Se `allowed === true`:
     - Prosseguir com a criação do `WordPressSite` e vincular o `wordpressSiteId` ao registro de `SiteRegistrationHistory`.
   - Substituir `catch` genérico por `handleApiError` (ou `logSystemError`) do módulo `WORDPRESS` para que qualquer erro de criação gere log no banco.
2. Em `src/app/api/wordpress/sites/[id]/route.ts` (`PATCH` / `PUT` e `DELETE`):
   - No `PATCH`/`PUT`: caso o campo `url` esteja sendo alterado para um novo domínio diferente do atual, executar `SiteAntifraudService.validateAndRecordSiteRegistration` antes de atualizar. Se bloqueado (3ª conta+), retornar HTTP `403` com a mensagem de suporte e gravar `SystemErrorLog`.
   - No `DELETE`: excluir o `WordPressSite` normalmente, **preservando intactos** todos os registros de `SiteRegistrationHistory` no banco de dados (para que apagar o site da Conta 1 ou 2 nunca burle a contagem na Conta 3).

### 2. Proteção na Criação da Conta (`/api/auth/send-verification-code`, `/api/auth/register` e `/register`)
1. Em `src/app/api/auth/send-verification-code/route.ts` e `src/app/api/auth/register/route.ts`:
   - Quando o campo `website` é informado no cadastro da conta:
     - Verificar via `SiteAntifraudService` quantas contas distintas já utilizaram aquele `normalizedDomain`.
     - Se já existirem **2 ou mais contas distintas** (`attemptNumber >= 3`), bloquear já no início do cadastro (e novamente na criação final em `/api/auth/register`), gravar `SystemErrorLog` (`module: "AUTH"`, `screen: "Criação de Conta - Anti-Fraude de Site"`) e retornar HTTP `403` com a mensagem de alerta orientando a procurar o suporte.
     - Quando a conta for criada com sucesso (1ª ou 2ª vez), gravar o registro em `SiteRegistrationHistory` vinculado ao novo `workspace.id` (`sourceContext: "REGISTER"`).
2. Em `src/app/(public)/register/register-view.tsx`:
   - Enviar `website` também em `/api/auth/send-verification-code` para validação imediata no Passo 1.
   - Exibir um `Alert` visual de destaque quando a resposta retornar `siteBlockedByAntifraud: true` / `supportRequired: true`, orientando claramente o usuário a entrar em contato com o suporte.

### 3. Alerta Visual em Destinos WordPress (`src/app/(app)/settings/wordpress/page.tsx`)
1. Quando a API `/api/wordpress/sites` retornar `siteBlockedByAntifraud: true` (3ª tentativa em diante):
   - Exibir um banner de alerta de destaque (`Alert variant="warning"` / `"destructive"`) no formulário/modal explicando que o site atingiu o limite máximo de vinculações em contas diferentes e orientando o usuário a acionar o suporte.

## Critérios de Aceitação (Definition of Done)
- [x] Cadastrar `https://sitedoemail1.com.br` na Conta 1 (`email1`) funciona normalmente (`attemptNumber = 1`).
- [x] Mesmo que a Conta 1 exclua o site ou cancele a assinatura, cadastrar `https://www.sitedoemail1.com.br/` na Conta 2 (`email2`) funciona normalmente (`attemptNumber = 2`).
- [x] Ao tentar cadastrar `http://sitedoemail1.com.br` na Conta 3 (`email3`) — seja em `/register` ou em `/settings/wordpress` — o sistema **bloqueia o cadastro (HTTP 403)**, exibe a mensagem de alerta pedindo para procurar o suporte e grava o incidente em `SiteRegistrationHistory` (`status: "BLOCKED"`) e em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Evidência de Conclusão
- `src/app/api/wordpress/sites/route.ts`: Guarda antifraude ativo no `POST` com bloqueio na 3ª conta, vinculação pós-criação e log em `SystemErrorLog`.
- `src/app/api/wordpress/sites/[id]/route.ts`: Guarda antifraude ativo no `PATCH` para alteração de URL de site existente; deleção de WordPressSite preserva 100% dos registros de `SiteRegistrationHistory`.
- `src/app/api/auth/send-verification-code/route.ts`: Verificação precoce de website na emissão de código OTP bloqueando domínios fraudulentos antes de disparar e-mail.
- `src/app/api/auth/register/route.ts`: Guarda antifraude antes da criação do usuário e vinculação do workspace criado.
- `src/app/(public)/register/register-view.tsx`: Envio de website na etapa 1 e banner de alerta de segurança direcionando ao suporte.
- `src/app/(app)/settings/wordpress/page.tsx`: Modal e página com banner de alerta de suporte quando a API retorna bloqueio antifraude.
- Teste integrado executado com sucesso: `npx tsx scripts/phase39/test-task291.ts` (PASS).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

