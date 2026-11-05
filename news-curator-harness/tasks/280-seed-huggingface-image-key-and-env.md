# Task 280: Configuração da Chave Hugging Face de Imagens no Seed e Variáveis de Ambiente

## Status
DONE

## Contexto
Configurar a chave do Hugging Face na configuração da IA de Imagens através do `prisma/seed.ts` e variáveis de ambiente (`.env` / `.env.example`), de modo que o workspace padrão já venha com o provedor de imagens Hugging Face configurado e criptografado com AES-256-GCM.

1. **Variáveis de Ambiente (`.env` e `.env.example`)**:
   - `HUGGINGFACE_API_KEY` adicionada em `.env` com a chave do usuário e `.env.example` com placeholder seguro.
2. **Seed (`prisma/seed.ts`)**:
   - Etapa adicionada no seed configurando `imageSettings` para o workspace padrão (`workspace.id`):
     - `defaultStrategy`: `"AI_GENERATED"`
     - `imageStyle`: `"REALISTIC"`
     - `imageProvider`: `"huggingface"`
     - `useSameKeyAsTextAi`: `false`
     - `customApiKey`: `encrypt(hfApiKey)`
     - `customModel`: `"black-forest-labs/FLUX.1-schnell"`

## Critérios de Aceitação
- [x] Adicionar `HUGGINGFACE_API_KEY` em `.env` e placeholder em `.env.example`.
- [x] Atualizar `prisma/seed.ts` para criptografar e salvar `imageSettings` com `imageProvider: "huggingface"` e a chave `HUGGINGFACE_API_KEY`.
- [x] Executar `npx tsx prisma/seed.ts` e verificar que a configuração foi persistida com sucesso no banco de dados.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `.env` e `.env.example` atualizados com `HUGGINGFACE_API_KEY`.
- `prisma/seed.ts` atualizado com a etapa de configuração de IA de Imagens com Hugging Face.
- `npx tsx prisma/seed.ts`: executado com sucesso, exibindo:
  `✓ IA de Imagens configurada com Hugging Face (black-forest-labs/FLUX.1-schnell) para o workspace Workspace Principal.`
- Teste de decodificação de credenciais (`resolveImageCredentials("default-workspace")`):
  `provider: 'huggingface', model: 'black-forest-labs/FLUX.1-schnell', isInherited: false, keyPrefix: 'hf_JsCd...'`
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
