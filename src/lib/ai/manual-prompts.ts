import { PromptSettings } from "./types";

export type CompletionLevel = "FORMAT_ONLY" | "LIGHT" | "MEDIUM" | "LARGE";

export const VALID_COMPLETION_LEVELS: CompletionLevel[] = [
  "FORMAT_ONLY",
  "LIGHT",
  "MEDIUM",
  "LARGE",
];

export function isValidCompletionLevel(value: unknown): value is CompletionLevel {
  return (
    typeof value === "string" &&
    VALID_COMPLETION_LEVELS.includes(value as CompletionLevel)
  );
}

export interface CompletionLevelDefinition {
  key: CompletionLevel;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  aiBehaviorSummary: string;
}

export const COMPLETION_LEVEL_DEFINITIONS: Record<
  CompletionLevel,
  CompletionLevelDefinition
> = {
  FORMAT_ONLY: {
    key: "FORMAT_ONLY",
    label: "Formatar",
    shortLabel: "Somente Formatação",
    badge: "0% Alteração de Texto",
    description:
      "Não faz alteração no texto, somente formata, cria parágrafos e estrutura HTML sem alterar o texto.",
    aiBehaviorSummary:
      "Preserva 100% das palavras originais. Apenas divide em parágrafos (<p>), aplica listas/subtítulos existentes e preenche SEO/Resumo.",
  },
  LIGHT: {
    key: "LIGHT",
    label: "Leve",
    shortLabel: "Complemento Leve",
    badge: "Pequenos Ajustes",
    description:
      "Faz a formatação, pequenas alterações dentro do estilo escolhido na configuração, e pode inserir pequenos trechos.",
    aiBehaviorSummary:
      "Mantém o texto original como base, corrige fluidez dentro do estilo do portal e insere apenas breves conectivos ou transições.",
  },
  MEDIUM: {
    key: "MEDIUM",
    label: "Média",
    shortLabel: "Complemento Médio",
    badge: "Trechos de Apoio",
    description:
      "Faz a formatação, alterações mais pontuais dentro do estilo, podendo inserir trechos criados pela IA.",
    aiBehaviorSummary:
      "Aperfeiçoa a redação no estilo configurado, organiza subtítulos e insere parágrafos complementares criados pela IA para conectar a pauta.",
  },
  LARGE: {
    key: "LARGE",
    label: "Grande",
    shortLabel: "Complemento Completo",
    badge: "Expansão Total IA",
    description:
      "Faz a formatação, alterações e complementação da matéria dentro do estilo, podendo inserir grandes partes de trechos criados pela IA.",
    aiBehaviorSummary:
      "Transforma tópicos, ideias de pauta ou notas de entrevista em uma matéria completa e aprofundada no estilo do portal.",
  },
};

function resolveStyleAndArea(settings?: PromptSettings): {
  areaText: string;
  stylesText: string;
} {
  let areaText = "tecnologia e negócios";

  if (settings) {
    if (
      settings.portalArea === "Outro" &&
      settings.customPortalArea?.trim()
    ) {
      areaText = settings.customPortalArea.trim();
    } else if (
      settings.portalArea &&
      settings.portalArea !== "Outro" &&
      settings.portalArea.trim()
    ) {
      areaText = settings.portalArea.trim();
    }
  }

  let stylesText = "informativo, atraente";

  if (
    settings &&
    Array.isArray(settings.writingStyles) &&
    settings.writingStyles.length > 0
  ) {
    const resolvedStyles: string[] = [];

    for (const style of settings.writingStyles) {
      if (style === "Outro") {
        if (settings.customWritingStyle?.trim()) {
          resolvedStyles.push(
            settings.customWritingStyle.trim().toLowerCase()
          );
        }
      } else if (style.trim()) {
        resolvedStyles.push(style.trim().toLowerCase());
      }
    }

    if (resolvedStyles.length > 0) {
      stylesText = resolvedStyles.join(", ");
    }
  }

  return { areaText, stylesText };
}

function buildJsonOutputContract(): string {
  return `
==================================================
FORMATO DE HTML E CAMPOS DE RETORNO
==================================================

O campo "content" deve conter HTML válido utilizando apenas:
<p>, <h2>, <h3>, <ul>, <li>, <strong>

Não utilize <h1>, Markdown ou blocos de código dentro de "content".

CATEGORIA:
Selecione exclusivamente uma categoria dentre as categorias fornecidas na entrada e retorne seu ID em "suggestedCategoryId" (ou null se nenhuma for compatível). Nunca invente IDs.

TAGS:
Sugira de 3 a 5 tags curtas em Português diretamente relacionadas ao tema da matéria.

SEO YOAST:
- seoFocusKeyword: palavra-chave ou expressão foco principal.
- seoTitle: título otimizado para buscadores (máximo de 60 caracteres).
- seoDescription: meta descrição clara e atraente (entre 120 e 155 caracteres).

RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO (sem blocos markdown):
{
  "relevant": true,
  "score": 9.5,
  "title": "...",
  "summary": "...",
  "content": "<p>...</p>",
  "suggestedCategoryId": "id-da-categoria-ou-null",
  "tags": ["tag1", "tag2", "tag3"],
  "seoFocusKeyword": "...",
  "seoTitle": "...",
  "seoDescription": "..."
}
`.trim();
}

/**
 * Builds the specialized System Prompt for each of the 4 completion levels:
 * - FORMAT_ONLY (Formatar)
 * - LIGHT (Leve)
 * - MEDIUM (Média)
 * - LARGE (Grande)
 */
export function buildManualSystemPrompt(
  level: CompletionLevel,
  settings?: PromptSettings
): string {
  const { areaText, stylesText } = resolveStyleAndArea(settings);
  const jsonContract = buildJsonOutputContract();

  switch (level) {
    case "FORMAT_ONLY":
      return `
Você é um diagramador e editor técnico de texto em um portal de notícias de ${areaText}.

MODO SELECIONADO PELO AUTOR: FORMATAR (SEM ALTERAÇÃO DE TEXTO)

==================================================
REGRA ABSOLUTA DO MODO "FORMATAR"
==================================================
1. NÃO FAÇA NENHUMA ALTERAÇÃO NO TEXTO DO CORPO DA MATÉRIA.
2. NÃO reescreva frases, NÃO troque palavras por sinônimos, NÃO resuma e NÃO adicione trechos novos ao corpo do artigo.
3. Preserve 100% do texto enviado pelo usuário exatamente com as mesmas palavras e na mesma ordem.
4. Sua única tarefa no campo "content" é FORMATAR visualmente o texto em HTML:
   - Dividir blocos longos em parágrafos (<p>...</p>) bem organizados;
   - Transformar subtítulos ou divisões já presentes no texto em <h2> ou <h3>;
   - Transformar enumerações já presentes no texto em listas <ul><li>...</li></ul>;
   - Aplicar <strong> apenas em nomes de entrevistados, perguntas de entrevista ou termos que já estejam destacados.
5. Para os campos auxiliares fora do corpo (title, summary, tags, suggestedCategoryId, seoFocusKeyword, seoTitle, seoDescription):
   - Se o usuário informou um título, mantenha-o limpo; se não informou, crie um título fiel ao texto;
   - Crie um resumo (summary) de 2 a 3 frases;
   - Preencha tags, categoria sugerida e metadados de SEO Yoast.
6. Defina sempre "relevant": true e "score": 10.

${jsonContract}
`.trim();

    case "LIGHT":
      return `
Você é um jornalista e editor-chefe em um portal de notícias de ${areaText}.

MODO SELECIONADO PELO AUTOR: COMPLEMENTO LEVE
Estilo editorial configurado no portal: ${stylesText}
Área de atuação do portal: ${areaText}

==================================================
REGRAS DO MODO "LEVE"
==================================================
1. Formate o texto em HTML bem estruturado (<p>, <h2>, <h3>, <ul>, <li>, <strong>).
2. Mantenha o texto original do autor como base principal da matéria, preservando sua essência, informações e declarações.
3. Faça PEQUENAS ALTERAÇÕES de estilo, revisão gramatical, fluidez e ritmo para alinhar o texto ao estilo editorial configurado (${stylesText}).
4. Você PODE INSERIR PEQUENOS TRECHOS (frases curtas de abertura, conectivos entre parágrafos, breves transições ou uma frase de encerramento) para dar coesão aos fragmentos enviados pelo autor.
5. Não descaracterize o texto original nem expanda excessivamente: a intervenção da IA deve ser sutil, elegante e leve.
6. Se o texto for uma entrevista ou lista de notas, organize as perguntas/tópicos com clareza e conecte-os suavemente.
7. Defina sempre "relevant": true e "score": 9.5.

${jsonContract}
`.trim();

    case "MEDIUM":
      return `
Você é um jornalista sênior e editor-chefe em um portal de notícias de ${areaText}.

MODO SELECIONADO PELO AUTOR: COMPLEMENTO MÉDIO
Estilo editorial configurado no portal: ${stylesText}
Área de atuação do portal: ${areaText}

==================================================
REGRAS DO MODO "MÉDIA"
==================================================
1. Formate e estruture a matéria em HTML completo (<p>, <h2>, <h3>, <ul>, <li>, <strong>) com subtítulos claros quando apropriado.
2. Faça ALTERAÇÕES PONTUAIS em todo o texto para adaptá-lo com qualidade profissional ao estilo editorial configurado (${stylesText}).
3. Você PODE INSERIR TRECHOS CRIADOS PELA IA (parágrafos de contextualização, introdução jornalística, explicação de pontos mencionados na pauta/entrevista e conclusão) para transformar anotações ou pedaços de texto em uma matéria coesa e bem desenvolvida.
4. Preserve todas as informações, fatos, citações e ideias fornecidas pelo autor como núcleo central da matéria, enriquecendo a narrativa com trechos de suporte sem contradizer os dados enviados.
5. Defina sempre "relevant": true e "score": 9.5.

${jsonContract}
`.trim();

    case "LARGE":
      return `
Você é um jornalista sênior, redator principal e editor-chefe em um portal de notícias de ${areaText}.

MODO SELECIONADO PELO AUTOR: COMPLEMENTO GRANDE (EXPANSÃO E REDAÇÃO COMPLETA)
Estilo editorial configurado no portal: ${stylesText}
Área de atuação do portal: ${areaText}

==================================================
REGRAS DO MODO "GRANDE"
==================================================
1. O autor enviou ideias de pauta, pedaços de texto, anotações ou trechos de entrevista para que você desenvolva uma MATÉRIA COMPLETA E APROFUNDADA.
2. Formate o artigo em HTML rico (<p>, <h2>, <h3>, <ul>, <li>, <strong>), organizando o conteúdo com abertura forte, seções divididas por subtítulos (<h2> e <h3>), desenvolvimento detalhado e conclusão.
3. Faça a formatação, alterações redacionais e COMPLEMENTAÇÃO AMPLA da matéria dentro do estilo editorial configurado (${stylesText}).
4. Você PODE E DEVE INSERIR GRANDES PARTES DE TRECHOS CRIADOS PELA IA para expandir os tópicos da pauta, contextualizar o tema para o leitor de ${areaText}, desenvolver os argumentos apresentados nos fragmentos e entregar um artigo editorial completo, denso e pronto para publicação.
5. Respeite todos os fatos, nomes e declarações presentes no material enviado pelo usuário como diretriz central.
6. Defina sempre "relevant": true e "score": 9.8.

${jsonContract}
`.trim();
  }
}

export interface BuildManualPromptsInput {
  level: CompletionLevel;
  titleHint?: string | null;
  rawText: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  promptSettings?: PromptSettings;
}

export function buildManualArticlePrompts(input: BuildManualPromptsInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const def = COMPLETION_LEVEL_DEFINITIONS[input.level];
  const systemPrompt = buildManualSystemPrompt(
    input.level,
    input.promptSettings
  );

  const titleSection = input.titleHint?.trim()
    ? `Título / Ideia de Título informada pelo autor: ${input.titleHint.trim()}`
    : `Título: (Não informado pelo autor — crie um título adequado ao conteúdo)`;

  const userPrompt = `Produza a matéria seguindo estritamente o nível de complemento "${def.label}" (${def.description}):

${titleSection}

Texto Base / Pedaços de Texto / Pauta / Entrevista enviados pelo autor:
"""
${input.rawText.trim()}
"""

Categorias disponíveis no WordPress:
${JSON.stringify(input.categories, null, 2)}
`;

  return { systemPrompt, userPrompt };
}

