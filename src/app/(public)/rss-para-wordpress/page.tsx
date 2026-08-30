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

const CANONICAL_URL = `${siteConfig.url}/rss-para-wordpress`;

export const metadata: Metadata = {
  title: {
    absolute: "RSS para WordPress: Transforme Feeds em Posts com IA | GeraFeed",
  },
  description:
    "Vá além da simples agregação de feeds. O GeraFeed extrai pautas de feeds RSS, processa com IA e prepara posts ricos para aprovação e publicação no WordPress.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "RSS para WordPress: Transforme Feeds em Posts com IA | GeraFeed",
    description:
      "A evolução do feed RSS no WordPress: de simples agregador a uma usina de curadoria e matérias originais com IA.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "RSS para WordPress: Transforme Feeds em Posts com IA | GeraFeed",
    description:
      "A evolução do feed RSS no WordPress: de simples agregador a uma usina de curadoria e matérias originais com IA.",
  },
};

export default function RssParaWordpressPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Feeds RSS Inteligentes"
        title="Transforme Feeds RSS em Artigos Completos no"
        highlightText="WordPress"
        description="Descubra por que a simples importação mecânica de RSS ficou no passado. O GeraFeed utiliza os feeds como ponto de partida para extrair a matéria original, contextualizar com IA e gerar artigos de verdade para o seu portal."
        bulletPoints={[
          "Extração factual profunda a partir da URL da matéria original",
          "Diferenciação clara entre agregação bruta e curadoria qualificada",
          "Atribuição formal de fonte e créditos de imagem",
          "Fila de publicação limpa sem duplicidade de notícias",
        ]}
        ctaText="Importar Feeds com Inteligência"
        ctaHref="/register"
        ctaLocation="hero_rss_para_wordpress"
      />

      <ProblemSection
        eyebrow="Agregação vs Curadoria"
        title="Três Formas de Usar RSS no WordPress: Qual Gera Mais Resultado?"
        subtitle="Entenda as limitações dos métodos tradicionais e como a curadoria com IA protege o seu domínio."
        challenges={[
          {
            title: "Agregação Bruta (RSS Feed Aggregators)",
            description:
              "Apenas copia títulos e pequenos resumos de terceiros, gerando páginas vazias que o Google considera thin content.",
          },
          {
            title: "Importação Mecânica (Autoblog Plugins)",
            description:
              "Copia o HTML da fonte com links quebrados, scripts indesejados e risco grave de problemas de direitos autorais.",
          },
          {
            title: "Spam e Conteúdo Não-Factual",
            description:
              "Sistemas que reescrevem sem checagem de fatos distorcem declarações e comprometem a reputação do seu blog.",
          },
        ]}
        solutions={[
          {
            title: "Curadoria Editorial Qualificada",
            description:
              "O feed funciona como termômetro de pauta: o GeraFeed captura a notícia e sintetiza os acontecimentos de forma inédita.",
          },
          {
            title: "Scraping Factual e Sanitização",
            description:
              "Extração dos fatos contidos no artigo original, limpando anúncios e scripts, e gerando estrutura limpa em Gutenberg.",
          },
          {
            title: "Respeito às Fontes e Conformidade",
            description:
              "Inclusão automática de link canônico de referência e créditos do veículo que apurou a informação original.",
          },
        ]}
      />

      <WorkflowSteps
        eyebrow="Ciclo de Vida do Feed"
        title="O Que Acontece Quando Uma Notícia Entra no RSS?"
        subtitle="Nosso pipeline transforma linhas de código XML em matérias jornalísticas completas."
        steps={[
          {
            step: "01",
            badge: "Detecção",
            title: "Varredura do Feed",
            description:
              "O GeraFeed consulta seus feeds cadastrados em busca de novidades recém-publicadas pelos veículos monitorados.",
          },
          {
            step: "02",
            badge: "Leitura",
            title: "Busca da Matéria Completa",
            description:
              "Ao invés de usar apenas o snippet de 200 caracteres do feed, o robô acessa a página original para extrair o texto factual integral.",
          },
          {
            step: "03",
            badge: "Redação",
            title: "Síntese por IA",
            description:
              "O motor de IA interpreta o evento, gera novos títulos, introdução cativante, tópicos aprofundados e conclusão analítica.",
          },
          {
            step: "04",
            badge: "Publicação",
            title: "Envio ao WordPress",
            description:
              "Após sua revisão e escolha de categoria, o post é inserido diretamente no banco do WordPress com tags e atributos preenchidos.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Recursos Especializados em RSS"
        title="Tudo o que Você Precisa para Monitorar Notícias"
        subtitle="Gerencie dezenas de canais de informação com total organização e controle."
        features={[
          {
            title: "Deduplicação de Pautas",
            description:
              "Evite matérias repetidas na sua fila mesmo quando múltiplos feeds cobrem o mesmo acontecimento.",
            tag: "Inteligência",
          },
          {
            title: "Atribuição de Fonte Configurável",
            description:
              "Defina nomes de crédito personalizados por feed para manter transparência e integridade jornalística.",
            tag: "Transparência",
          },
          {
            title: "Filtros por Data e Relevância",
            description:
              "Organize suas pautas pela data editorial real do feed, garantindo cobertura ágil dos fatos mais recentes.",
            tag: "Agilidade",
          },
          {
            title: "Templates de Prompt por Origem",
            description:
              "Aplique estilos redacionais específicos dependendo da fonte ou do tema da notícia monitorada.",
            tag: "Flexibilidade",
          },
          {
            title: "Ficha Técnica e Especificações",
            description:
              "Em matérias sobre produtos ou tecnologia, extraia dados estruturados para compor análises aprofundadas.",
            tag: "Profundidade",
          },
          {
            title: "Integração Multicanal",
            description:
              "Um mesmo feed RSS pode abastecer múltiplos sites WordPress com abordagens editoriais independentes.",
            tag: "Escala",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "Qual a diferença entre o GeraFeed e um leitor de RSS comum?",
            a: "Um leitor comum serve apenas para você ler notícias. O GeraFeed é uma plataforma de produção: ele analisa o feed, extrai a matéria de referência, reescreve com IA e prepara o post pronto para ser publicado no seu WordPress.",
          },
          {
            q: "Posso cadastrar qualquer link de RSS?",
            a: "Sim. Qualquer feed público no formato RSS 2.0 ou Atom é suportado.",
          },
          {
            q: "Como o GeraFeed lida com fontes que entregam apenas resumos curtos no feed?",
            a: "Essa é uma das grandes forças do GeraFeed: nós acessamos a URL canônica da matéria e fazemos a extração factual do texto completo, permitindo que a IA gere um artigo rico e aprofundado.",
          },
          {
            q: "O post publicado dá crédito à fonte original?",
            a: "Sim. O GeraFeed insere uma nota de atribuição com o nome do veículo e o link de referência, garantindo respeito às boas práticas editoriais da web.",
          },
        ]}
      />

      <RelatedLinks
        links={[
          {
            title: "Como Funciona o GeraFeed",
            description: "Conheça o pipeline editorial completo do monitoramento à publicação.",
            href: "/como-funciona",
          },
          {
            title: "Automação Editorial para WordPress",
            description: "Saiba como conectar múltiplos portais e acelerar a produção diária.",
            href: "/automacao-wordpress",
          },
          {
            title: "GeraFeed para Portais de Notícias",
            description: "Velocidade na cobertura de notícias factuais em tempo real.",
            href: "/para-portais-de-noticias",
          },
        ]}
      />

      <SeoCta
        title="Transforme seus feeds RSS em audiência real"
        subtitle="Chega de copiar trechos soltos. Publique matérias que informam seus leitores de verdade."
        ctaText="Começar Agora Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_rss_para_wordpress"
      />
    </LandingLayout>
  );
}
