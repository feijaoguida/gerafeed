import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "News Curator",
  description: "Curadoria de notícias via RSS com inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-zinc-950 text-zinc-100" suppressHydrationWarning>
        <Suspense fallback={<div className="w-64 bg-zinc-900 border-r border-zinc-800" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
