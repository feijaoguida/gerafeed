/**
 * Configuração central do site para SEO, identidade de marca e URLs canônicas.
 */
export const siteConfig = {
  name: "GeraFeed",
  tagline: "Conteúdo que flui. Inteligência que publica.",
  url: "https://www.gerafeed.com.br",
  defaultTitle: "GeraFeed - Conteúdo que flui. Inteligência que publica.",
  defaultDescription:
    "Curadoria inteligente de notícias RSS, reescrita assistida por IA e publicação automática no WordPress.",
  locale: "pt_BR",
  home: {
    title: "GeraFeed | Automação de Conteúdo com IA para WordPress",
    description:
      "Monitore feeds RSS, transforme pautas em artigos, revise com IA e publique em múltiplos sites WordPress. Automatize sua operação editorial com o GeraFeed.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
