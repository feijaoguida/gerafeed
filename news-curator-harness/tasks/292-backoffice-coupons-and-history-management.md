# Task 292: Gestão de Cupons de Desconto, Histórico de Planos e Histórico de Sites no Backoffice

## Status
DONE

## Contexto
O SuperAdmin precisa cadastrar e gerenciar Cupons de Desconto no Backoffice (`/backoffice/coupons`), além de visualizar o Histórico de Planos e o Histórico de Cadastro de Sites das empresas.
Os campos solicitados para o cadastro de cupom são:
- **Nome** (`name`)
- **Código** (`code` — código único para digitação, ex.: `INFLUENCER19`)
- **Descrição** (`description`)
- **Válido até** (`validUntil`)
- **Plano (múltiplos planos)** (`planIds` — relação N:N `CouponPlan`)
- **Tipo de desconto** (`PERCENTAGE` = Percentual, `FIXED_DISCOUNT` = Valor Fixo de Desconto, `FIXED_PRICE` = Preço Fixo Promocional ex.: pagar R$ 19,90)
- **Quanto tempo** (`durationMonths`: `0` = Para Sempre, `1` = Primeiro Mês, `3` = Os 3 Primeiros Meses, e qualquer número inteiro de `0` acima)
- **Tipo de Cliente** (`NEW` = Novo, `BASE` = Base, `BOTH` = Ambos)
- **Campos adicionais**: Ativo/Inativo (`active`), Limite global de usos (`maxUses`) e Limite de usos por conta (`maxUsesPerWorkspace`).

## Escopo de Implementação

### 1. APIs de Cupons no Backoffice (`src/app/api/backoffice/coupons/`)
Todas protegidas por `assertSuperAdmin()` e instrumentadas com `handleApiError` (`module: "BACKOFFICE"`):
1. **`GET /api/backoffice/coupons` e `POST /api/backoffice/coupons` (`src/app/api/backoffice/coupons/route.ts`)**:
   - `GET`: Lista todos os cupons com seus planos associados (`plans: { include: { plan: true } }`), contagem de resgates (`_count.redemptions`) e últimos resgates, além da lista de planos ativos disponíveis para seleção.
   - `POST`: Cria novo cupom validando:
     - `name` e `code` obrigatórios (`code` normalizado em uppercase, verificando unicidade);
     - Ao menos 1 plano selecionado em `planIds`;
     - `discountType` (`PERCENTAGE`, `FIXED_DISCOUNT` ou `FIXED_PRICE`) e `discountValue > 0`;
     - Validação de consistência: para cada plano selecionado, o valor final calculado deve ser positivo e menor que o valor original do plano;
     - `durationMonths`: inteiro `>= 0` (`0` = Para Sempre, `1` = 1º Mês, `3` = 3 Primeiros Meses...);
     - `customerType`: `NEW`, `BASE` ou `BOTH`.
2. **`PATCH /api/backoffice/coupons/[id]` e `DELETE /api/backoffice/coupons/[id]` (`src/app/api/backoffice/coupons/[id]/route.ts`)**:
   - Permite editar dados do cupom, atualizar os planos vinculados (`CouponPlan`), ativar/inativar (`active: boolean`) ou excluir (caso não possua resgates ativos, ou inativar com segurança).

### 2. Interface de Gestão de Cupons no Backoffice (`/backoffice/coupons`)
1. Criar página `src/app/(backoffice)/backoffice/coupons/page.tsx` e componente `src/components/backoffice/coupon-manager.tsx`:
   - Adicionar link **"Cupons de Desconto"** no menu lateral `src/components/backoffice/backoffice-sidebar.tsx` logo abaixo de **"Planos & Features"**.
   - Listagem em cards/tabela exibindo:
     - Código em badge copiável (ex.: `INFLUENCER19`), Nome e Descrição;
     - Tipo e Valor do Desconto + Prévia real por plano (ex.: *"Plano Influencer: de R$ 89,90 por R$ 19,90"*);
     - Duração formatada (`"Nos 3 primeiros meses"`, `"No 1º mês"`, `"Para Sempre"`);
     - Público-alvo (`"Cliente Novo"`, `"Cliente Base"`, `"Novo e Base"`);
     - Validade (`"Válido até DD/MM/AAAA"` ou `"Sem expiração"`) e Usos (`usedCount / maxUses`);
     - Botões de Editar e Ativar/Inativar.
   - Modal completo de Criação/Edição com:
     - Nome, Código (com botão "Gerar Código"), Descrição, Válido até;
     - Checkboxes para selecionar **Múltiplos Planos**;
     - Tipo de Desconto (`Percentual (%)`, `Desconto Fixo (R$)`, `Valor Fixo da Mensalidade (R$)`) e Valor;
     - Campo numérico **Quanto tempo (meses)** (`min="0"`, step `1`) com legenda dinâmica em tempo real (`0 = Para Sempre`, `1 = Primeiro Mês`, `3 = Os 3 Primeiros Meses`);
     - Seletor **Tipo de Cliente** (`Novo`, `Base`, `Ambos`);
     - **Simulador em Tempo Real no Modal**: Mostra para cada plano marcado exatamente como ficará a cobrança no Asaas (ex.: *"Plano Influencer: 3 primeiras cobranças de R$ 19,90 e demais cobranças de R$ 89,90"*).

### 3. Histórico de Planos e Histórico/Liberação de Sites em Detalhes da Empresa (`/backoffice/companies/[id]`)
1. Atualizar `src/app/(backoffice)/backoffice/companies/[id]/page.tsx`, `src/app/api/backoffice/companies/[id]/route.ts` e `src/components/backoffice/company-details.tsx`:
   - Ao alterar o plano manualmente pelo Backoffice (`PATCH /api/backoffice/companies/[id]`), gravar registro em `PlanHistory` (`eventType: "BACKOFFICE_UPDATE"`).
   - Na aba **"Plano & Cobrança"** da empresa:
     - Exibir informações do cupom ativo na assinatura (se houver: código, valor promocional, ciclos restantes) e a tabela/timeline completa de **Histórico de Planos (`PlanHistory`)** daquela empresa.
   - Na aba **"Sites WordPress"** da empresa:
     - Exibir o **Histórico de Registro de Sites (`SiteRegistrationHistory`)** da empresa e permitir que o SuperAdmin clique em **"Liberar Domínio para Suporte"** (`POST /api/backoffice/companies/[id]/wordpress/clear-domain-lock`) caso um cliente legítimo tenha entrado em contato com o suporte após cair no bloqueio da 3ª conta.

## Critérios de Aceitação (Definition of Done)
- [x] Rota `/backoffice/coupons` acessível no menu do Backoffice apenas para SuperAdmin.
- [x] Criação e edição de cupom suportando múltiplos planos, desconto percentual/fixo/preço fixo, duração de `0` acima e tipo de cliente (`NEW`, `BASE`, `BOTH`).
- [x] Simulador visual no formulário exibindo o valor promocional e o valor após os $N$ meses para cada plano selecionado.
- [x] Histórico de Planos e Histórico de Sites visíveis em `/backoffice/companies/[id]`.
- [x] Qualquer erro nas APIs do Backoffice é gravado em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Evidência de Conclusão
- `src/app/api/backoffice/coupons/route.ts` e `src/app/api/backoffice/coupons/[id]/route.ts`: CRUD completo com suporte a múltiplos planos, validações financeiras e inativação segura.
- `src/components/backoffice/backoffice-sidebar.tsx`: Link "Cupons de Desconto" adicionado ao menu lateral.
- `src/app/(backoffice)/backoffice/coupons/page.tsx` e `src/components/backoffice/coupon-manager.tsx`: Interface completa com métricas, listagem, badges copiáveis, gerador de códigos e simulador de faturamento em tempo real.
- `src/app/api/backoffice/companies/[id]/route.ts` e `src/components/backoffice/company-details.tsx`: Timeline de `PlanHistory` e tabela de `SiteRegistrationHistory` com botão de liberação pelo suporte (`clear-domain-lock`).
- Teste integrado executado com sucesso: `npx tsx scripts/phase39/test-task292.ts` (PASS).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

