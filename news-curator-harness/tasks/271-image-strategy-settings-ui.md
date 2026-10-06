# Task 271: Interface de Configurações de Estratégia de Imagem

## Status
DONE

## Contexto
Modernizar a tela de Configurações de Imagem em `/settings/images` (`src/app/(app)/settings/images/page.tsx`):
1. **Seleção de Estratégia Principal**:
   - Três opções em cards com badges:
     - `ORIGINAL`: Imagem original do RSS (Badge "Sem custo de IA").
     - `MODIFIED`: Processar / Inverter imagem com Sharp (Badge "Sem custo de IA").
     - `AI_GENERATED`: Gerar Nova Imagem com IA (Badge "Consome Créditos de IA").
2. **Configuração de Estilo Visual**:
   - Grid de estilos visuais com preview de ícones e descrições claras:
     - Realista (Fotojornalismo)
     - Cartoon (3D / Animação)
     - Desenho (Ilustração Artística)
     - Sátira Cartoon (Charge / Caricatura Editorial)
     - Personalizado (abre campo de texto livre)
3. **Detecção e Exibição da Chave da LLM**:
   - Consulta o provedor de texto configurado no Workspace:
     - Se **OpenAI**: exibe card informativo com badge *"Usando mesma chave da LLM de texto (OpenAI — DALL-E 3)"*.
     - Se **Google Gemini**: exibe *"Usando mesma chave da LLM de texto (Google Gemini — Imagen 3)"*.
     - Se **OpenRouter**: exibe *"Usando mesma chave da LLM de texto (OpenRouter — FLUX.1)"*.
     - Se **Anthropic**: **nenhum provedor selecionado**, com alerta / tooltip em destaque explicando:
       > *"A Anthropic (Claude) não possui API de geração de imagens. Para gerar novas imagens por IA, selecione um provedor de imagens abaixo (OpenAI, Gemini ou OpenRouter) e informe sua respectiva chave de API."*
   - Toggle / Checkbox "Usar chave dedicada para imagens" permitindo sobrescrever o provedor e a chave mesmo que a LLM principal suporte imagens.
4. **Editor de Prompt Base**:
   - Visualização e edição do template de prompt base de imagem, com indicação das variáveis disponíveis (`{{title}}`, `{{characters}}`, `{{context}}`, `{{scene}}`, `{{style}}`).

## Critérios de Aceitação
- [x] Atualizar `src/app/(app)/settings/images/page.tsx` com o design system do GeraFeed.
- [x] Implementar a seleção entre `ORIGINAL`, `MODIFIED` e `AI_GENERATED`.
- [x] Implementar o seletor de estilo visual e campo de prompt customizado.
- [x] Implementar a lógica de herança de chave da LLM e exibição do tooltip/alerta explicativo para Anthropic.
- [x] Persistência completa através da API `POST /api/images/config`.
- [x] `npx tsc --noEmit` PASS (0 erros).

## Evidências
- `src/app/(app)/settings/images/page.tsx`: Interface completa e responsiva modernizada com design system GeraFeed, cards com badges para ORIGINAL, MODIFIED e AI_GENERATED, seletor visual dos 5 estilos (Realista, Cartoon, Desenho, Sátira Cartoon, Personalizado), herança automática de chave com indicação de provedor ativo, alerta explicativo para Anthropic e editor do prompt template com variáveis e botão de restaurar padrão.
- `scripts/phase33/test-settings-ui-flow.ts`: PASS (100% dos testes cobrindo gravação, leitura, alternância de estilos e restauração).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Interface responsiva com design moderno e feedback visual imediato.
- Lógica de herança e caso Anthropic totalmente cobertos.
- TypeScript sem erros.
