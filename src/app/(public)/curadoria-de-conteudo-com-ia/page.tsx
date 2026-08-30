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

const CANONICAL_URL = `${siteConfig.url}/curadoria-de-conteudo-com-ia`;

export const metadata: Metadata = {
  title: {
    absolute: "Curadoria de Conteúdo com IA para WordPress | GeraFeed",
  },
  description:
    "Utilize inteligência artificial para monitorar fontes relevantes, sintetizar pautas e produzir matérias contextuais com revisão humana antes da publicação.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "Curadoria de Conteúdo com IA para WordPress | GeraFeed",
    description:
      "A inteligência artificial como aliada da redação: curadoria criteriosa, síntese factual e revisão humana para blogs WordPress.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curadoria de Conteúdo com IA para WordPress | GeraFeed",
    description:
      "A inteligência artificial como aliada da redação: curadoria criteriosa, síntese factual e revisão humana para blogs WordPress.",
  },
};

export default function CuradoriaConteudoIaPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Inteligência Editorial Assistida"
        title="Curadoria de Conteúdo com IA: Qualidade Editorial em"
        highlightText="Escala"
        description="A inteligência artificial não deve substituir o julgamento humano, mas sim amplificá-lo. O GeraFeed combina monitoramento contínuo de fontes com modelos de linguagem avançados para sintetizar pautas complexas e entregar rascunhos de alta qualidade."
        bulletPoints={[
          "Foco na verdade factual extraída da matéria de origem",
          "Alinhamento com diretrizes de conteúdo People-First do Google",
          "Eliminação de alucinações por meio de grounding estrito",
          "Revisão e controle humano em cada etapa do processo",
        ]}
        ctaText="Experimente a Curadoria com IA"
        ctaHref="/register"
        ctaLocation="hero_curadoria_ia"
      />

      <ProblemSection
        eyebrow="A Armadilha do Conteúdo Automático"
        title="Por Que Gerar Artigos Genéricos Não Constrói Autoridade?"
        subtitle="A web está saturada de textos vazios criados por comandos simples. O GeraFeed adota um caminho oposto: precisão, contexto e rigor."
        challenges={[
          {
            title: "Alucinações e fatos inventados",
            description:
              "Pedir para a IA criar do zero sobre notícias recentes gera dados incorretos e prejudica a credibilidade do veículo.",
          },
          {
            title: "Textos repetitivos sem profundidade",
            description:
              "Conteúdos genéricos não respondem às dúvidas reais dos leitores e são ignorados pelos mecanismos de busca.",
          },
          {
            title: "Promessas ilusórias de 'anti-plágio'",
            description:
              "Trocar sinônimos não cria valor jornalístico. O que o leitor e o Google valorizam é a contextualização e clareza.",
          },
        ]}
        solutions={[
          {
            title: "Grounding Factual Baseado na Fonte",
            description:
              "A IA só escreve com base nos dados, números e declarações reais presentes na matéria original extraída.",
          },
          {
            title: "Estrutura Escaneável e Rica",
            description:
              "Artigos formatados com títulos H2/H3, destaques em negrito e listas que facilitam a leitura rápida e retêm a audiência.",
          },
          {
            title: "Revisão Humana como Etapa Central",
            description:
              "O editor dá o tom final, ajusta termos específicos da sua região ou nicho e valida a precisão antes da publicação.",
          },
        ]}
      />

      <WorkflowSteps
        eyebrow="O Papel da IA"
        title="Como a IA Atua no Processo Editorial"
        subtitle="Um assistente especializado para cada etapa do seu fluxo de produção de notícias."
        steps={[
          {
            step: "01",
            badge: "Triagem",
            title: "Detecção de Pauta",
            description:
              "A IA avalia os tópicos que estão movimentando o seu nicho através dos feeds RSS e sugere matérias prioritárias.",
          },
          {
            step: "02",
            badge: "Compreensão",
            title: "Análise Factual",
            description:
              "O texto integral é lido, identificando o fato principal, personagens envolvidos, dados estatísticos e contexto.",
          },
          {
            step: "03",
            badge: "Redação",
            title: "Reescrita Contextual",
            description:
              "Produção de um novo artigo inédito, adaptado ao estilo redacional e nicho definidos no seu Workspace.",
          },
          {
            step: "04",
            badge: "Otimização",
            title: "Metadados & SEO",
            description:
              "Geração automática de títulos magnéticos, resumos para redes sociais e sugestões de categorias do WordPress.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Capacidades de IA"
        title="Engenharia de Prompts Voltada para o Jornalismo Web"
        subtitle="Recursos desenvolvidos sob medida para manter o mais alto padrão editorial."
        features={[
          {
            title: "Estilos de Escrita Customizáveis",
            description:
              "Selecione tons informativos, analíticos, sérios ou dinâmicos de acordo com a identidade do seu portal.",
            tag: "Tom de Voz",
          },
          {
            title: "Preservação de Citações Reais",
            description:
              "Declarações de porta-vozes e autoridades são mantidas com fidelidade e devida atribuição de fala.",
            tag: "Fidelidade",
          },
          {
            title: "Formatação Gutenberg Pronta",
            description:
              "Saída limpa compatível com o editor de blocos do WordPress, com parágrafos bem espaçados e hierarquia correta.",
            tag: "Gutenberg",
          },
          {
            title: "BYOK (Traga sua Própria API Key)",
            description:
              "Liberdade total para conectar sua conta de IA preferida sem intermediários nas configurações avançadas.",
            tag: "Autonomia",
          },
          {
            title: "Governança Centralizada",
            description:
              "Supervisão de parâmetros e prompts no nível do Workspace para manter consistência em toda a equipe.",
            tag: "Governança",
          },
          {
            title: "Zero Retenção de Conteúdo",
            description:
              "Seus artigos e pautas são processados com privacidade e segurança, sem reutilização em treinamentos públicos.",
            tag: "Privacidade",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "O Google penaliza artigos gerados com auxílio de IA?",
            a: "A posição oficial do Google é clara: a automação, incluindo o uso de IA, não é contra as diretrizes de pesquisa desde que o conteúdo seja útil, de qualidade e direcionado a pessoas (People-First Content). O GeraFeed foi desenhado justamente para cumprir esses critérios.",
          },
          {
            q: "O GeraFeed reescreve matérias de forma idêntica?",
            a: "Não. O GeraFeed não faz 'spinning' de palavras. A IA compreende a essência da notícia e redige um texto inteiramente novo com base nos fatos reportados.",
          },
          {
            q: "Posso editar o texto gerado antes de publicar?",
            a: "Com certeza. Todo artigo fica disponível em um editor completo no painel do GeraFeed, permitindo que você altere parágrafos, adicione novos pontos de vista ou ajuste títulos.",
          },
          {
            q: "Quais modelos de IA o GeraFeed utiliza?",
            a: "O GeraFeed suporta os principais modelos de ponta do mercado, incluindo OpenAI, Gemini e Anthropic, com fallback inteligente para alta disponibilidade.",
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
            title: "Automação para WordPress",
            description: "Conecte seus blogs e publique artigos enriquecidos em 1 clique.",
            href: "/automacao-wordpress",
          },
          {
            title: "GeraFeed para Agências",
            description: "Como agências de marketing e conteúdo escalam entregas de clientes.",
            href: "/para-agencias",
          },
        ]}
      />

      <SeoCta
        title="Eleve a qualidade do seu conteúdo com inteligência real"
        subtitle="Economize horas de trabalho braçal e entregue matérias informativas e bem estruturadas."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_curadoria_ia"
      />
    </LandingLayout>
  );
}
