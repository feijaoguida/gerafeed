import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import {
  LandingLayout,
  SeoHero,
  WorkflowSteps,
  ProblemSection,
  FeatureGrid,
  FaqSection,
  RelatedLinks,
  SeoCta,
} from "@/components/landing";

const CANONICAL_URL = `${siteConfig.url}/automacao-wordpress`;

export const metadata: Metadata = {
  title: {
    absolute: "Automação de Conteúdo para WordPress com IA | GeraFeed",
  },
  description:
    "Escale a produção de artigos no WordPress com curadoria inteligente de RSS, assistência de IA e publicação direta via REST API, mantendo controle humano integral.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "Automação de Conteúdo para WordPress com IA | GeraFeed",
    description:
      "Escale sua produção de conteúdo no WordPress com inteligência artificial, curadoria de pautas e publicação multissite em 1 clique.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Automação de Conteúdo para WordPress com IA | GeraFeed",
    description:
      "Escale sua produção de conteúdo no WordPress com inteligência artificial, curadoria de pautas e publicação multissite em 1 clique.",
  },
};

export default function AutomacaoWordpressPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Automação WordPress com IA"
        title="Automação Editorial com IA para Sites e Blogs"
        highlightText="WordPress"
        description="Transforme a rotina de publicação do seu blog WordPress. Monitore múltiplos feeds de notícias, gere artigos enriquecidos com inteligência artificial e publique sem complexidade técnica."
        bulletPoints={[
          "Integração 100% nativa com a REST API do WordPress",
          "Publicação de rascunhos ou posts aprovados em 1 clique",
          "Suporte a múltiplos domínios e categorias sincronizadas",
          "Sem plugins lentos que sobrecarregam sua hospedagem",
        ]}
        ctaText="Automatize seu WordPress Grátis"
        ctaHref="/register"
        ctaLocation="hero_automacao_wordpress"
      />

      <ProblemSection
        eyebrow="O Gargalo do WordPress"
        title="Produzir conteúdo com frequência exige tempo que você não tem"
        subtitle="Manter um portal ativo exige redação constante, busca de pautas e formatação manual que consomem horas do seu dia."
        challenges={[
          {
            title: "Horas gastas garimpando notícias",
            description:
              "Navegar por dezenas de portais em busca de assuntos quentes reduz o tempo disponível para estratégia e monetização.",
          },
          {
            title: "Custo elevado com redatores para cobertura básica",
            description:
              "Contratar equipes para cobrir fatos factuais do dia a dia gera custos fixos difíceis de sustentar em blogs em crescimento.",
          },
          {
            title: "Plugins pesados de autoblogging que travam o banco de dados",
            description:
              "Soluções antigas baseadas em cron jobs internos lentificam o carregamento e prejudicam o Core Web Vitals.",
          },
        ]}
        solutions={[
          {
            title: "Central unificada de monitoramento",
            description:
              "Feeds RSS consolidados em uma fila visual ágil, alertando sobre novidades do seu setor instantaneamente.",
          },
          {
            title: "Redação acelerada com inteligência artificial",
            description:
              "A IA estrutura matérias completas com títulos chamativos, parágrafos fluidos e subtítulos otimizados para busca.",
          },
          {
            title: "Execução em nuvem externa sem peso no servidor",
            description:
              "Todo o processamento pesado ocorre na nuvem do GeraFeed; o WordPress apenas recebe o post finalizado pela API.",
          },
        ]}
      />

      <WorkflowSteps
        eyebrow="Como Funciona no WordPress"
        title="Da Conexão à Publicação em Poucos Minutos"
        subtitle="Configure sua integração com segurança e comece a abastecer seus sites imediatamente."
        steps={[
          {
            step: "01",
            badge: "Setup",
            title: "Conecte seu Site",
            description:
              "Adicione a URL do seu WordPress e gere uma Application Password no painel de usuários. A sincronização de categorias é imediata.",
          },
          {
            step: "02",
            badge: "Pautas",
            title: "Cadastre Feeds RSS",
            description:
              "Insira as URLs dos feeds que você deseja acompanhar e vincule-os aos seus portais e nichos correspondentes.",
          },
          {
            step: "03",
            badge: "Inteligência",
            title: "Processe com 1 Clique",
            description:
              "Selecione uma matéria relevante na fila e clique em processar. O GeraFeed sintetiza o conteúdo respeitando a verdade dos fatos.",
          },
          {
            step: "04",
            badge: "No Ar",
            title: "Aprove e Publique",
            description:
              "Revise os dados, selecione a categoria desejada e envie o post direto para o WordPress, pronto para atrair leitores.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Recursos para WordPress"
        title="Controle Editorial Absoluto na Palma da Sua Mão"
        subtitle="Projetado para atender desde blogs independentes até redes com dezenas de domínios."
        features={[
          {
            title: "Sincronização de Categorias",
            description:
              "O GeraFeed importa a taxonomia de categorias do seu WordPress para que cada matéria caia na seção correta.",
            tag: "Taxonomia",
          },
          {
            title: "Tratamento de Imagem de Destaque",
            description:
              "Mídia otimizada e formatada com links de atribuição formal para enriquecer a experiência do leitor.",
            tag: "Mídia",
          },
          {
            title: "Publicação Multissite Centralizada",
            description:
              "Alterne entre diferentes portais de clientes ou marcas em uma interface limpa e intuitiva.",
            tag: "Multissite",
          },
          {
            title: "Campos SEO Integrados",
            description:
              "Geração automática de palavras-chave de foco, título SEO e meta descrição otimizados para mecanismos de busca.",
            tag: "SEO",
          },
          {
            title: "Segurança com Criptografia AES-256",
            description:
              "Suas credenciais de aplicação são criptografadas em repouso com as melhores práticas de cibersegurança.",
            tag: "Segurança",
          },
          {
            title: "Controle de Frequência de Postagem",
            description:
              "Mantenha seu portal sempre atualizado com fluxo contínuo de conteúdo sem picos ou períodos de silêncio.",
            tag: "Consistência",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "Funciona em qualquer hospedagem WordPress?",
            a: "Sim. Desde hospedagens compartilhadas comuns até servidores dedicados ou VPS, desde que a REST API nativa do WordPress esteja acessível.",
          },
          {
            q: "O GeraFeed substitui o redator humano?",
            a: "O GeraFeed atua como um assistente de alta performance para o redator ou editor, eliminando o trabalho braçal de busca de pauta e estruturação inicial.",
          },
          {
            q: "Meus dados de acesso ao WordPress ficam seguros?",
            a: "Sim. Utilizamos exclusivamente Application Passwords com privilégios limitados a postagens, e todas as senhas são criptografadas no banco de dados com AES-256-GCM.",
          },
          {
            q: "Como o Google avalia artigos produzidos com auxílio de IA?",
            a: "As diretrizes do Google focam em qualidade, utilidade e veracidade (EEAT), independentemente de como o conteúdo foi produzido. A revisão humana garante essa conformidade.",
          },
        ]}
      />

      <RelatedLinks
        links={[
          {
            title: "Como Funciona o GeraFeed",
            description: "Entenda o pipeline editorial completo do monitoramento à publicação.",
            href: "/como-funciona",
          },
          {
            title: "RSS para WordPress",
            description: "Como transformar feeds RSS em matérias aprofundadas com imagens e créditos.",
            href: "/rss-para-wordpress",
          },
          {
            title: "Soluções para Agências",
            description: "Descubra como agências gerenciam portais de vários clientes com agilidade.",
            href: "/para-agencias",
          },
        ]}
      />

      <SeoCta
        title="Pronto para elevar a produtividade do seu WordPress?"
        subtitle="Comece hoje a publicar matérias com qualidade profissional em escala."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_automacao_wordpress"
      />
    </LandingLayout>
  );
}
