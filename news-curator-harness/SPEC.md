# News Curator. Phase 3

## 1. Objetivo
Evoluir o sistema para gerenciar mídias (imagens) de forma inteligente e garantir a devida atribuição (créditos) às fontes originais.

Nesta fase:
- Campo "Fonte" no cadastro de RSS.
- Configuração global de estratégia de imagens (Original vs. Processada/IA).
- Processamento de imagens (inversão, filtros sutis ou IA) para diferenciação.
- Comparação visual (Original x Alterada) na tela de aprovação.
- Inserção automática dos créditos no final do artigo gerado.

## 2. AI Provider e Processamento
O fluxo existente de `AIProvider` permanece. A novidade é a etapa de processamento de imagem que ocorre após a coleta e antes (ou durante) a aprovação.

## 3. Configuração central
Adicionar nova chave na tabela `Configuration`:
- `imageSettings` (JSON)
  Exemplo de valor: `{ "strategy": "MODIFIED", "modificationType": "FLIP_HORIZONTAL" }`

## 4. WordPress
A publicação no WordPress agora deve enviar a imagem escolhida (Original ou Alterada) como `featured_media`. O upload da imagem para o media library do WP deve ocorrer na aprovação, ou a URL externa deve ser usada (se o WP estiver configurado para aceitar).

## 5. Criptografia
Sem mudanças estruturais nesta fase.

## 6. Telas e UI
### Cadastro de RSS
Adicionar campo opcional "Fonte". Descrição: "Usado para informar no final das Matérias".

### Configurações de Imagem
Nova aba ou seção em Configurações para escolher a estratégia padrão de imagens.

### Editor de Aprovação
O painel de edição do artigo deve exibir:
- Imagem Original (com label).
- Imagem Alterada (com label).
Permitir que o usuário selecione qual versão será publicada (radio button ou seleção visual).

## 7. Geração e Atribuição
No momento de montar o conteúdo final para o WordPress, o sistema deve concatenar automaticamente:
`<br><br><p><em>Fonte: {Nome da Fonte}</em></p>` (ou formato equivalente) no final do `content`.

## 8. Definition of Done global (Phase 3)
- [x] Schema do Prisma atualizado (Source.creditName, Article.modifiedImageUrl).
- [x] Cadastro de RSS refatorado para incluir campo Fonte.
- [x] Configuração de Estratégia de Imagem criada no banco e na UI.
- [x] Pipeline de processamento de imagem implementado (Sharp para inversão/filtros ou integração IA).
- [x] Tela de aprovação exibindo as duas versões da imagem lado a lado.
- [x] Seleção de imagem final pelo usuário.
- [x] Artigo publicado contendo a atribuição (Fonte) no final do texto.
- [x] Imagem correta enviada ao WordPress.
- [x] TypeScript PASS, Lint PASS.

---

# News Curator — Phase 4: Prompt Customization

## 1. Objetivo
Permitir que o usuário personalize o prompt editorial da IA diretamente pela interface, sem necessidade de alterar código. O `SYSTEM_PROMPT_EDITORIAL`, atualmente uma constante fixa em `src/lib/ai/types.ts`, passará a ser construído dinamicamente com base nas preferências do usuário.

Nesta fase:
- Personalização da **área do portal** (ex: Tecnologia, Política, Humor, etc.).
- Seleção de até **3 estilos de escrita** (ex: Informativo, Atraente, Sério, etc.).
- Opção de informar valores personalizados (texto livre, máximo 100 caracteres) para área e estilo.
- Preview do prompt gerado na interface.
- O prompt sem configuração deve usar defaults retrocompatíveis (portal de tecnologia e negócios, estilo atraente).

## 2. Configuração central
Nova chave na tabela `Configuration`:
- `aiPromptSettings` (JSON)
  Exemplo de valor:
  ```json
  {
    "portalArea": "Tecnologia",
    "customPortalArea": "",
    "writingStyles": ["Informativo", "Atraente"],
    "customWritingStyle": ""
  }
  ```

Sem alterações no schema do Prisma — usa a tabela `Configuration` existente.

## 3. Opções pré-definidas

### Áreas do Portal
- Tecnologia
- Negócios
- Política
- Ciência
- Saúde
- Entretenimento
- Esportes
- Educação
- Humor
- Meio Ambiente
- Outro (texto livre, max 100 caracteres)

### Estilos de Escrita (selecionar até 3)
- Informativo
- Atraente
- Sério
- Alegre
- Humorístico
- Analítico
- Provocativo
- Casual
- Técnico
- Persuasivo
- Outro (texto livre, max 100 caracteres)

## 4. Prompt dinâmico
A constante `SYSTEM_PROMPT_EDITORIAL` deve ser transformada em uma função `buildSystemPrompt(settings?)` que:
- Sem argumentos: retorna o prompt padrão atual (retrocompatível).
- Com argumentos: injeta a área e os estilos escolhidos no texto do prompt.

Os 4 providers (OpenAI, Gemini, Anthropic, OpenAI-Compatible) devem usar a função em vez da constante.

A função `processArticleWithAi` em `src/lib/ai.ts` deve carregar `aiPromptSettings` do banco via `getConfig` e repassar ao provider.

## 5. Telas e UI
### Página de configurações de IA (`/settings/ai`)
A página existente deve ser refatorada em **2 abas**:

**Aba 1 — Conexão** (conteúdo atual, sem alteração funcional)
- Seleção do provedor, API Key, Model, Base URL.

**Aba 2 — Prompt Editorial** (nova)
- Seleção da área do portal (radio buttons + campo "Outro").
- Seleção de estilos de escrita (checkboxes, máximo 3 + campo "Outro").
- Preview read-only do trecho do prompt gerado.
- Botão "Salvar Configurações do Prompt".

## 6. API
Novo endpoint `GET/POST /api/ai/prompt-settings`:
- **GET**: Retorna as configurações salvas.
- **POST**: Valida (max 3 estilos, max 100 chars nos campos livres) e salva sob a chave `aiPromptSettings`.

## 7. Definition of Done global (Phase 4)
- [x] Endpoint `GET/POST /api/ai/prompt-settings` criado e funcional.
- [x] Configuração salva na chave `aiPromptSettings` da tabela `Configuration`.
- [x] `buildSystemPrompt(settings?)` gera prompt dinâmico.
- [x] Prompt sem configuração usa defaults (retrocompatível).
- [x] Todos os 4 providers usam `buildSystemPrompt` em vez da constante fixa.
- [x] Página `/settings/ai` com 2 abas (Conexão + Prompt Editorial).
- [x] Seleção de área do portal funcional com opção "Outro".
- [x] Seleção de até 3 estilos de escrita funcional com opção "Outro".
- [x] Campos "Outro" validados (max 100 caracteres).
- [x] Preview do prompt na UI.
- [x] TypeScript PASS, Lint PASS.
