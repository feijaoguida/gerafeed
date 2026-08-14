# MEMORY.md
News Curator: RSS → IA → revisão → WordPress. Processamento manual, até 5 notícias.
Stack: Next.js, TypeScript, Prisma, PostgreSQL, Tailwind, shadcn/ui, Vercel.
Configuration: wordpressConnection, aiProvider, imageSettings.
Imagens: ORIGINAL, AI_VARIANT, NONE. Original e processada separadas, com proveniência.
RSS: `sourceCredit` opcional, descrição `Usado para informar no final das Matérias`.
Secrets criptografados, ENCRYPTION_KEY server-only, SALT é contexto adicional.
