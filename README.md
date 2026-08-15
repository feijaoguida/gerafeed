# 📰 GeraFeed — Curadoria Inteligente de Notícias com IA

<div align="center">

[![Live Demo](https://img.shields.io/badge/Demo-gerafeed.vercel.com-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://gerafeed.vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

<p align="center">
  <strong>Transforme fontes RSS em publicações editoriais prontas para o WordPress com o poder da Inteligência Artificial.</strong>
</p>

[🌐 Acessar Sistema em Produção](https://gerafeed.vercel.com) • [✨ Funcionalidades](#-funcionalidades) • [🛠️ Stacks](#-stacks-utilizadas) • [🚀 Como Rodar](#-como-executar-localmente) • [👤 Autor](#-autor--contato)

</div>

---

## 📌 Sobre o Projeto

O **GeraFeed** (News Curator) é uma plataforma moderna voltada para criadores de conteúdo, portais de notícias e editores. O sistema automatiza a ingestão de notícias a partir de múltiplos feeds RSS, aplica processamento de Inteligência Artificial para reescrever, enriquecer e gerar resumos originais, e permite que o time editorial revise o conteúdo antes de publicá-lo diretamente em sites WordPress com um único clique.

### 🔄 Fluxo de Funcionamento

```
[ Feeds RSS ] ➡️ [ Ingestão e Leitura ] ➡️ [ Processamento IA (OpenAI) ]
                                                        ⬇️
[ Publicação no WordPress ] ⬅️ [ Revisão Editorial (Human-in-the-Loop) ]
```

---

## ✨ Funcionalidades

- 📡 **Agregação de Feeds RSS**: Adicione e gerencie múltiplas fontes de notícias com leitura e parsing rápidos.
- 🤖 **Curadoria & Reescrita com IA**: Geração automática de títulos atrativos, resumos e reescrita de artigos com modelos da OpenAI mantendo o tom editorial desejado.
- ✍️ **Painel de Revisão Humana**: Interface fluida para leitura, edição, aprovação ou descarte de notícias antes da publicação.
- 🚀 **Integração com WordPress**: Conexão direta com a REST API do WordPress para envio e publicação de artigos como rascunho ou publicação imediata.
- 🔒 **Segurança & Criptografia**: Autenticação robusta de usuários e armazenamento seguro de chaves de integração com criptografia AES-256-GCM.
- 🌓 **Interface Moderna & Responsiva**: Design elegante com suporte a tema escuro/claro, micro-animações e foco em produtividade.

---

## 🛠️ Stacks Utilizadas

### Frontend
- **[Next.js 16](https://nextjs.org/)** (App Router, Server Actions e React Server Components)
- **[React 19](https://react.dev/)**
- **[Tailwind CSS v4](https://tailwindcss.com/)** para estilização moderna e utilitária
- **[Framer Motion](https://www.framer.com/motion/)** para transições e micro-interações
- **[Lucide React](https://lucide.dev/)** para ícones modernos e consistentes

### Backend & Serviços
- **[TypeScript](https://www.typescriptlang.org/)** garantindo tipagem estrita de ponta a ponta
- **[Prisma ORM](https://www.prisma.io/)** para modelagem e comunicação com o banco
- **[PostgreSQL](https://www.postgresql.org/)** como banco de dados relacional
- **[Auth.js (NextAuth v5)](https://authjs.dev/)** para autenticação e controle de sessões
- **[OpenAI API](https://platform.openai.com/)** para enriquecimento e geração de textos
- **[RSS Parser](https://www.npmjs.com/package/rss-parser)** para extração estruturada de feeds
- **[WordPress REST API](https://developer.wordpress.org/rest-api/)** para publicação automatizada de posts

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 20 ou superior)
- **npm**, **pnpm** ou **yarn**
- Instância do **PostgreSQL** em execução

### 1. Clonar o Repositório
```bash
git clone https://github.com/roseweltty/news-curator.git
cd news-curator
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com base no modelo `.env.example`:

```bash
cp .env.example .env
```

Preencha as variáveis de ambiente necessárias (banco de dados, chave da OpenAI, segredo do Auth.js e credenciais de integração).

### 4. Executar Migrações do Banco de Dados
```bash
npx prisma db push
# ou npx prisma migrate dev
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para acessar a aplicação.

---

## 🌐 Produção

A aplicação está hospedada e em produção na Vercel:
👉 **[gerafeed.vercel.com](https://gerafeed.vercel.com)**

---

## 👤 Autor & Contato

Desenvolvido por **Roseweltty Guida**.

- 💼 **LinkedIn:** [@rosewelttybguida](https://www.linkedin.com/in/rosewelttybguida/)
- 📧 **Email:** [feijaoguida@hotmail.com](mailto:feijaoguida@hotmail.com)
- 🔗 **Hub de Contatos:** [linktr.ee/rbgsolucoes](https://linktr.ee/rbgsolucoes)

---

<div align="center">
  <sub>GeraFeed © Todos os direitos reservados. Feito com foco em performance e produtividade editorial.</sub>
</div>
