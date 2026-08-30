"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";

interface PublicFooterProps {
  currentYear?: number;
}

export function PublicFooter({ currentYear }: PublicFooterProps) {
  const year = currentYear || new Date().getFullYear();

  const handleOpenConsent = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-consent-preferences"));
    }
  };

  return (
    <footer className="border-t border-border bg-surface py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Coluna 1: Marca & Propósito */}
          <div className="lg:col-span-2 space-y-4">
            <Logo href="/" size="md" />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Plataforma de curadoria e automação editorial assistida por inteligência artificial. Conecte feeds RSS, extraia matérias factuais e publique no WordPress com controle humano integral.
            </p>
            <div className="text-xs text-muted-foreground font-medium">
              <span>Conteúdo que flui. Inteligência que publica.</span>
            </div>
          </div>

          {/* Coluna 2: Soluções */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Soluções
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/automacao-wordpress" className="text-muted-foreground hover:text-foreground transition-colors">
                  Automação WordPress
                </Link>
              </li>
              <li>
                <Link href="/rss-para-wordpress" className="text-muted-foreground hover:text-foreground transition-colors">
                  RSS para WordPress
                </Link>
              </li>
              <li>
                <Link href="/curadoria-de-conteudo-com-ia" className="text-muted-foreground hover:text-foreground transition-colors">
                  Curadoria com IA
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Segmentos */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Segmentos
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/para-agencias" className="text-muted-foreground hover:text-foreground transition-colors">
                  Para Agências
                </Link>
              </li>
              <li>
                <Link href="/para-portais-de-noticias" className="text-muted-foreground hover:text-foreground transition-colors">
                  Portais de Notícias
                </Link>
              </li>
              <li>
                <Link href="/#funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/#precos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Planos & Preços
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Recursos & Conta */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Recursos & Conta
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog & Guias
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dúvidas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Acessar Painel
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Criar Conta Grátis
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenConsent}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                >
                  Preferências de Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {year} GeraFeed. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleOpenConsent}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Privacidade & Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
