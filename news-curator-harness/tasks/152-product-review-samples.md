# Task 152. Product Review Samples

## Objetivo
Importar até 5 avaliações públicas para grounding.

## Model
ProductReviewSample: workspaceId, productId, provider, rating?, text, sourceUrl?, capturedAt.

## Regras
Sem PII desnecessária; max 5; não tratar como estatística.

## Definition of Done
- [x] schema/migration
- [x] provider
- [x] max5
- [x] UI
- [x] refresh
- [x] grounding formatter
- [x] tests/TypeScript/Lint/Build PASS
