import React from "react";
import { ProductNew } from "@/components/affiliate/product-new";

export const metadata = {
  title: "Novo Produto | News Curator Afiliados",
  description: "Cadastre um novo produto de afiliados manualmente.",
};

export default function NewProductPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ProductNew />
    </div>
  );
}
