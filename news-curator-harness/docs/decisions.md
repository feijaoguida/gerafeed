# Architectural Decisions

## ADR-010. Estratégia de Modificação de Imagens
Status: Accepted

### Contexto
O usuário precisa de imagens para as notícias, mas a cópia exata de imagens de terceiros pode gerar problemas de duplicidade ou copyright. Foi solicitado o uso da imagem original com modificações (via IA ou simples, como inversão).

### Decisão
O sistema oferecerá uma estratégia configurável. Para modificações "sutis" e "inversão", implementaremos inicialmente um processamento programático usando a biblioteca `sharp` (Node.js). Ela permite espelhar horizontalmente (flop), alterar brilho/saturação e aplicar filtros de forma rápida, barata e determinística. Integrações com IA gerativa de imagem (DALL-E 3) poderão ser acopladas posteriomente na mesma interface de pipeline, mas o `sharp` resolve o MVP de alteração sutil eficientemente.

### Consequência
O backend precisará baixar a imagem original, processá-la via buffer com `sharp`, salvá-la temporariamente (ou em cloud storage/diretório public) e disponibilizar a URL para aprovação.

## ADR-011. Atribuição de Fonte
Status: Accepted

### Contexto
Todo artigo gerado deve informar a fonte original.

### Decisão
Um campo `creditName` será adicionado ao modelo `Source`. Durante a montagem do payload para publicação no WordPress, o backend anexará o texto de crédito no final do HTML gerado.

### Consequência
O fluxo do editor não precisa que a IA gere o crédito no corpo do texto. O crédito é anexado de forma programática na etapa de `Aprovar e Publicar`, garantindo que não seja perdido caso a IA se perca no prompt.
