import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.defaultDescription,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { GoogleTagManager } from "@/components/analytics/google-tag-manager";
import { ConsentBanner } from "@/components/analytics/consent-banner";

/**
 * Root layout — shell global: fontes oficiais Sora & Inter, tema claro/escuro e ThemeProvider.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleTagManager />
          {children}
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
