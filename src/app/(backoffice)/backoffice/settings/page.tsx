import type { Metadata } from "next";
import { SystemSettingsView } from "@/components/backoffice/system-settings-view";

export const metadata: Metadata = {
  title: "Configurações do Sistema | Backoffice",
  description: "Configurações gerais do sistema, parâmetros de governança e retenção de logs.",
};

export default function SystemSettingsPage() {
  return <SystemSettingsView />;
}
