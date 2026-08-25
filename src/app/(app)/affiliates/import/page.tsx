import { AffiliateImporter } from "@/components/affiliate/affiliate-importer";

export const metadata = {
  title: "Importar Produto de Afiliado | GeraFeed",
  description: "Importação e curadoria segura de links de afiliados do Mercado Livre.",
};

export default function AffiliateImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Importar Produto de Afiliado
        </h1>
        <p className="text-sm text-muted-foreground">
          Cole links de afiliados do Mercado Livre para extrair metadados, revisar dados e salvar no catálogo do seu workspace.
        </p>
      </div>

      <AffiliateImporter />
    </div>
  );
}
