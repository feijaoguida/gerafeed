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

export const metadata: Metadata = {
  title: "GeraFeed - Conteúdo que flui. Inteligência que publica.",
  description: "Curadoria inteligente de notícias RSS, reescrita assistida por IA e publicação automática no WordPress",
  icons: {
    icon: "/brand/icon.png",
    shortcut: "/brand/icon.png",
    apple: "/brand/icon.png",
  },
};

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
