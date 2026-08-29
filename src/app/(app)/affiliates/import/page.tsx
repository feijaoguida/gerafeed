import { AffiliateImporter } from "@/components/affiliate/affiliate-importer";
import { PageHeader } from "@/components/design-system/page-header";
import { Link2 } from "lucide-react";

export const metadata = {
  title: "Importar Produto de Afiliado | GeraFeed",
  description: "Importação e curadoria segura de links de afiliados do Mercado Livre.",
};

export default function AffiliateImportPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        title="Importar Produto de Afiliado"
        description="Cole links de afiliados do Mercado Livre para extrair metadados, revisar dados e salvar no catálogo do seu workspace."
        icon={<Link2 className="w-5 h-5" />}
      />

      <AffiliateImporter />
    </div>
  );
}
