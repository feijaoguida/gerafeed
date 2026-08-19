/**
 * Formats original editorial publication date in pt-BR timezone America/Sao_Paulo.
 * Falls back to 'Data não informada pela fonte' if null or missing.
 */
export function formatEditorialDate(date: Date | string | null | undefined): string {
  if (!date) return "Data não informada pela fonte";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Data não informada pela fonte";

  return d.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
