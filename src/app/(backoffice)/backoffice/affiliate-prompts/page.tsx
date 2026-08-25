import { Metadata } from "next";
import { AffiliatePromptManager } from "@/components/backoffice/affiliate-prompt-manager";

export const metadata: Metadata = {
  title: "Prompts Globais de Afiliados | Backoffice",
  description: "Governança e versionamento central de prompts de IA para formatos comerciais de afiliados.",
};

export default function AffiliatePromptsBackofficePage() {
  return <AffiliatePromptManager />;
}
