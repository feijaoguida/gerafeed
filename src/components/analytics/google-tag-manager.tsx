"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getStoredConsent, updateGtmConsent } from "@/lib/consent";

interface GoogleTagManagerProps {
  gtmId?: string;
  tagId?: string;
}

/**
 * Provedor do Google Tag Manager (GTM) e Google Tag (gtag.js).
 * - Totalmente integrado com Google Consent Mode v2 (LGPD / ePrivacy).
 * - Suporta identificadores:
 *   - Google Tag Manager Container: GTM-MK74DPB7 (com suporte a noscript iframe)
 *   - Google Analytics 4 / Google Tag: G-HDXPFN8TR0
 * - Injetado no RootLayout, cobrindo a home e todas as demais páginas públicas.
 */
export function GoogleTagManager({ gtmId, tagId }: GoogleTagManagerProps) {
  useEffect(() => {
    // Sincroniza consentimento prévio armazenado no client
    const consent = getStoredConsent();
    if (consent) {
      updateGtmConsent(consent.analytics);
    }
  }, []);

  const activeGtmId =
    gtmId ||
    process.env.NEXT_PUBLIC_GTM_ID ||
    "GTM-MK74DPB7";

  const activeTagId =
    tagId ||
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ||
    process.env.NEXT_PUBLIC_GA_ID ||
    "G-HDXPFN8TR0";

  const hasValidGtm = Boolean(activeGtmId && /^GTM-[A-Z0-9]+$/i.test(activeGtmId));
  const hasValidTag = Boolean(activeTagId && /^(G|GT|AW)-[A-Z0-9]+$/i.test(activeTagId));

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

      {/* 2. Container Google Tag Manager (GTM-MK74DPB7) */}
      {hasValidGtm && (
        <>
          <Script
            id="gtm-container"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${activeGtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${activeGtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* 3. Google Tag (gtag.js) para GA4 (G-HDXPFN8TR0) */}
      {hasValidTag && (
        <>
          <Script
            id="google-tag-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${activeTagId}`}
          />
          <Script
            id="google-tag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${activeTagId}');
              `,
            }}
          />
        </>
      )}
    </>
  );
}
