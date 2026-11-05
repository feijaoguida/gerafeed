# Plano Phase 35 — Criação Manual de Matérias (Pauta/Texto), 4 Níveis de Complemento com IA, Upload de Fotos e Criação de Fotos pela Matéria

## Estado
Autorizada pelo usuário em 2026-11-03.
Em andamento: Task 273 IN_PROGRESS.

## Resultado esperado
Permitir que o usuário crie e publique matérias a partir de textos, pedaços de texto, ideias de pauta ou entrevistas:
1. **4 Estilos / Níveis de Complemento de Matéria (`CompletionLevel`) com Prompts Dedicados**:
   - **Formatar (`FORMAT_ONLY`)**: Não faz alteração no texto, somente formata, cria parágrafos e estrutura HTML sem alterar o texto original.
   - **Leve (`LIGHT`)**: Faz a formatação, pequenas alterações dentro do estilo escolhido na configuração e pode inserir pequenos trechos.
   - **Média (`MEDIUM`)**: Faz a formatação, alterações mais pontuais dentro do estilo, podendo inserir trechos criados pela IA.
   - **Grande (`LARGE`)**: Faz a formatação, alterações e complementação da matéria dentro do estilo, podendo inserir grandes partes de trechos criados pela IA.
2. **Opção de Enviar Fotos e Imagens para colocar na matéria**:
   - Upload seguro de imagens para **Capa (Mídia Destacada)** e para o **Corpo da Matéria** (com legenda opcional e inserção no cursor ou distribuição automática entre parágrafos).
   - Sincronização automática de imagens embutidas no corpo com a biblioteca de mídia do WordPress (`/wp-json/wp/v2/media`) ao publicar.
3. **Opção de Criar Fotos através da Matéria (IA)**:
   - Geração de foto de capa ou imagem para o corpo do artigo a partir do contexto da matéria usando o motor de imagens por IA e estilos visuais (Realista, Desenho, Cartoon, Sátira Cartoon, Personalizado).

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [273](tasks/273-manual-article-prompts-and-contracts.md) | Contratos `CompletionLevel` e motor de prompts específicos para os 4 níveis (`src/lib/ai/manual-prompts.ts`) | Autorização |
| [274](tasks/274-image-upload-and-wordpress-inline-media.md) | Endpoint seguro `/api/images/upload`, suporte a Data URI no Sharp e upload de imagens inline para o WordPress | 273 |
| [275](tasks/275-manual-article-creation-api-and-pipeline.md) | Endpoint `POST /api/articles/manual` e suporte a `completionLevel` em `processArticleWithAi` e `/api/articles/[id]/process-ai` | 273, 274 |
| [276](tasks/276-manual-article-ui-and-review-enhancements.md) | Tela `/publishing/manual`, atalhos em `/publishing` e `/articles`, upload/geração de fotos e seletor de nível em `/articles/[id]` | 274, 275 |
| [277](tasks/277-phase35-e2e-tests-and-security-audit.md) | Testes automatizados E2E (`scripts/phase35/test-phase35-e2e.ts`), Security Scanner, Security Audit, `tsc --noEmit`, `lint` e `build` | 276 |

## Verification Plan

### Automated Security Check
- **Security Scanner**: Run a scan on all newly created files to identify common vulnerabilities (e.g., XSS, SQL injection, unsafe file handling). If findings are detected, auto-apply the fix and document the results.
- **Security Audit**: Audit the new code for design-level security issues (input validation, magic bytes verification on image uploads, size limits, HTML sanitization, multi-tenant isolation, secrets handling, auth checks). Document findings and remediations in the `walkthrough.md` artifact using the `generate_security_audit_report` skill.

