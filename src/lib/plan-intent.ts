export interface PlanIntent {
  slug: string;
  cycle: "MONTHLY" | "YEARLY";
  planName?: string;
  price?: number;
}

const STORAGE_KEY = "gerafeed_plan_intent";

/**
 * Salva a intenção de contratação do plano no sessionStorage do navegador.
 */
export function savePlanIntent(intent: PlanIntent): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch (e) {
    console.warn("[PlanIntent] Falha ao salvar no sessionStorage:", e);
  }
}

/**
 * Recupera a intenção de plano armazenada.
 */
export function getStoredPlanIntent(): PlanIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlanIntent;
  } catch (e) {
    console.warn("[PlanIntent] Falha ao ler do sessionStorage:", e);
    return null;
  }
}

/**
 * Remove a intenção de plano armazenada após conclusão ou cancelamento.
 */
export function clearPlanIntent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[PlanIntent] Falha ao limpar sessionStorage:", e);
  }
}
