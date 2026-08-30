# Architectural Decisions. Phase 28 SEO & Measurement

## ADR-077. Next.js Metadata API como fonte SEO técnica
Status: Proposed

Metadata, sitemap e robots devem usar recursos nativos do App Router sempre que compatíveis com o projeto atual.

Motivo:
- reduzir dependências;
- manter geração integrada à árvore de rotas;
- facilitar manutenção;
- compatibilidade com Vercel.

## ADR-078. Propriedade Search Console de domínio validada por DNS
Status: Proposed

A validação primária do GeraFeed no Google Search Console deve usar propriedade de domínio.

O código não depende de meta tag de verificação quando DNS estiver validado.

## ADR-079. GTM como camada única de deployment de analytics
Status: Proposed

O container Google Tag Manager é carregado pela aplicação.

GA4 é configurado no GTM.

Não instalar simultaneamente GA4 direto no código e via GTM.

## ADR-080. Analytics sem PII
Status: Proposed

Eventos de analytics usam somente dados comportamentais/categóricos necessários para medir aquisição e ativação.

Email, nome, CPF/CNPJ, IDs internos e secrets não podem ser enviados.

## ADR-081. Consentimento separado de autenticação
Status: Proposed

Consentimento de analytics é preferência de privacidade do visitante e não deve ser inferido de login, cadastro ou aceite de termos.

## ADR-082. Structured Data factual
Status: Proposed

JSON-LD representa somente fatos visíveis/reais.

Ratings, reviews, número de clientes, preços e resultados só entram se houver fonte real, atual e coerente.

## ADR-083. Blog filesystem no MVP de SEO
Status: Proposed

Se não existir CMS/content engine no repositório, usar solução filesystem Markdown/MDX estática/SSG compatível com Vercel.

Motivo:
- baixa complexidade;
- sem novo serviço externo;
- versionamento no Git;
- performance;
- boa integração com sitemap.

A implementação deve primeiro verificar dependências e arquitetura atuais. Se houver solução equivalente já existente, reutilizar.

## ADR-084. Curadoria editorial como posicionamento principal
Status: Proposed

Comunicação pública deve priorizar automação e curadoria editorial assistida por IA.

Evitar promessas de que simples reescrita ou modificação de imagem elimina plágio/direitos autorais.
