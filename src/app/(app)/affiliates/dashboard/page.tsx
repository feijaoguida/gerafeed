import React from "react";
import { AffiliateDashboardView } from "@/components/affiliate/affiliate-dashboard-view";

export const metadata = {
  title: "Analytics & Dashboard de Afiliados | News Curator",
  description: "Métricas de cliques, engajamento e desempenho de links afiliados.",
};

export default function AffiliateDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <AffiliateDashboardView />
    </div>
  );
}
