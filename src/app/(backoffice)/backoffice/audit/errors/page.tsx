import type { Metadata } from "next";
import { ErrorLogsViewer } from "@/components/backoffice/error-logs-viewer";

export const metadata: Metadata = {
  title: "Logs de Erro e Diagnóstico | Backoffice",
  description: "Visualizador de logs de erro do sistema com filtros e stack traces.",
};

export default function ErrorLogsPage() {
  return <ErrorLogsViewer />;
}
