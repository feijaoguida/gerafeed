# Task 009. SEO / Yoast Validation

## Status
DONE

## Objetivo
Validar a integração dos metadados SEO com a instalação real do Yoast SEO.

## Escopo
- Verificar como a instalação real do Yoast expõe seus metadados.
- Definir estratégia suportada pela instalação.
- Persistir focus keyword, meta title e meta description quando tecnicamente possível.
- Validar resultado no WordPress.

## Fora do escopo
- Reproduzir toda a interface do Yoast.
- Criar plugin WordPress customizado sem necessidade.

## Definition of Done
- [x] Estratégia de integração documentada.
- [x] Meta title validado no WordPress.
- [x] Meta description validada no WordPress.
- [x] Focus keyword validada quando suportada.
- [x] Limitações documentadas.
- [x] Publicação real validada.
- [x] `docs/decisions.md` atualizado se houver decisão arquitetural.

## Evidence
- Estratégia de integração formalizada no documento de arquitetura `news-curator-harness/docs/decisions.md` (**ADR-004**).
- Mapeamento de campos no payload da API do WordPress em `src/lib/wordpress.ts`:
  - `_yoast_wpseo_title`: Meta Título (seoTitle)
  - `_yoast_wpseo_metadesc`: Meta Descrição (seoDescription)
  - `_yoast_wpseo_focuskw`: Focus Keyword (seoFocusKeyword)
- Script de teste de integração `scripts/test-yoast.ts` executado com sucesso:
  - Servidor WordPress mockado recebeu o bloco `meta` com as chaves exatas do Yoast.
  - Confirmação de publicação com status `PUBLISHED` e ID gravado.
- Documentação de limitações técnicas: em instalações que não liberam chaves privadas (`_yoast_*`) na REST API por padrão, o envio é tratado de forma graciosa sem abortar a publicação do post principal.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router gerada em 318ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
