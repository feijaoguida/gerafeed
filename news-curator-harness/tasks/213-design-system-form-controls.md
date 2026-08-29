# Task 213. Design System Form Controls (Input, Textarea, Select, Switch, Label, FormField)

## Objetivo
Padronizar todos os controles de formulário para garantir consistência visual, contraste adequado em Modo Escuro e acessibilidade (WCAG).

## Requisitos
1. **`src/components/ui/label.tsx`**:
   - Rótulo semântico com suporte a indicação de campo obrigatório (`required`).
2. **`src/components/ui/input.tsx`**:
   - Campo de texto estilizado com borda suave, fundo adaptado, focus-visible com anel da cor primária e estados de erro.
3. **`src/components/ui/textarea.tsx`**:
   - Campo multi-linha com redimensionamento vertical seguro.
4. **`src/components/ui/select.tsx`**:
   - Seletor nativo estilizado ou wrapper acessível com chevron customizado.
5. **`src/components/ui/switch.tsx`**:
   - Interruptor liga/desliga com transição fluida e acessibilidade de teclado.
6. **`src/components/design-system/form-field.tsx`**:
   - Componente de composição com `label`, `required`, `description`, `error` e `children` conectado por IDs semânticos.

## Definition of Done
- [ ] Controles de formulário criados.
- [ ] Contraste testado em Light e Dark.
- [ ] Suporte a mensagens de erro e descrições.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
