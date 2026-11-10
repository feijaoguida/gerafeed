# Task 300: Sanitização HTML contra Stored XSS e Proteção Anti-SSRF na Coleta RSS e Scraper

## Status
DONE

## Contexto
A auditoria de segurança pré-produção identificou nos itens **14 (Sanitização contra XSS)** e **20 (Abuse Cases — SSRF)**:
1. Em `src/components/affiliate/affiliate-article-editor.tsx` (linha 740) e `src/components/affiliate/affiliate-block-manager.tsx` (linhas 625 e 883), strings HTML (`block.data.html`, `occurrencePreview`, `previewHtml`) são injetadas diretamente via `dangerouslySetInnerHTML` sem sanitização contra tags `<script>`, `<iframe>` ou atributos `on*` (`onerror`, `onload`, `onclick`), permitindo Stored XSS caso um feed externo ou descrição de produto contenha payload malicioso.
2. Em `src/lib/rss.ts` (`fetchAndParseRss`), `src/lib/scraper.ts` (`scrapeArticleContent`) e `src/app/api/sources` (`POST` e `PATCH`), URLs informadas pelo usuário ou extraídas de feeds são requisitadas sem passar pela validação anti-SSRF que já existe em `src/lib/affiliate/ssrf.ts`, permitindo acesso a endereços internos (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`) ou metadados de nuvem (`169.254.169.254`).

## Escopo de Implementação

### 1. Sanitizador HTML Seguro (`src/lib/security/sanitize-html.ts`)
1. Criar módulo `src/lib/security/sanitize-html.ts` com a função `sanitizeHtml(dirtyHtml: string): string`:
   - Remover integralmente blocos `<script>...</script>`, `<iframe>...</iframe>`, `<object>...</object>`, `<embed>`, `<applet>`, `<form>...</form>`, `<base>`, `<meta>` e `<link>`.
   - Remover todos os atributos de eventos JavaScript inline (`on[a-z]+\s*=`, como `onerror`, `onload`, `onclick`, `onmouseover`, `onfocus`, etc.) e `srcdoc`.
   - Neutralizar URLs executáveis em atributos `href`, `src`, `action` e `xlink:href` que utilizem protocolos `javascript:`, `vbscript:` ou `data:text/html` (preservando `data:image/(jpeg|jpg|png|webp|gif);base64,...` legítimos usados pelas imagens processadas pelo Sharp).
   - Preservar intactos os elementos editoriais semânticos (`<p>`, `<h1>`–`<h6>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<b>`, `<em>`, `<i>`, `<a>`, `<img>`, `<figure>`, `<figcaption>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<blockquote>`, `<div>`, `<span>`, `<br>`, `<hr>`) e os comentários marcadores `<!-- gerafeed-block:... -->`.

### 2. Aplicação da Sanitização contra XSS nos Componentes e Persistência
1. Em `src/components/affiliate/affiliate-article-editor.tsx`:
   - Envolver `block.data.html || block.data.markdown || ""` com `sanitizeHtml(...)` antes de passar ao `dangerouslySetInnerHTML`.
2. Em `src/components/affiliate/affiliate-block-manager.tsx`:
   - Envolver `occurrencePreview` e `previewHtml` com `sanitizeHtml(...)` antes de passar ao `dangerouslySetInnerHTML`.
3. Em `src/lib/affiliate/article-persistence-service.ts`:
   - Higienizar o campo `content` HTML recebido do cliente com `sanitizeHtml` ao salvar alterações no artigo.

### 3. Proteção Anti-SSRF Unificada em Fontes RSS e Scraper (`src/lib/affiliate/ssrf.ts`, `src/lib/rss.ts`, `src/lib/scraper.ts`, `/api/sources`)
1. Em `src/lib/affiliate/ssrf.ts`:
   - Exportar função utilitária reutilizável `validateSafeRemoteUrl(rawUrl: string): Promise<URL>` que:
     1. Faz parse e exige protocolo `http:` ou `https:`;
     2. Rejeita URLs com credenciais embutidas (`username` / `password`);
     3. Rejeita hostnames proibidos (`localhost`, `*.localhost`, `*.local`, `metadata.google.internal`);
     4. Resolve o DNS (`validateHostDns`) e bloqueia qualquer IP privado, loopback (`127.0.0.1`, `::1`), link-local (`169.254.169.254`) ou reservado (`isPrivateIp`).
2. Em `POST /api/sources` (`src/app/api/sources/route.ts`) e `PATCH /api/sources/[id]` (`src/app/api/sources/[id]/route.ts`):
   - Validar `rssUrl` com `validateSafeRemoteUrl(rssUrl)` antes de gravar no banco.
   - Caso seja detectado IP privado/loopback/SSRF ou URL inválida, registrar em `SystemErrorLog` (`module: "RSS"`, `statusCode: 400`) e retornar `HTTP 400` com mensagem amigável.
3. Em `src/lib/rss.ts` (`fetchAndParseRss`):
   - Executar `await validateSafeRemoteUrl(url)` antes de chamar `parser.parseURL(url)`.
4. Em `src/lib/scraper.ts` (`scrapeArticleContent`):
   - Executar `await validateSafeRemoteUrl(url)` antes de requisitar a página e validar redirecionamentos HTTP (máximo de 5 hops, validando `validateSafeRemoteUrl` em cada `Location` de redirect, usando `safeFetchWithRedirects` de `src/lib/affiliate/ssrf.ts`).

## Critérios de Aceitação (Definition of Done)
- [x] `sanitizeHtml` criado em `src/lib/security/sanitize-html.ts` e aplicado em `affiliate-article-editor.tsx`, `affiliate-block-manager.tsx` e `article-persistence-service.ts`.
- [x] Payloads XSS (`<script>`, `onerror=`, `javascript:`, `<iframe>`) são 100% neutralizados sem quebrar HTML editorial válido nem Data URIs de imagens (`data:image/...`).
- [x] `validateSafeRemoteUrl` bloqueia `http://127.0.0.1`, `http://localhost`, `http://169.254.169.254`, `http://10.0.0.1`, `http://192.168.1.1` e `file://` em `/api/sources`, `src/lib/rss.ts` e `src/lib/scraper.ts`.
- [x] Teste automatizado `scripts/phase40/test-task300-xss-and-ssrf.ts` validando todos os vetores.
- [x] `npx tsc --noEmit`: PASS (0 erros).
- [x] `npm run lint`: PASS (0 erros).

## Evidências
- `src/lib/security/sanitize-html.ts`: criado e implementado.
- Sanitização aplicada em `src/components/affiliate/affiliate-article-editor.tsx`, `src/components/affiliate/affiliate-block-manager.tsx` e `src/lib/affiliate/article-persistence-service.ts`.
- Anti-SSRF unificado via `validateSafeRemoteUrl` em `src/lib/affiliate/ssrf.ts`, `src/app/api/sources/route.ts`, `src/app/api/sources/[id]/route.ts`, `src/lib/rss.ts` e `src/lib/scraper.ts`.
- `npx tsx scripts/phase40/test-task300-xss-and-ssrf.ts`: PASS (todos os vetores testados e validados).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

