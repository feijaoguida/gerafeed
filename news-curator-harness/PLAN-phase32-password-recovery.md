# Plano Phase 32 — Recuperação de Senha ("Esqueceu a Senha") com Código de Segurança via E-mail

## Estado
Concluída com sucesso em 2026-10-05.
Tasks 261 a 265: DONE.

## Resultado esperado
Permitir que usuários da plataforma GeraFeed redefinam suas senhas esquecidas com segurança, autonomia e experiência fluida.
O fluxo reutilizará os mecanismos de e-mail e OTP de 6 dígitos existentes, adicionando isolamento estrito de tokens (`password-reset:${email}`), proteção contra enumeração de usuários (respostas uniformes), proteção anti-flood (cooldown de 60 segundos), ciclo de vida de 15 minutos e consumo único.
Na interface, a tela de login ganha o link "Esqueceu a senha?", que direciona para a nova rota `/forgot-password`, implementada com o padrão visual Dark Mode do GeraFeed, split panel institucional, validação de campos em 2 passos, timer regressivo para reenvio e feedback amigável ao concluir.

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 32](SPEC.md#phase-32-recuperação-de-senha-esqueceu-a-senha-com-código-de-segurança-via-e-mail).
- Regras de execução: [AGENTS.md](AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões arquiteturais: [docs/decisions.md](docs/decisions.md), ADR-092.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [261](tasks/261-password-reset-email-template.md) | Template de e-mail de recuperação de senha com código OTP e instruções | Autorização |
| [262](tasks/262-password-reset-api-endpoints.md) | Endpoints de solicitação (`/send-code`) e redefinição (`/reset`) com token isolado e anti-enumeração | 261 |
| [263](tasks/263-login-link-and-proxy-route.md) | Link "Esqueceu a senha?" no formulário de login e liberação de rota pública em `src/proxy.ts` | 262 |
| [264](tasks/264-forgot-password-page-and-view.md) | Página `/forgot-password` e view em 2 passos com timer regressivo, acessibilidade e design GeraFeed | 262, 263 |
| [265](tasks/265-phase32-integration-and-hardening.md) | Script de testes automatizados, validação de segurança (anti-flood, anti-enumeração, expiração), lint, tsc e build | 261–264 |

## Estratégia de validação

| Área | Cenários essenciais |
|---|---|
| Template & Envio | Renderização de HTML e texto com código OTP de 6 dígitos destacado, tempo de expiração explícito e aviso de segurança |
| Segurança de Tokens | Isolamento de propósito com `identifier: password-reset:${cleanEmail}`, validade de 15 min, deleção após uso e rejeição de tokens de cadastro |
| Anti-Enumeração | Endpoint `/send-code` retorna HTTP 200 e mensagem idêntica para e-mails cadastrados e não cadastrados |
| Anti-Flood | Tentativa de reenvio antes de 60 segundos retorna HTTP 429 com contador de segundos restantes |
| Redefinição de Senha | Código incorreto rejeitado (HTTP 400), código expirado rejeitado (HTTP 400), senha com menos de 6 caracteres rejeitada (HTTP 400), troca com hash seguro (`bcryptjs`) |
| Login Pós-Reset | Usuário consegue efetuar login normalmente com a nova senha e a senha antiga deixa de funcionar |
| Interface & UX | Layout responsivo (mobile e desktop), timer regressivo de 60s desabilitando botão de reenvio, toggle de visualização de senha e redirecionamento para login com mensagem de sucesso |
| Não-regressão | TypeScript estrito (`tsc --noEmit`), lint sem erros e build do Next.js aprovado |
