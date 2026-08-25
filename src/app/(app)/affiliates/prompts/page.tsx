import { PromptTemplateManager } from "@/components/affiliate/prompt-template-manager";

export const metadata = {
  title: "Templates de Prompt de Afiliados | News Curator",
  description: "Gerencie e personalize os templates de inteligência artificial para artigos comerciais de afiliados.",
};

export default function AffiliatePromptsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <PromptTemplateManager />
    </div>
  );
}
