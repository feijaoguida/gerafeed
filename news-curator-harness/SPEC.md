# News Curator. Phase 2

## 1. Objetivo
Evoluir o MVP para configurações visuais e IA desacoplada de fornecedor.

Nesta fase:
- menu lateral;
- configurações;
- WordPress visual;
- configuração central;
- criptografia;
- helper encrypt/decrypt;
- AIProvider;
- OpenAI;
- Gemini;
- Anthropic;
- OpenAI Compatible;
- tela de IA;
- teste de conexão;
- migração do processamento.

## 2. AI Provider
Fluxo:

Article Processing
→ AIProviderFactory
→ AIProvider
→ OpenAI / Gemini / Anthropic / OpenAI Compatible

O código editorial depende da interface, não do fornecedor.

## 3. Configuração central
Criar `Configuration`:

- id
- key
- value
- createdAt
- updatedAt

`key` deve ser única.

Exemplos:
- `wordpressConnection`
- `aiProvider`

Pode usar JSON/JSONB para value se isso simplificar a evolução. Secrets nunca ficam plaintext.

## 4. WordPress
Tela `Configurações > WordPress`.

Campos:
- URL
- Usuário
- Application Password

Ações:
- Salvar
- Testar conexão
- Sincronizar categorias

Application Password deve ser criptografada.

## 5. Criptografia
Criar helper central:

```ts
encrypt(value: string): string
decrypt(value: string): string
```

Preferir AES-256-GCM.

`ENCRYPTION_KEY` é a chave principal e nunca vai para o banco.

Um SALT/contexto pode ser constante/versionado e participar da derivação, mas não é segunda chave secreta.

Importante:
- não usar SALT como substituto da key;
- nonce/IV novo para cada criptografia;
- armazenar os metadados necessários para decrypt;
- ciphertext autenticado;
- não criar criptografia própria;
- não logar secrets.

Formato versionado pode ser:
`v1:iv:ciphertext:authTag`

Se for desejado um segundo segredo real, usar `PEPPER` separado em environment variable.

## 6. AIProvider
Interface conceitual:

```ts
interface AIProvider {
  generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle>;
  testConnection(): Promise<AIConnectionResult>;
}
```

Criar factory/registry.

### OpenAI
API key + model. Base URL padrão quando aplicável.

### Gemini
Adapter específico, escondendo diferenças da API.

### Anthropic
Adapter específico, escondendo diferenças da API.

### OpenAI Compatible
Configuração:
- apiKey
- baseUrl
- model

Permite OpenRouter, DeepSeek, Kimi e outros endpoints compatíveis.

## 7. Tela de IA
`Configurações > Inteligência Artificial`

Campos:
- Provider
- API Key
- Base URL quando aplicável
- Model

API Key nunca deve ser exibida após salva. Mostrar estado/máscara e permitir substituição.

Ações:
- Salvar
- Testar conexão

## 8. Teste de conexão
Cada provider implementa `testConnection()`.
Executar server-side.
Nunca retornar secrets.

## 9. Migração
Antes:
`processArticle → OpenAI`

Depois:
`processArticle → AIProviderFactory → AIProvider → provider`

O resultado editorial existente deve permanecer compatível.

## 10. Sidebar
Sugestão:

Dashboard

Notícias
- Pendentes
- Publicadas
- Rejeitadas

Configurações
- Fontes RSS
- WordPress
- Inteligência Artificial

## 11. Segurança
Nunca enviar ao client:
- API Key
- Application Password
- ENCRYPTION_KEY

Descriptografar somente no servidor e somente quando necessário.

## 12. Definition of Done global
- [ ] Sidebar
- [ ] Configuração WordPress
- [ ] Configuration no banco
- [ ] Application Password criptografada
- [ ] Helper crypto
- [ ] Testes crypto
- [ ] AIProvider
- [ ] OpenAI
- [ ] Gemini
- [ ] Anthropic
- [ ] OpenAI Compatible
- [ ] Tela IA
- [ ] API Key criptografada
- [ ] Teste de conexão
- [ ] Processamento usa AIProvider
- [ ] Nenhum secret no client/log
- [ ] TypeScript PASS
- [ ] Lint PASS
- [ ] Testes PASS
- [ ] Fluxo RSS → IA → aprovação → WordPress preservado.
