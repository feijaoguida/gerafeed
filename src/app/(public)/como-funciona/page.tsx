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

const CANONICAL_URL = `${siteConfig.url}/como-funciona`;

export const metadata: Metadata = {
  title: {
    absolute: "Como funciona o GeraFeed | Curadoria e Publicação no WordPress",
  },
  description:
    "Conheça o fluxo completo do GeraFeed: monitoramento de feeds RSS, seleção factual de notícias, reescrita assistida por IA, revisão humana e publicação multissite.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "Como funciona o GeraFeed | Curadoria e Publicação no WordPress",
    description:
      "Da fonte RSS à publicação no WordPress em um fluxo editorial controlado, com assistência de IA e aprovação humana.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Como funciona o GeraFeed | Curadoria e Publicação no WordPress",
    description:
      "Da fonte RSS à publicação no WordPress em um fluxo editorial controlado, com assistência de IA e aprovação humana.",
  },
};

export default function ComoFuncionaPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Fluxo Editorial Integrado"
        title="Da fonte RSS à publicação no WordPress em um"
        highlightText="fluxo editorial controlado"
        description="O GeraFeed conecta monitoramento automatizado de fontes, inteligência artificial e publicação direta no WordPress — garantindo que nenhuma matéria vá ao ar sem sua revisão e aprovação."
        bulletPoints={[
          "Monitoramento de fontes RSS ilimitadas",
          "Extração de conteúdo completo da matéria original",
          "Revisão humana obrigatória antes de publicar",
          "Publicação instantânea via WordPress REST API",
        ]}
        ctaText="Experimente o Fluxo Editorial Grátis"
        ctaHref="/register"
        ctaLocation="hero_como_funciona"
      />

      <WorkflowSteps
        eyebrow="Arquitetura do Fluxo"
        title="4 Etapas Claras da Pauta à Publicação"
        subtitle="Cada notícia percorre um pipeline estruturado para garantir qualidade, originalidade e pertinência temática."
        steps={[
          {
            step: "01",
            badge: "Ingestão",
            title: "Monitoramento de Fontes",
            description:
              "Cadastre feeds RSS de portais, agências de notícias e blogs de referência. O sistema detecta novas pautas continuamente.",
          },
          {
            step: "02",
            badge: "Extração",
            title: "Scraping Factual & Mídia",
            description:
              "O conteúdo completo da matéria original e a imagem de destaque são extraídos com atribuição formal de crédito da fonte.",
          },
          {
            step: "03",
            badge: "Assistência",
            title: "Reescrita & Contextualização",
            description:
              "A inteligência artificial reescreve a notícia com base nos fatos reais, gerando títulos atrativos, subtítulos H2/H3 e metadados SEO.",
          },
          {
            step: "04",
            badge: "Distribuição",
            title: "Revisão e Envio ao WordPress",
            description:
              "Você revisa o texto no editor visual, ajusta categorias e aprova. O GeraFeed publica como post no WordPress em 1 clique.",
          },
        ]}
      />

      <ProblemSection
        eyebrow="Controle vs Caos"
        title="Por que o autoblogging tradicional falha e o GeraFeed prospera"
        subtitle="Entenda a diferença fundamental entre importação cega de feeds e curadoria editorial profissional."
        challenges={[
          {
            title: "Importação direta sem contexto",
            description:
              "Plugins antigos copiam trechos quebrados que poluem seu site com conteúdo duplicado e punições de indexação.",
          },
          {
            title: "Ausência de revisão humana",
            description:
              "Notícias irrelevantes ou de concorrentes são publicadas automaticamente sem filtro de adequação ao seu nicho.",
          },
          {
            title: "Imagens sem atribuição ou tratamento",
            description:
              "Uso incorreto de imagens e links quebrados expõem seu portal a problemas de direitos autorais.",
          },
        ]}
        solutions={[
          {
            title: "Curadoria assistida por IA factual",
            description:
              "A IA usa o texto integral da fonte para produzir matérias profundas, originais e contextualizadas para o seu público.",
          },
          {
            title: "Fila de aprovação explícita",
            description:
              "Você decide o que publicar, altera o tom, ajusta palavras-chave e aprova cada post com segurança.",
          },
          {
            title: "Créditos automáticos e mídia segura",
            description:
              "Atribuição clara do veículo original e processamento otimizado de imagens no padrão do seu tema.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Tecnologia & Recursos"
        title="Construído para Produtores de Conteúdo Exigentes"
        subtitle="Ferramentas completas para transformar notícias em autoridade e audiência orgânica."
        features={[
          {
            title: "Múltiplos Sites WordPress",
            description:
              "Conecte vários domínios WordPress em um único painel e direcione cada pauta para o portal mais adequado.",
            tag: "Multissite",
          },
          {
            title: "Prompt por Destino e Nicho",
            description:
              "Defina estilo de escrita, tom de voz e diretrizes editoriais específicas para cada site ou categoria.",
            tag: "Personalização",
          },
          {
            title: "REST API Nativa",
            description:
              "Sem necessidade de instalar plugins pesados no seu WordPress. Integração limpa via Application Passwords.",
            tag: "Segurança",
          },
          {
            title: "Monetização com Afiliados",
            description:
              "Insira ofertas e produtos relacionados do seu catálogo nos artigos gerados para monetizar seu tráfego.",
            tag: "Monetização",
          },
          {
            title: "Filtros Avançados de Fila",
            description:
              "Filtre matérias pendentes por data, fonte RSS ou site WordPress de destino com facilidade operacional.",
            tag: "Produtividade",
          },
          {
            title: "Suporte aos Principais LLMs",
            description:
              "Compatibilidade nativa com provedores de ponta do mercado para garantir alta precisão redacional.",
            tag: "IA Avançada",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "O GeraFeed publica sozinho sem minha autorização?",
            a: "Não. O GeraFeed segue a filosofia human-in-the-loop: as matérias chegam como pendentes em sua fila de publicação e só são enviadas ao WordPress após sua aprovação expressa.",
          },
          {
            q: "Preciso instalar algum plugin no meu WordPress?",
            a: "Não é necessário nenhum plugin proprietário. O GeraFeed se comunica diretamente com a REST API padrão do WordPress utilizando Application Passwords seguras.",
          },
          {
            q: "Posso conectar mais de um blog ou portal?",
            a: "Sim. A depender do plano escolhido, você pode gerenciar de 5 portais até múltiplos sites ilimitados na mesma conta.",
          },
          {
            q: "Como a IA garante que a notícia é factual?",
            a: "Diferente de geradores genéricos que inventam dados, o GeraFeed extrai o texto integral da matéria original de referência e instrui o modelo a basear os fatos estritamente naquele conteúdo verificado.",
          },
        ]}
      />

      <RelatedLinks
        links={[
          {
            title: "Automação de Conteúdo para WordPress",
            description:
              "Saiba como escalar sua produção diária de artigos com automação e assistência de IA.",
            href: "/automacao-wordpress",
          },
          {
            title: "Guia: RSS para WordPress",
            description:
              "Aprenda a transformar feeds RSS em matérias completas em vez de simples resumos.",
            href: "/rss-para-wordpress",
          },
          {
            title: "Curadoria de Conteúdo com IA",
            description:
              "Conheça as melhores práticas para manter qualidade e aderência às diretrizes do Google.",
            href: "/curadoria-de-conteudo-com-ia",
          },
        ]}
      />

      <SeoCta
        title="Pronto para transformar sua rotina editorial?"
        subtitle="Automatize a captura e redação de notícias mantendo o controle criativo total do seu portal."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_como_funciona"
      />
    </LandingLayout>
  );
}
