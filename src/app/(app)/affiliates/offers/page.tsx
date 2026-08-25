import React from "react";
import { OfferList } from "@/components/affiliate/offer-list";

export const metadata = {
  title: "Ofertas de Afiliados | News Curator",
  description: "Gerenciamento de ofertas e links de parceiros.",
};

export default function AffiliateOffersPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <OfferList />
    </div>
  );
}
