"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getStoredConsent, updateGtmConsent } from "@/lib/consent";

interface GoogleTagManagerProps {
  tagId?: string;
  gtmId?: string;
}

/**
 * Provedor do Google Tag (gtag.js) e Google Tag Manager (GTM).
 * - Totalmente integrado com Google Consent Mode v2 (LGPD / ePrivacy).
 * - Suporta identificadores:
 *   - Google Analytics 4 / Google Tag: G-XXXXXX, GT-XXXXXX, AW-XXXXXX
 *   - Google Tag Manager Container: GTM-XXXXXX
 * - Injetado no RootLayout, cobrindo a home e todas as demais páginas públicas.
 */
export function GoogleTagManager({ tagId, gtmId }: GoogleTagManagerProps) {
  useEffect(() => {
    // Sincroniza consentimento prévio armazenado no client
    const consent = getStoredConsent();
    if (consent) {
      updateGtmConsent(consent.analytics);
    }
  }, []);

  const activeId =
    tagId ||
    gtmId ||
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ||
    process.env.NEXT_PUBLIC_GA_ID ||
    process.env.NEXT_PUBLIC_GTM_ID ||
    "G-HDXPFN8TR0";

  const isGtm = Boolean(activeId && /^GTM-[A-Z0-9]+$/i.test(activeId));
  const isGtag = Boolean(activeId && /^(G|GT|AW)-[A-Z0-9]+$/i.test(activeId));

  if (!isGtm && !isGtag) return null;

  return (
    <>
      {/* 1. Google Consent Mode v2 Default (executado de imediato antes de qualquer tag) */}
      <script
        id="google-consent-default"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied'
            });
          `,
        }}
      />

      {/* 2. Google Tag (gtag.js) para GA4 (ex: G-HDXPFN8TR0) */}
      {isGtag && (
        <>
          <Script
            id="google-tag-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${activeId}`}
          />
          <Script
            id="google-tag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${activeId}');
              `,
            }}
          />
        </>
      )}

      {/* 3. Container GTM (ex: GTM-XXXXX) */}
      {isGtm && (
        <Script
          id="gtm-container"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${activeId}');
            `,
          }}
        />
      )}
    </>
  );
}
