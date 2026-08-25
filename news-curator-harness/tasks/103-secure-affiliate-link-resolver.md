# 103 Secure Affiliate Link Resolver

## Objetivo
Resolver affiliateUrl sem abrir vetor SSRF.

## Escopo
Implementar resolver server-side com allowlist por provider, bloqueio localhost/private/link-local, DNS/IP validation, redirect validation, max redirects, timeout, response limits e sem forward de cookies/Authorization. Retornar erros tipados.

## Definition of Done
- [x] Resolver seguro.
- [x] Redirect chain validada.
- [x] Localhost/private IP bloqueados.
- [x] Host inválido bloqueado.
- [x] Timeout.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-secure-affiliate-link-resolver.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/ssrf.ts`:
  - Algoritmo de validação de IP (`isPrivateIp`) cobrindo todas as faixas privadas/reservadas de IPv4 e IPv6 (10/8, 172.16/12, 192.168/16, 127/8 loopback, 169.254/16 link-local / metadata cloud, fc00::/7, fe80::/10, etc.).
  - Validação de resolução DNS server-side (`validateHostForSSRF`) antes de disparar qualquer requisição.
  - Erros customizados e tipados: `SSRFSecurityError`, `InvalidHostError`, `MaxRedirectsExceededError`, `ResolverTimeoutError`, `ResolverError`.
- `src/lib/affiliate/resolver.ts`:
  - `SafeUrlResolver.resolve()` com resolução passo a passo de redirects (`redirect: "manual"`).
  - Validação de cada hop na cadeia de redirects contra allowlist de hosts e SSRF.
  - Proteção contra loops de redirecionamento (`maxRedirects`), estouro de tamanho de resposta (`maxBodyBytes`) e timeout configurável.
  - Sem repasse de cookies ou cabeçalhos de autenticação da aplicação.
- `src/lib/affiliate/mercado-livre.ts`:
  - Integração do `SafeUrlResolver` no método `resolveAffiliateUrl` com allowlist `MERCADO_LIVRE_HOSTS`.
- `scripts/test-secure-affiliate-link-resolver.ts`:
  - Check 1: Validação de IPs privados/loopback/cloud metadata vs públicos PASS.
  - Check 2: Bloqueio de hosts SSRF e hosts fora da allowlist PASS.
  - Check 3: Validação de servidor mock (bloqueio de 127.0.0.1, timeout e classes de erro de redirect) PASS.
  - Check 4: Resolução de link legítimo com allowlist do Mercado Livre PASS.
- Validações:
  - `npx tsx scripts/test-secure-affiliate-link-resolver.ts`: PASS (4/4 checks).
  - `npx tsx scripts/test-affiliate-product-schema.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

