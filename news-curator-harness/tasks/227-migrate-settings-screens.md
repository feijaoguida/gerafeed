# Task 227. Migrate Settings Screens (WordPress, Sources, AI, Images)

## Objetivo
Migrar as páginas de configurações do sistema para os novos blocos `SectionHeader`, `Card`, `FormField`, `Switch`, `Input` e `Button`.

## Telas Afetadas
1. `src/app/(app)/settings/wordpress/page.tsx`:
   - Conexão e teste de sites WordPress, credenciais e listagem de categorias sincronizadas.
2. `src/app/(app)/settings/sources/page.tsx`:
   - Cadastro e listagem de feeds RSS, switch de ativação e overrides de prompt.
3. `src/app/(app)/settings/ai/page.tsx`:
   - Configurações de provedores (OpenAI, Gemini, Claude), temperatura, chaves e prompts editoriais.
4. `src/app/(app)/settings/images/page.tsx`:
   - Preferências de geração de capas, proporção e processamento com Sharp.

## Critérios de Aceite
- [ ] Formulários unificados e responsivos.
- [ ] Light Mode e Dark Mode consistentes.
- [ ] TypeScript PASS e Lint PASS.
