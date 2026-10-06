# Task — Documentação de criação e cadastro de chaves de IA

## Status
DONE

## Contexto e autorização
Pedido do usuário em 2026-10-06, com confirmação explícita de **somente arquivos
de documentação**. Não havia task IN_PROGRESS no PROGRESS. A primeira pendência
identificada, task 267 da Phase 33, foi lida e trata de geração de imagens;
o pedido atual prioriza esta task documental independente, sem iniciar a 267.
Identificador descritivo para não ocupar a numeração do plano de imagens em edição.
Durante a execução, outra edição atualizou o cabeçalho do PROGRESS para a Phase
33; esse estado foi preservado, com evidências desta entrega em seção própria.

## Escopo
- Guia em português para OpenAI, Google Gemini, Anthropic Claude, OpenRouter,
  DeepSeek e Kimi/Moonshot, conforme provedores citados na interface atual.
- Passos para obter a chave, links oficiais, cobrança e preenchimento dos
  campos existentes em `/settings/ai`, incluindo salvar antes de testar.
- Textos curtos de ajuda para futura inclusão no cadastro, com referências ao guia.
- Explicar modelos, restrições de plano, segurança, troca de chave e erros comuns.
- Somente Markdown; sem alterações de UI, APIs, dependências, banco ou publicação.

## Definition of Done
- Conferir instruções externas em fontes oficiais e registrar data e links.
- Conferir cadastro e teste contra código existente, sem prometer suporte a
  qualquer modelo ou funcionalidades de imagem ainda planejadas.
- Revisar links locais, âncoras, escopo e ausência de credenciais reais.
- `npx tsc --noEmit` e `npm run lint` executados, com resultado registrado.
- Testes de execução, build e integração de provedores não aplicáveis a esta
  alteração exclusivamente documental; não gerar chaves nem consumir APIs pagas.
- Registrar evidências e Discovered Work no PROGRESS.

## Evidências
- `docs/guia-chaves-ia.md`: guia com seis serviços, tabela de configuração,
  criação de chaves, links oficiais, cobrança, cadastro, teste, troca e diagnóstico.
- `docs/ajuda-cadastro-chaves-ia.md`: textos para futura publicação no site e
  ajuda por campo/provedor na tela existente; nenhuma integração implementada.
- Fontes oficiais consultadas em 2026-10-06: OpenAI Help/Platform, Google AI for
  Developers, Claude Platform/Help, OpenRouter Docs, DeepSeek Docs e Kimi Platform.
- Fluxo conferido em `src/app/(app)/settings/ai/page.tsx`, `/api/ai/config`,
  `/api/ai/test`, `src/lib/ai/service.ts` e adapters dos provedores.
- Revisão local por Python: PASS (2 documentos, 23 links locais/âncoras,
  sem padrões de chaves reais nem whitespace final).
- `npx tsc --noEmit`: PASS (exit 0).
- `npm run lint`: PASS (exit 0; 0 erros e 5 warnings em arquivos não alterados).
- Build, testes de execução e integração real: não aplicáveis ao escopo Markdown.
  Não foram criadas chaves nem feitas chamadas pagas ou publicações.
