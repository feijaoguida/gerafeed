# Task 302: Suíte E2E de Testes de Segurança (20 Pontos & Abuse Cases), Build e Evidências da Phase 40

## Status
TODO

## Contexto
Como etapa final da **Phase 40 (Hardening de Segurança Pré-Produção)**, devemos validar de ponta a ponta todos os 20 pontos do Checklist de Segurança Pré-Publicação, executando uma suíte automatizada de testes de abuso (*Abuse Cases*), verificando ausência de regressões nas fases anteriores, rodando TypeScript, ESLint e Build de produção Next.js, e atualizando `PROGRESS.md` e `MEMORY.md`.

## Escopo de Implementação

### 1. Suíte E2E de Auditoria de 20 Pontos e Abuse Cases (`scripts/phase40/test-security-audit-20-points-e2e.ts`)
Criar script executável `scripts/phase40/test-security-audit-20-points-e2e.ts` que valida programaticamente:
1. **Chaves de API, `.env` e Zero Senhas Hardcoded (Itens 1, 2, 3, 18)**:
   - Verifica que variáveis `NEXT_PUBLIC_*` não expõem chaves de IA, banco, WordPress ou Asaas.
   - Verifica que `.gitignore` protege `.env*` e que nenhum `.env` está rastreado no Git.
2. **Autenticação Robusta e Bloqueio de Senha Nula (Item 4)**:
   - Cria usuário de teste com `passwordHash: null` e comprova que a tentativa de login por senha é **rejeitada**.
   - Valida `constantTimeCompare` com strings iguais, diferentes e de tamanhos distintos.
3. **Autorização no Servidor, Proxy Guard, Multi-tenancy e Prevenção a IDOR (Itens 5, 6, 7, 10)**:
   - Comprova que `getSessionWorkspaceId()` sem sessão em modo produção lança `UnauthorizedWorkspaceError` (`status: 401`) e **nunca** cai em `DEFAULT_WORKSPACE_ID`.
   - Comprova que o Workspace B não consegue ler, editar ou excluir recursos (`WordPressSite`, `Article`, `Source`, `Product`) pertencentes ao Workspace A.
   - Comprova que `requireSuperAdmin()` bloqueia usuários comuns com `403`.
4. **Rate Limiting, Anti-Brute Force de OTP e Webhook Asaas Fail-Closed (Itens 17 e 20)**:
   - Simula 5 tentativas incorretas de OTP em `/api/auth/verify-code` e `/api/auth/forgot-password/reset`, comprovando o bloqueio `HTTP 429`, a exclusão imediata do `VerificationToken` no banco e a gravação em `SystemErrorLog`.
   - Simula chamada a `AsaasGateway.handleWebhook` sem `ASAAS_WEBHOOK_TOKEN` e com token forjado, comprovando rejeição *Fail-Closed* (`401`).
5. **Sanitização contra XSS e Proteção contra SSRF em RSS/Scraper (Itens 13, 14, 15, 16, 20)**:
   - Testa `sanitizeHtml` contra múltiplos vetores de Stored XSS (`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `<a href="javascript:evil()">`, `<iframe src="...">`), comprovando remoção de 100% do código executável e preservação do HTML editorial e `data:image/webp;base64,...`.
   - Testa `validateSafeRemoteUrl`, `fetchAndParseRss` e `scrapeArticleContent` contra URLs SSRF (`http://127.0.0.1:5432`, `http://localhost/admin`, `http://169.254.169.254/latest/meta-data/`, `http://10.0.0.1`, `http://192.168.1.1`), comprovando bloqueio imediato antes de qualquer conexão de rede.
6. **Security Headers, Tratamento Seguro de Erros e Modo Debug (Itens 11, 12, 19)**:
   - Valida que `next.config.ts` retorna `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
   - Simula erro interno do Prisma (`Invalid \`prisma.user.findUnique()\` invocation...`) em `getSafeClientErrorMessage` e `handleApiError`, comprovando que a resposta ao cliente retorna apenas a mensagem genérica amigável enquanto o detalhe técnico fica restrito ao `SystemErrorLog`.

### 2. Verificação Completa de Build e Qualidade
1. Executar `npx tsx scripts/phase40/test-security-audit-20-points-e2e.ts`: PASS.
2. Executar `npx tsc --noEmit`: PASS (0 erros).
3. Executar `npm run lint`: PASS (0 erros).
4. Executar `npm run build`: PASS.
5. Atualizar `news-curator-harness/PROGRESS.md` e `news-curator-harness/MEMORY.md` com as evidências completas da Phase 40.

## Critérios de Aceitação (Definition of Done)
- [ ] `scripts/phase40/test-security-audit-20-points-e2e.ts` criado e passando 100% dos testes.
- [ ] Todos os 20 pontos do Checklist de Segurança Pré-Publicação validados como `[CONFORME]`.
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).
- [ ] `npm run build`: PASS.
- [ ] `PROGRESS.md` e `MEMORY.md` atualizados com evidências verificáveis.

