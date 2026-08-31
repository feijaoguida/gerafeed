"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Radio,
  Globe,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  Cpu,
  Image as ImageIcon,
  Star,
  Sliders,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandDecoration } from "@/components/design-system/brand-decoration";
import { Logo } from "@/components/brand/logo";
import { trackEvent } from "@/lib/analytics";
import { PublicFooter } from "@/components/landing/public-footer";
import { PricingCarousel } from "@/components/landing/pricing-carousel";
import type { PublicPlan } from "@/lib/public-plans";

interface LandingViewProps {
  plans?: PublicPlan[];
}

export function LandingView({ plans }: LandingViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-70 dark:opacity-40">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#2563EB]/20 via-[#7C3AED]/15 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[45%] -left-40 w-[600px] h-[500px] bg-[#2563EB]/10 blur-[140px] rounded-full" />
        <div className="absolute top-[75%] -right-40 w-[600px] h-[500px] bg-[#7C3AED]/10 blur-[140px] rounded-full" />
      </div>

      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-border/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo href="/" size="md" priority />

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors duration-200">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors duration-200">
              Como Funciona
            </a>
            <a href="#diferenciais" className="hover:text-foreground transition-colors duration-200">
              Diferenciais
            </a>
            <a href="#precos" className="hover:text-foreground transition-colors duration-200">
              Preços
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors duration-200">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-surface-muted transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() =>
                trackEvent("cta_click", {
                  cta_location: "header",
                  page_path: "/",
                })
              }
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Comece Grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <BrandDecoration variant="waves" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-[#00C2A8]" />
            Para Donos de Blogs, Portais & Afiliados de Alta Performance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 max-w-5xl mx-auto"
          >
            Automatize a Curadoria e Publicação de Conteúdo no{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#00C2A8]">
              WordPress com IA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10"
          >
            Conteúdo que flui. Inteligência que publica. O <strong>GeraFeed</strong> monitora feeds RSS,
            faz scraping factual completo, reescreve com IA e publica direto no WordPress em 1 clique.
          </motion.p>

          {/* Value Bullets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-sm text-foreground/90 mb-10 max-w-3xl mx-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
              <span>Artigos 100% únicos com base na matéria original</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
              <span>Tratamento de imagens com créditos legais</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
              <span>Publicação direta no WordPress via REST API</span>
            </div>
          </motion.div>

          {/* Main CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto"
          >
            <Link
              href="/register"
              onClick={() =>
                trackEvent("cta_click", {
                  cta_location: "hero",
                  page_path: "/",
                })
              }
              className="w-full py-4 px-8 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Criar Conta Grátis Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#00C2A8] inline" />
              Não exige cartão de crédito no cadastro.
            </p>
          </motion.div>

          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-1.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-foreground font-bold ml-1">4.9 / 5.0</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span>
              Mais de <strong className="text-foreground font-semibold">10.000 artigos</strong> gerados e publicados
              por agências, portais de notícia e afiliados.
            </span>
          </motion.div>
        </section>

        {/* 3. Seção "Problema vs. Solução" */}
        <section id="diferenciais" className="py-20 bg-surface-muted/50 border-y border-border relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
                Transformação Editorial
              </h2>
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                O Jeito Antigo vs. O Jeito <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#7C3AED]">GeraFeed</span>
              </p>
              <p className="font-sans text-muted-foreground text-base mt-4">
                Redatores manuais demoram horas. Plugins automáticos copiam e colam gerando penalizações no Google.
                O GeraFeed une IA sofisticada à revisão humana em 1 clique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* O Jeito Antigo */}
              <div className="p-8 rounded-3xl bg-surface border border-rose-500/20 relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Jeito Tradicional & Exaustivo</h3>
                    <p className="text-xs text-rose-500">Lento, caro e com risco de cópia</p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>2 a 3 horas perdidas</strong> diariamente buscando pautas em dezenas de portais.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Risco de plágio:</strong> Conteúdo copiado sem reescrita profunda viola direitos e afunda o SEO.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Snippets rasos:</strong> Feeds tradicionais só entregam 1 ou 2 frases da matéria original.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Trabalho manual monótono:</strong> Copiar título, baixar imagem, colar no WordPress, formatar tags.
                    </span>
                  </li>
                </ul>
              </div>

              {/* O Jeito GeraFeed */}
              <div className="p-8 rounded-3xl bg-surface border-2 border-primary/40 relative overflow-hidden shadow-xl shadow-primary/5">
                <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-[11px] font-extrabold uppercase tracking-wider rounded-bl-xl">
                  Eficiência Máxima
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Com o GeraFeed AI</h3>
                    <p className="text-xs text-[#00C2A8]">Escala infinita com qualidade e originalidade</p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-foreground/90">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0 mt-0.5" />
                    <span>
                      <strong>Coleta contínua e automática:</strong> Feeds RSS monitorados com scraping de conteúdo completo.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0 mt-0.5" />
                    <span>
                      <strong>Reescrita Jornalística com IA:</strong> Títulos magnéticos, formatação estruturada e SEO on-page.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0 mt-0.5" />
                    <span>
                      <strong>Imagens & Atribuição Legal:</strong> Transformação visual automática e menção à fonte original.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0 mt-0.5" />
                    <span>
                      <strong>Aprovação em 1 Clique:</strong> Revise em segundos e despache instantaneamente para o WordPress.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Como Funciona */}
        <section id="como-funciona" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Fluxo Simplificado
            </h2>
            <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              4 Passos para Automatizar a Produção do seu Portal
            </p>
            <p className="font-sans text-muted-foreground text-base mt-4">
              Do feed RSS bruto à matéria impecavelmente publicada no seu WordPress em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Cadastre seus Feeds",
                desc: "Insira links RSS de portais relevantes do seu nicho de atuação.",
                icon: <Radio className="w-6 h-6 text-primary" />,
              },
              {
                step: "02",
                title: "Scraping & IA",
                desc: "O motor captura o texto original e reescreve uma matéria rica e 100% inédita.",
                icon: <Cpu className="w-6 h-6 text-[#7C3AED]" />,
              },
              {
                step: "03",
                title: "Revisão Ágil",
                desc: "Ajuste título, texto e imagem com score de originalidade visual.",
                icon: <Sliders className="w-6 h-6 text-[#00C2A8]" />,
              },
              {
                step: "04",
                title: "Publicação no WP",
                desc: "Envio instantâneo para o WordPress com categorias e status definidos.",
                icon: <Globe className="w-6 h-6 text-primary" />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="text-3xl font-heading font-black text-muted/50 mb-4">
                  {item.step}
                </div>
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-heading text-base font-bold text-foreground mb-1.5">
                  {item.title}
                </h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Funcionalidades */}
        <section id="funcionalidades" className="py-24 bg-surface-muted/40 border-y border-border transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
                Recursos Premium
              </h2>
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Construído para Portais Profissionais de Alta Escala
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  Multi-Destinos WordPress
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Gerencie múltiplos sites WordPress a partir de um único painel. Associe feeds específicos
                  a cada destino e aplique prompts editoriais customizados.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mb-6">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  Tratamento Anti-Plágio de Imagens
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Geração de capas otimizadas com filtros e reprocessamento automático via Sharp,
                  preservando a atribuição jurídica da fonte original.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#00C2A8]/10 text-[#00C2A8] flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  Monetização & Afiliados
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Módulo integrado para importação de produtos (Mercado Livre e URLs), criação automática de reviews,
                  comparações e injeção de links de afiliado com rastreio de cliques.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Depoimentos */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Quem usa o GeraFeed
            </h2>
            <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Aprovado por Portais de Conteúdo e Editores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="font-sans text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;Gerenciamos 12 portais de notícias. Antes precisávamos de uma equipe inteira
                  só para garimpar pautas. Com o GeraFeed, uma única pessoa revisa e publica mais de 60 matérias por dia com alta qualidade.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  RC
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Rodrigo Carvalho</h4>
                  <p className="text-xs text-muted-foreground">Diretor na Vox Media Agency</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="font-sans text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;A tecnologia de reescrita a partir do conteúdo completo da matéria nos garantiu autoridade no Google Discover. O tráfego orgânico cresceu mais de 180% em dois meses.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold text-sm">
                  ML
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Mariana Lacerda</h4>
                  <p className="text-xs text-muted-foreground">Fundadora do TechDiário</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="font-sans text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;A integração com múltiplos portais WordPress e o módulo de afiliados tornaram o GeraFeed indispensável para monetizar blogs com publicações automáticas.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-[#00C2A8]/10 text-[#00C2A8] flex items-center justify-center font-bold text-sm">
                  FA
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Felipe Albuquerque</h4>
                  <p className="text-xs text-muted-foreground">Especialista em SEO & Afiliados</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Pricing */}
        <section id="precos" className="py-24 bg-surface-muted/40 border-y border-border transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
                Planos Transparentes
              </h2>
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Escolha o Plano Ideal para a Sua Escala
              </p>
              <p className="font-sans text-muted-foreground text-base mt-4">
                Comece grátis e faça upgrade conforme o seu volume de blogs e publicações aumentar.
              </p>
            </div>

            {/* Carrossel de Planos Dinâmicos do Banco de Dados */}
            <PricingCarousel plans={plans || []} />
          </div>
        </section>

        {/* 8. FAQ */}
        <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Tire suas Dúvidas
            </h2>
            <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Perguntas Frequentes
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Preciso da minha própria chave de API da OpenAI?",
                a: "No plano gratuito (Starter), você utiliza o modelo BYOK, bastando colar sua chave da OpenAI, Anthropic ou Gemini. Nos planos pagos, a IA já está inclusa sem custos extras de infraestrutura.",
              },
              {
                q: "O GeraFeed funciona com qualquer site WordPress?",
                a: "Sim! O GeraFeed se comunica nativamente com qualquer WordPress (versão 5.6+) utilizando a REST API e Application Passwords oficiais. Não é necessário instalar plugins pesados de terceiros.",
              },
              {
                q: "O conteúdo gerado é considerado plágio pelo Google?",
                a: "Não. O scraper captura o conteúdo textual completo da matéria original e instrui a IA a gerar um texto estruturado e inédito, com títulos magnéticos, subtítulos e atribuição legal de fonte.",
              },
              {
                q: "As matérias são publicadas automaticamente ou passam por revisão?",
                a: "Por padrão, você tem total controle editorial: as notícias chegam como rascunhos enriquecidos, você visualiza a prévia, faz ajustes se quiser e aprova em 1 clique.",
              },
              {
                q: "Posso cancelar minha assinatura quando quiser?",
                a: "Sim, sem nenhuma fidelidade ou multa rescisória. Você pode cancelar sua assinatura diretamente no painel de controle a qualquer momento.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-surface border border-border overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  <span className="font-heading font-bold text-foreground text-base">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative">
          <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#111F38] to-[#0A1224] text-white border border-primary/20 shadow-2xl relative overflow-hidden">
            <BrandDecoration variant="waves" />
            <BrandDecoration variant="glow" />

            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight relative z-10">
              Pronto para Escalar sua Produção de Conteúdo?
            </h2>
            <p className="font-sans text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-8 relative z-10">
              Junte-se a portais de notícia e afiliados que automatizaram seus blogs com qualidade profissional e segurança.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto relative z-10">
              <Link
                href="/register"
                onClick={() =>
                  trackEvent("cta_click", {
                    cta_location: "footer_cta",
                    page_path: "/",
                  })
                }
                className="w-full sm:w-auto py-4 px-8 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Criar Minha Conta Gratuita</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-xs text-slate-400 mt-4 relative z-10">
              Comece em 60 segundos • Sem necessidade de cartão de crédito
            </p>
          </div>
        </section>
      </main>

      {/* 10. Footer com Menu Organizado de Soluções, Segmentos e Recursos */}
      <PublicFooter />
    </div>
  );
}
