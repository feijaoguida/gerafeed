import React from "react";
import { ProductDetail } from "@/components/affiliate/product-detail";

export const metadata = {
  title: "Gerenciar Produto | News Curator Afiliados",
  description: "Detalhes, especificações e ofertas do produto de afiliados.",
};

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ProductDetail productId={id} />
    </div>
  );
}
