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

const CANONICAL_URL = `${siteConfig.url}/para-portais-de-noticias`;

export const metadata: Metadata = {
  title: {
    absolute: "GeraFeed para Portais de Notícias: Agilidade e Cobertura Contínua",
  },
  description:
    "Monitore dezenas de fontes de notícias em tempo real, transforme comunicados e releases em rascunhos estruturados e publique com rapidez e rigor editorial.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "GeraFeed para Portais de Notícias: Agilidade e Cobertura Contínua",
    description:
      "Acelerador de redação para portais e jornais digitais: cobertura em tempo real com curadoria factual e controle editorial.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "GeraFeed para Portais de Notícias: Agilidade e Cobertura Contínua",
    description:
      "Acelerador de redação para portais e jornais digitais: cobertura em tempo real com curadoria factual e controle editorial.",
  },
};

export default function ParaPortaisDeNoticiasPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Solução para Mídia Digital & Portais"
        title="Agilidade na Cobertura de Pautas para Portais de"
        highlightText="Notícias"
        description="No jornalismo digital, a velocidade na apuração e publicação de acontecimentos determina quem atrai a audiência do Google Notícias e Discover. O GeraFeed organiza sua esteira de notícias, monitora comunicados e prepara matérias estruturadas em minutos."
        bulletPoints={[
          "Radar de pautas em tempo real a partir de agências e órgãos oficiais",
          "Transformação rápida de comunicados em artigos bem estruturados",
          "Fila editorial colaborativa com aprovação expressa do editor",
          "Publicação instantânea no WordPress sem perda de tempo com formatação",
        ]}
        ctaText="Acelere a Redação do seu Portal"
        ctaHref="/register"
        ctaLocation="hero_para_portais"
      />

      <ProblemSection
        eyebrow="O Desafio do Tempo Real"
        title="A Batalha Diária por Velocidade e Precisão Factual"
        subtitle="Portais regionais e especializados competem contra grandes redações com recursos humanos limitados."
        challenges={[
          {
            title: "Atraso na publicação de notícias urgentes",
            description:
              "Quando a notícia quente chega, o tempo gasto em redação manual e formatação no WordPress faz o concorrente rankear primeiro.",
          },
          {
            title: "Sobrecarga da equipe com comunicados e releases",
            description:
              "Repórteres talentosos perdem horas reescrevendo notas oficiais de prefeituras, tribunais e empresas em vez de fazer apurações próprias.",
          },
          {
            title: "Erros causados pela pressa de postar",
            description:
              "Publicar na correria leva a erros de digitação, categorias trocadas e metadados SEO esquecidos.",
          },
        ]}
        solutions={[
          {
            title: "Primeiro rascunho em segundos",
            description:
              "A IA estrutura a matéria factual completa a partir da fonte oficial em menos de 10 segundos, pronta para o repórter refinar.",
          },
          {
            title: "Liberação de repórteres para pautas exclusivas",
            description:
              "A esteira automática cobre a factualidade do dia, permitindo que a equipe produza reportagens autorais de maior impacto.",
          },
          {
            title: "Padronização profissional rigorosa",
            description:
              "Todos os posts já chegam formatados com títulos dinâmicos, subtítulos H2/H3, tags e imagens devidamente creditadas.",
          },
        ]}
      />

      <WorkflowSteps
        eyebrow="A Rotina da Redação"
        title="Fluxo Ágil para Jornalistas e Editores"
        subtitle="Como uma redação moderna opera com o GeraFeed do plantão à edição final."
        steps={[
          {
            step: "01",
            badge: "Radar",
            title: "Monitoramento Contínuo",
            description:
              "Feeds de tribunais, assessorias, agências de notícias e canais oficiais chegam ordenados por data na sua central de notícias.",
          },
          {
            step: "02",
            badge: "Seleção",
            title: "Escolha da Pauta",
            description:
              "O editor de plantão visualiza o resumo da notícia e decide se a pauta merece cobertura imediata no portal.",
          },
          {
            step: "03",
            badge: "Geração",
            title: "Estruturação por IA",
            description:
              "O GeraFeed processa o texto integral da nota e entrega uma matéria rica, com linguagem jornalística correta e informativa.",
          },
          {
            step: "04",
            badge: "Ao Vivo",
            title: "Edição e Publicação",
            description:
              "O jornalista acrescenta informações locais, faz os ajustes finais e clica em Aprovar. A notícia entra no ar no mesmo instante.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Recursos para Publishers"
        title="Tecnologia Feita para o Ritmo do Jornalismo"
        subtitle="Ferramentas que fortalecem a credibilidade e o alcance orgânico do seu veículo."
        features={[
          {
            title: "Filtros por Editoria e Cidade",
            description:
              "Organize suas fontes por categorias editoriais (Cidades, Economia, Esporte, Polícia) para agilizar a distribuição na equipe.",
            tag: "Editorias",
          },
          {
            title: "Atribuição Legal Clara",
            description:
              "Garantia de que todo conteúdo de referência seja creditado com elegância e transparência jornalística.",
            tag: "Ética & Crédito",
          },
          {
            title: "Alta Velocidade de Ingestão",
            description:
              "Processamento em nuvem ultra veloz que responde instantaneamente mesmo durante grandes coberturas factuais.",
            tag: "Desempenho",
          },
          {
            title: "Campos Prontos para Google Discover",
            description:
              "Geração de títulos impactantes que aumentam a taxa de clique sem recorrer a clickbaits enganosos.",
            tag: "Audiência",
          },
          {
            title: "Multidestino para Redes de Portais",
            description:
              "Publique a mesma matéria em diferentes portais do seu grupo de mídia com adaptação de tom em cada um.",
            tag: "Multissite",
          },
          {
            title: "Histórico Completo de Publicações",
            description:
              "Rastreabilidade de quais fontes originaram cada matéria e quando foram aprovadas pela equipe editorial.",
            tag: "Auditoria",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "O GeraFeed copia notícias de outros veículos?",
            a: "Não incentivamos nem facilitamos a cópia de notícias. O GeraFeed foi feito para monitorar pautas públicas (como comunicados de imprensa, diários oficiais e agências) e redigir matérias originais baseadas na apuração desses fatos.",
          },
          {
            q: "Como o portal se protege de erros e fake news?",
            a: "A plataforma exige que um editor ou redator aprove cada artigo antes de ele ser publicado no WordPress. Além disso, a IA é rigidamente instruída a ater-se aos fatos descritos na matéria de origem.",
          },
          {
            q: "É possível enviar o artigo como rascunho para revisão no próprio WordPress?",
            a: "Sim. Você pode configurar o status padrão de envio ou aprovar diretamente pelo editor do GeraFeed, conforme a preferência da sua redação.",
          },
          {
            q: "O GeraFeed suporta feeds de agências de notícias pagas?",
            a: "Desde que a agência forneça uma URL de feed RSS compatível com autenticação padrão ou token na URL, o GeraFeed consegue monitorar e processar normalmente.",
          },
        ]}
      />

      <RelatedLinks
        links={[
          {
            title: "Como Funciona o GeraFeed",
            description: "Fluxo passo a passo da ingestão de pautas até o WordPress.",
            href: "/como-funciona",
          },
          {
            title: "Curadoria de Conteúdo com IA",
            description: "Diretrizes de qualidade e alinhamento com os padrões do Google.",
            href: "/curadoria-de-conteudo-com-ia",
          },
          {
            title: "RSS para WordPress",
            description: "Técnicas para transformar feeds em matérias completas e atrativas.",
            href: "/rss-para-wordpress",
          },
        ]}
      />

      <SeoCta
        title="Ganhe velocidade na redação do seu portal de notícias"
        subtitle="Esteja na frente dos fatos com monitoramento contínuo e publicação em tempo real."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_para_portais"
      />
    </LandingLayout>
  );
}
