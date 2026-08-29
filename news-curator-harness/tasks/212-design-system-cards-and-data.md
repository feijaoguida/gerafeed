# Task 212. Design System Cards and Data (Card Primitives, StatCard, Progress, StatusIndicator)

## Objetivo
Implementar a família de componentes de Card e exibição de dados/métricas para os painéis do GeraFeed.

## Requisitos
1. **`src/components/ui/card.tsx`**:
   - Primitivas: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
   - Variantes CVA: `default`, `elevated`, `interactive`, `highlighted`.
   - Estilização: superfície limpa com borda suave no Light Mode, navy profundo com relevo e sombra/glow sutil no Dark Mode.
2. **`src/components/design-system/stat-card.tsx`**:
   - Props: `title`, `value`, `description`, `icon`, `trend`, `trendDirection` (`up` | `down` | `neutral`), `variant`, `action`.
   - Layout responsivo para dashboards (compatível com os cards da visão geral).
3. **`src/components/ui/progress.tsx`**:
   - Barra de progresso com cálculo automático percentual (`value`, `max`), variantes de cor e suporte a label/descrição.
4. **`src/components/design-system/status-indicator.tsx`**:
   - Ponto de status com pulso opcional para estados de sincronização/conexão (`CONNECTED`, `PROCESSING`, `ERROR`).

## Definition of Done
- [ ] Primitivas de Card e StatCard criadas.
- [ ] Progress e StatusIndicator com suporte a Light/Dark.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
