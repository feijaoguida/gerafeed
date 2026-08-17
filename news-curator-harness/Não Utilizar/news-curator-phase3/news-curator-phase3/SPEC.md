# News Curator. Phase 3
Adicionar imagens ao fluxo editorial e atribuição da fonte.
Estratégias: ORIGINAL, AI_VARIANT, NONE.
Configuração: `Configuration.imageSettings`.
Imagem: `originalImageUrl`, `processedImageUrl`, `selectedImageType`, `imageSource`, `imageSourceUrl`, `imageCredit`, `imageStatus`.
Criar `ImageProvider` separado de `AIProvider`.
Na revisão, mostrar original e processada lado a lado e permitir escolher original, processada ou nenhuma.
No RSS adicionar `sourceCredit`, opcional, com descrição `Usado para informar no final das Matérias`.
Quando preenchido, adicionar Fonte no final do artigo, sanitizada e sem duplicação.
No WordPress, imagem selecionada deve virar featured image via upload de Media.
Não tratar espelhar/inverter/cortar/alterar sutilmente como autorização para reutilizar imagem de terceiros. Crédito não substitui licença/permissão. Não remover marca d'água ou ocultar origem.
Definition of Done: sourceCredit, imageSettings, ImageProvider, proveniência, três estratégias, revisão, escolha, featured image, fonte no artigo, TypeScript/Lint/Testes e fluxo ponta a ponta.
