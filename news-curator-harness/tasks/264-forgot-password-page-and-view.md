# Task 264: Página e Visualização de Recuperação de Senha (/forgot-password)

## Status
DONE

## Contexto
Desenvolver a interface visual de recuperação de senha em `src/app/(public)/forgot-password/`:
- `page.tsx`: Server Component de entrada com metadata SEO adequada.
- `forgot-password-view.tsx`: Client Component interativo com fluxo dividido em 2 passos suaves e intuitivos.
O design deve seguir o padrão institucional das telas de autenticação (`/login` e `/register`), com painel escuro à esquerda e formulário à direita.

## Critérios de Aceitação
- [x] Criar `src/app/(public)/forgot-password/page.tsx`:
  - Metadata com título: "Recuperar Senha - GeraFeed".
  - Renderização do componente `ForgotPasswordView`.
- [x] Criar `src/app/(public)/forgot-password/forgot-password-view.tsx`:
  - Layout dividido (split view) com painel institucional da GeraFeed à esquerda (BrandDecoration, Logo, destaques).
  - Formulário interativo em 2 passos:
    - **Passo 1 (Solicitação de Código)**:
      - Campo de e-mail com validação.
      - Botão "Enviar código de segurança" com estado de carregamento (`isLoading`).
      - Link para voltar ao login ("Lembrou sua senha? Fazer login").
    - **Passo 2 (Confirmação e Redefinição)**:
      - Exibição do e-mail de destino com opção de "Trocar e-mail".
      - Campo de código OTP de 6 dígitos com máscara ou input numérico focado.
      - Campo "Nova senha" com toggle de visibilidade (Eye/EyeOff) e indicador de mínimo de caracteres.
      - Campo "Confirmar nova senha" com validação de correspondência.
      - Botão "Redefinir Senha".
      - Botão "Reenviar código" condicionado a um timer regressivo de 60 segundos (cooldown visual).
  - Tratamento de estados de erro e sucesso com alerts contextuais amigáveis.
  - Ao concluir a redefinição com sucesso:
    - Feedback visual de confirmação.
    - Redirecionamento automático ou com botão para `/login`.
- [x] Responsividade testada para dispositivos móveis e desktop.
- [x] TypeScript estrito (`npx tsc --noEmit`).
- [x] ESLint sem advertências (`npm run lint`).

## Evidências
- `src/app/(public)/forgot-password/page.tsx` criado com metadados SEO ("Recuperar Senha - GeraFeed").
- `src/app/(public)/forgot-password/forgot-password-view.tsx` implementado com:
  1. Painel institucional escuro à esquerda com selos de segurança (código de 15min, criptografia forte, foco editorial).
  2. Formulário passo 1: input de e-mail, botão com loader e retorno ao login.
  3. Formulário passo 2: código OTP de 6 dígitos formatado em fonte mono/tracking, inputs de nova senha e confirmação com show/hide, botão de salvar senha, timer regressivo de 60s para reenvio e atalho de voltar.
  4. Tela de sucesso amigável com botão direto para login.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Rota `/forgot-password` criada, navegável e responsiva.
- Fluxo de 2 passos implementado com validações de campos e timer regressivo de reenvio.
- `npx tsc --noEmit` PASS.
- `npm run lint` PASS.
