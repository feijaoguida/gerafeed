import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeJsonLd } from "@/lib/seo/structured-data";
import { LandingView } from "./landing-view";

export const metadata: Metadata = {
  title: {
    absolute: siteConfig.home.title,
  },
  description: siteConfig.home.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: siteConfig.home.title,
    description: siteConfig.home.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: "/brand/logo-full.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Automação de Conteúdo com IA para WordPress`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.home.title,
    description: siteConfig.home.description,
    images: ["/brand/logo-full.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={getHomeJsonLd()} />
      <LandingView />
    </>
  );
}
