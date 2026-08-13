# Architectural Decisions

## ADR-001. Next.js como frontend e backend
Status: Accepted

Usar Next.js App Router, Server Components e Route Handlers no MVP.

## ADR-002. Processamento manual
Status: Accepted

Não usar cron no MVP.

## ADR-003. RSS antes de scraping
Status: Accepted

RSS/Atom é a fonte primária.

## ADR-004. Configuração central
Status: Accepted

Usar tabela `Configuration` com chave única para configurações administráveis.

## ADR-005. Secrets criptografados no banco
Status: Accepted

Application Password e API Keys serão persistidas criptografadas. A chave principal fica somente no ambiente.

## ADR-006. AES-256-GCM
Status: Accepted

Usar AES-256-GCM ou mecanismo autenticado equivalente. Cada valor recebe nonce/IV novo.

## ADR-007. SALT não é segunda chave
Status: Accepted

SALT é contexto para derivação/separação de finalidade. Não substitui a chave principal. Um segundo segredo real deve ser PEPPER separado.

## ADR-008. AIProvider
Status: Accepted

O processamento depende de uma interface `AIProvider`, com adapters OpenAI, Gemini, Anthropic e OpenAI Compatible.

## ADR-009. OpenAI Compatible
Status: Accepted

Um adapter genérico permite OpenRouter, DeepSeek, Kimi e outros endpoints compatíveis sem adapter individual.
