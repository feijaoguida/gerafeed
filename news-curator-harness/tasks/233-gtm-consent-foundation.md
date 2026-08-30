# Task 233. Google Tag Manager & Consent Foundation

## Contexto

Search Console/GA4/GTM são cadastrados externamente. Esta task recebe o Container ID pelo `docs/google-handoff.md` e instala a camada técnica de tags e consentimento.

## Pré-condição

Confirmar que `docs/google-handoff.md` possui:

```text
NEXT_PUBLIC_GTM_ID=GTM-...
```

Se não houver ID, a implementação pode preparar suporte por env, mas deve continuar funcional sem carregar GTM.

## Objetivo

Implementar:

1. integração única do GTM;
2. fundação de consentimento de analytics;
3. persistência e reabertura da escolha;
4. integração com dataLayer/Consent Mode sem PII;
5. UI acessível usando Design System GeraFeed.

## Antes de implementar

Inspecione:

- dependências atuais;
- uso de `next/script` ou pacotes Google existentes;
- scripts de analytics já presentes;
- root/public layouts;
- política de privacidade/cookies existente;
- componentes de modal/banner/design system;
- CSP/security headers, se existirem.

Se já houver analytics, identificar risco de duplicação antes de adicionar qualquer script.

## Decisão técnica

GTM é a camada única de deployment de tags Google nesta fase.

GA4 deve ser criado/configurado dentro do GTM externamente.

Não adicionar simultaneamente um snippet `gtag.js` direto com o mesmo GA4.

## Implementação

### A. Environment

Adicionar documentação/env example:

```text
NEXT_PUBLIC_GTM_ID=
```

Não commitar ID real em arquivo de exemplo se a convenção do projeto não faz isso.

O app deve funcionar normalmente quando env estiver vazia em local/test.

### B. Loader GTM

Implementar uma única integração no nível apropriado da árvore.

Requisitos:

- somente browser;
- somente quando ID for válido/configurado;
- sem duplicação entre root/public/app layouts;
- compatível com Next.js;
- sem bloquear conteúdo principal desnecessariamente.

### C. Consent state

Modelo mínimo:

```ts
type ConsentPreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
}
```

Nesta fase:

- necessary sempre true;
- analytics opt-in/out do usuário;
- marketing reservado e default false.

Persistir versão das preferências para permitir evolução futura.

Não inferir consentimento do login.

### D. Default before choice

Garantir que o estado de consentimento apropriado seja estabelecido antes do disparo de tags analíticas que dependam dele.

A implementação deve seguir o comportamento do Google Consent Mode compatível com GTM atual.

Evitar race condition em que GA4 dispara antes do estado default.

### E. Banner/Preferences

UI deve:

- explicar finalidade de analytics em linguagem simples;
- oferecer aceitar analytics e continuar sem analytics;
- não esconder recusa;
- permitir reabrir preferências por link no footer ou equivalente;
- usar componentes existentes;
- ser keyboard accessible;
- funcionar em Light/Dark.

Não escrever alegação "100% LGPD" ou equivalente.

### F. Privacy page

Se política aprovada já existir, garantir link visível.

Se não existir conteúdo jurídico, não fabricar. Registrar Discovered Work.

## Fora de escopo

- Google Ads;
- remarketing;
- Meta Pixel;
- Hotjar;
- CMP paga;
- eventos de conversão específicos, que entram na Task 234.

## Definition of Done

- [ ] GTM configurável por env.
- [ ] nenhum GTM duplicado.
- [ ] app funciona sem env em dev/test.
- [ ] estado default de consentimento implementado.
- [ ] analytics pode ser aceito e recusado.
- [ ] escolha persiste.
- [ ] preferências podem ser reabertas.
- [ ] UI usa Design System e é acessível.
- [ ] nenhum PII é enviado na fundação.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] testes aplicáveis PASS.
- [ ] Build PASS.

## Validation

Executar validações técnicas e testar manualmente:

1. visitante novo sem escolha;
2. aceitar analytics;
3. recusar analytics;
4. reload mantendo escolha;
5. reabrir preferências e mudar decisão;
6. ambiente sem `NEXT_PUBLIC_GTM_ID`;
7. ambiente com ID válido.

Validação externa posterior:

- GTM Preview;
- Tag Assistant;
- GA4 Realtime.

## Evidence

Registrar sequência de consentimento, screenshots/logs seguros quando cabível, env usada apenas mascarada e resultados de build.
