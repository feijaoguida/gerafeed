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

const CANONICAL_URL = `${siteConfig.url}/para-agencias`;

export const metadata: Metadata = {
  title: {
    absolute: "GeraFeed para Agências: Gestão e Publicação Multissite com IA",
  },
  description:
    "Gerencie portais de clientes, centralize fontes RSS e acelere a entrega de artigos de qualidade com curadoria de IA e governança operacional.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "GeraFeed para Agências: Gestão e Publicação Multissite com IA",
    description:
      "Aumente as margens da sua agência: atenda mais clientes de SEO e marketing de conteúdo com produção editorial ágil e centralizada.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "GeraFeed para Agências: Gestão e Publicação Multissite com IA",
    description:
      "Aumente as margens da sua agência: atenda mais clientes de SEO e marketing de conteúdo com produção editorial ágil e centralizada.",
  },
};

export default function ParaAgenciasPage() {
  return (
    <LandingLayout>
      <SeoHero
        badge="Solução B2B para Agências"
        title="Escale a Operação Editorial de Múltiplos Clientes"
        highlightText="WordPress"
        description="Elimine o gargalo na entrega de posts de blog e notícias para seus clientes de SEO. Centralize dezenas de sites WordPress, monitore fontes setoriais e aumente a produtividade da sua equipe com assistência de IA."
        bulletPoints={[
          "Gestão multissite em um único painel operacional",
          "Padronização de tom de voz por cliente ou nicho",
          "Aumento expressivo na margem operacional de pacotes de conteúdo",
          "Publicação direta no WordPress de cada cliente com segurança",
        ]}
        ctaText="Começar Teste para Agências"
        ctaHref="/register"
        ctaLocation="hero_para_agencias"
      />

      <ProblemSection
        eyebrow="O Dilema da Agência"
        title="Contratar Mais Redatores Nem Sempre Significa Maior Margem"
        subtitle="Agências enfrentam prazos apertados, rotatividade de freelancers e clientes cobrando volume e consistência de postagens."
        challenges={[
          {
            title: "Custo elevado por artigo produzido",
            description:
              "Pagar valores cheios por cada matéria factual básica consome quase toda a margem dos contratos mensais de marketing.",
          },
          {
            title: "Dificuldade de manter múltiplos blogs ativos",
            description:
              "Clientes que contratam 4 a 8 posts mensais frequentemente ficam sem atualizações por falta de braço na equipe.",
          },
          {
            title: "Desorganização no acesso aos WordPress dos clientes",
            description:
              "Dezenas de logins e senhas espalhados geram atrito e riscos de segurança na operação da agência.",
          },
        ]}
        solutions={[
          {
            title: "Multiplicação da capacidade da equipe",
            description:
              "Um único analista ou redator consegue gerenciar a curadoria e revisão de dezenas de artigos por dia no GeraFeed.",
          },
          {
            title: "Fluxo previsível de entregas regulares",
            description:
              "Feeds setoriais alimentam a fila continuamente, permitindo aprovar e agendar lotes de conteúdo em minutos.",
          },
          {
            title: "Conexão segura via REST API padronizada",
            description:
              "Sites conectados por Application Passwords individuais, sem necessidade de compartilhar senhas mestras de administradores.",
          },
        ]}
      />

      <WorkflowSteps
        eyebrow="Operação na Agência"
        title="Como Estruturar o Fluxo de Clientes no GeraFeed"
        subtitle="Uma rotina clara para integrar novas contas e manter o ritmo editorial."
        steps={[
          {
            step: "01",
            badge: "Onboarding",
            title: "Conecte os Portais",
            description:
              "Cadastre os sites WordPress dos seus clientes e sincronize as categorias editoriais de cada um no painel.",
          },
          {
            step: "02",
            badge: "Segmentação",
            title: "Mapeie Fontes por Cliente",
            description:
              "Associe feeds RSS especializados (tecnologia, finanças, saúde, etc.) diretamente aos destinos correspondentes.",
          },
          {
            step: "03",
            badge: "Produção",
            title: "Curadoria e Revisão",
            description:
              "Sua equipe revisa os rascunhos propostos pela IA, adaptando nuances de marca e inserindo links estratégicos do cliente.",
          },
          {
            step: "04",
            badge: "Entrega",
            title: "Publicação com 1 Clique",
            description:
              "Envie o post finalizado diretamente para o WordPress do cliente, mantendo o histórico organizado para relatórios.",
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Recursos para Negócios"
        title="Governança e Escala Operacional"
        subtitle="Construído para dar tranquilidade ao gestor de conteúdo e agilidade ao analista."
        features={[
          {
            title: "Sites WordPress Ilimitados",
            description:
              "No plano Scale, gerencie quantos domínios de clientes forem necessários sem custos adicionais por site.",
            tag: "Escala",
          },
          {
            title: "Prompt Customizado por Cliente",
            description:
              "Configure diretrizes de escrita específicas para cada cliente, respeitando manual de redação e persona.",
            tag: "Personalização",
          },
          {
            title: "Fila Separada por Destino",
            description:
              "Filtre matérias pelo site do cliente em foco e trabalhe em blocos focados de produção com máxima eficiência.",
            tag: "Organização",
          },
          {
            title: "Monetização e Links Internos",
            description:
              "Insira chamadas para ação comerciais ou ofertas de produtos dos seus clientes de e-commerce e afiliados.",
            tag: "Conversão",
          },
          {
            title: "Segurança Empresarial",
            description:
              "Proteção de dados dos clientes com criptografia de ponta a ponta e isolamento estrito de workspaces.",
            tag: "Conformidade",
          },
          {
            title: "Suporte Dedicado",
            description:
              "Atendimento prioritário para garantir que a rotina de publicações dos seus clientes nunca seja interrompida.",
            tag: "Suporte",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "Posso usar a mesma conta para clientes de nichos totalmente diferentes?",
            a: "Sim. Você pode cadastrar sites de tecnologia, saúde, direito e moda na mesma conta, vinculando a cada um deles feeds e prompts redacionais específicos.",
          },
          {
            q: "A agência precisa fornecer acesso de administrador do WordPress?",
            a: "Não. A conexão utiliza Application Passwords com usuário de perfil 'Editor', com permissão restrita para criar e publicar posts.",
          },
          {
            q: "Como fica o SEO dos artigos entregues aos clientes?",
            a: "Os artigos são gerados com estrutura HTML semântica, cabeçalhos hierarquizados e campos de meta título e descrição prontos para plugins como Yoast SEO e Rank Math.",
          },
          {
            q: "Existe plano sob medida para grandes agências?",
            a: "Nosso plano Scale atende até 1.000 artigos mensais e sites ilimitados. Caso sua agência necessite de um volume superior, entre em contato para condições personalizadas.",
          },
        ]}
      />

      <RelatedLinks
        links={[
          {
            title: "Como Funciona o GeraFeed",
            description: "Pipeline completo da captura de feeds até a publicação final.",
            href: "/como-funciona",
          },
          {
            title: "Automação para WordPress",
            description: "Como conectar sites e categorias via REST API nativa.",
            href: "/automacao-wordpress",
          },
          {
            title: "GeraFeed para Portais de Notícias",
            description: "Veja como veículos com alto fluxo de notícias ganham velocidade.",
            href: "/para-portais-de-noticias",
          },
        ]}
      />

      <SeoCta
        title="Aumente a capacidade de entrega da sua agência"
        subtitle="Atenda mais clientes, publique com frequência e aumente suas margens de lucro."
        ctaText="Criar Conta da Agência"
        ctaHref="/register"
        ctaLocation="footer_para_agencias"
      />
    </LandingLayout>
  );
}
