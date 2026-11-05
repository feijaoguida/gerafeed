import { getActiveAIProvider } from "@/lib/ai/service";

export interface GenerateSalesCopyInput {
  name: string;
  brand?: string | null;
  sourceDescription?: string | null;
  specs?: Record<string, string> | null;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string | null;
  seller?: string | null;
  sourceRating?: number | null;
  sourceReviewCount?: number | null;
  reviewSamples?: Array<{ rating?: number | null; text: string; authorName?: string | null }>;
}

export interface GeneratedSalesCopy {
  shortDescription: string;
  description: string;
  pros: string[];
}

export class ProductSalesCopyService {
  /**
   * Generates a deterministic high-conversion sales copy when AI is not configured or fails.
   */
  static generateDeterministicSalesCopy(input: GenerateSalesCopyInput): GeneratedSalesCopy {
    const brandText = input.brand ? ` da ${input.brand}` : "";
    const shortDescription = `O ${input.name}${brandText} reúne alta qualidade, praticidade e excelente custo-benefício. Uma escolha inteligente projetada para oferecer durabilidade, eficiência e a melhor experiência no seu dia a dia.`;

    const specsItems: string[] = [];
    if (input.specs && typeof input.specs === "object") {
      const entries = Object.entries(input.specs);
      for (const [k, v] of entries) {
        if (k === "O que você precisa saber") continue;
        if (specsItems.length >= 6) break;
        specsItems.push(`<li><strong>${k}:</strong> ${v}</li>`);
      }
    }

    const highlightsText = input.specs?.["O que você precisa saber"];
    let highlightsHtml = "";
    if (highlightsText) {
      const items = highlightsText
        .split("\n")
        .map((l) => l.replace(/^[•\s*-]+/, "").trim())
        .filter((l) => l.length > 2)
        .slice(0, 5);
      if (items.length > 0) {
        highlightsHtml = `<h3>O Que Você Precisa Saber</h3><ul>${items
          .map((it) => `<li>${it}</li>`)
          .join("")}</ul>`;
      }
    }

    const specsHtml =
      specsItems.length > 0
        ? `<h3>Especificações Principais</h3><ul>${specsItems.join("")}</ul>`
        : "";

    const cleanSourceDesc = (input.sourceDescription || "").trim();
    const sourceDescHtml =
      cleanSourceDesc && cleanSourceDesc.length > 20
        ? `<p>${cleanSourceDesc.replace(/\n\n+/g, "</p><p>")}</p>`
        : `<p>Seja para uso pessoal ou profissional, o <strong>${input.name}</strong> se destaca pela construção de qualidade e desempenho confiável em todas as ocasiões.</p>`;

    const description = [
      `<p>Descubra o <strong>${input.name}</strong>${brandText}: o produto ideal para quem não abre mão de qualidade, inovação e ótimo custo-benefício.</p>`,
      sourceDescHtml,
      highlightsHtml,
      specsHtml,
      `<h3>Por Que Vale a Pena Comprar?</h3>`,
      `<p>Além de reunir os melhores recursos da categoria, este item foi pensado para facilitar a sua rotina com total conforto e máxima praticidade. Uma excelente opção para quem busca satisfação garantida.</p>`,
      `<p><strong>Aproveite e garanta o seu com as melhores condições!</strong></p>`,
    ]
      .filter(Boolean)
      .join("\n");

    const pros: string[] = [
      "Excelente custo-benefício e durabilidade",
      "Design moderno, prático e funcional",
    ];

    if (input.brand) {
      pros.push(`Qualidade e confiabilidade da marca ${input.brand}`);
    }

    if (input.sourceRating && input.sourceRating >= 4.0) {
      pros.push(
        `Alta avaliação dos compradores (${input.sourceRating.toFixed(1)}/5 estrelas)`
      );
    } else {
      pros.push("Ótima aceitação e recomendação de usuários");
    }

    return {
      shortDescription,
      description,
      pros: pros.slice(0, 5),
    };
  }

  /**
   * Generates conversion-oriented sales copy using the workspace's active AI provider.
   * Uses the AIDA framework (Attention, Interest, Desire, Action) and respects strict factual grounding.
   */
  static async generateSalesCopy(
    workspaceId: string,
    input: GenerateSalesCopyInput
  ): Promise<GeneratedSalesCopy> {
    const fallback = this.generateDeterministicSalesCopy(input);

    try {
      const aiProvider = await getActiveAIProvider(undefined, workspaceId);

      const systemPrompt = `
Você é um copywriter sênior especialista em e-commerce de alta conversão e marketing de resposta direta para produtos físicos e digitais.

Sua missão é criar uma DESCRIÇÃO COM FOCO TOTAL EM VENDAS para a página do produto (compatível com lojas WooCommerce), aplicando o consagrado framework AIDA (Atenção, Interesse, Desejo, Ação).

==================================================
DIRETRIZES DE COPYWRITING E CONVERSÃO
==================================================
1. Foco no Comprador e Benefícios Reais:
   - Transforme especificações técnicas secas em vantagens práticas e desejáveis.
   - Explique "o que o comprador ganha" usando o produto na vida real.
   - Linguagem envolvente, persuasiva, fluida e natural em Português do Brasil.

2. Descrição Curta Comercial (shortDescription / summary):
   - Deve conter entre 2 e 3 frases magnéticas de alto impacto.
   - Apresente a proposta de valor irresistível do produto e o principal benefício (exibido no topo da página ao lado do botão de compra).

3. Descrição Completa Focada em Vendas (description / content):
   - Deve ser formatada em HTML semântico (<p>, <h3>, <ul>, <li>, <strong>).
   - Não use <h1> ou <h2>.
   - Estrutura esperada:
     * Gancho de Abertura: Conecta o produto com um desejo, facilidade ou solução para o cliente;
     * Destaques e Benefícios: Subtítulo <h3> com lista de benefícios derivados das características reais;
     * Ficha de Diferenciais Técnicos: Tradução das especificações em pontos fortes;
     * Prova Social e Confiança: Menção sutil à satisfação e avaliações positivas de compradores;
     * Chamada para Ação (CTA): Fechamento incentivando a compra.

4. Pontos Positivos (pros / tags):
   - De 3 a 5 itens objetivos destacando os maiores atrativos do produto.

==================================================
REGRA DE OURO: NUNCA INVENTE ESPECIFICAÇÕES
==================================================
- Baseie-se ESTRITAMENTE nos dados reais fornecidos (marca, nome, especificações, descrição original e avaliações).
- NÃO invente medidas, voltagens, baterias, materiais, garantias estendidas ou acessórios que não constem na ficha técnica.
- Se algum detalhe técnico não foi informado, foque nas qualidades do que foi confirmado.

==================================================
FORMATO DE RESPOSTA OBRIGATÓRIO (JSON)
==================================================
Responda EXCLUSIVAMENTE com um objeto JSON válido no seguinte formato:
{
  "summary": "Texto da descrição curta de alto impacto (2 a 3 frases)...",
  "content": "<p>Texto da descrição completa persuasiva em HTML...</p><h3>Diferenciais</h3><ul><li>...</li></ul>",
  "tags": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3", "Ponto forte 4"]
}
`.trim();

      let specsText = "Nenhuma especificação informada.";
      if (input.specs && typeof input.specs === "object") {
        specsText = Object.entries(input.specs)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n");
      }

      let reviewsText = "Sem avaliações específicas de texto.";
      if (input.reviewSamples && input.reviewSamples.length > 0) {
        reviewsText = input.reviewSamples
          .slice(0, 3)
          .map(
            (r, idx) =>
              `${idx + 1}. [Nota: ${r.rating || "N/A"}] "${r.text.slice(0, 200)}"`
          )
          .join("\n");
      }

      const formattedPrice =
        input.price !== undefined && input.price !== null
          ? `${input.currency || "R$"} ${Number(input.price).toFixed(2)}`
          : "Sob consulta";

      const formattedOldPrice =
        input.oldPrice !== undefined && input.oldPrice !== null
          ? `${input.currency || "R$"} ${Number(input.oldPrice).toFixed(2)}`
          : undefined;

      const userPrompt = `
Crie a descrição com foco em vendas para o seguinte produto:

Nome do Produto: ${input.name}
Marca: ${input.brand || "Não especificada"}
Preço Atual: ${formattedPrice}${formattedOldPrice ? ` (Preço Anterior: ${formattedOldPrice})` : ""}
Vendedor / Loja: ${input.seller || "Loja Oficial"}
Avaliação dos Compradores: ${input.sourceRating ? `${input.sourceRating.toFixed(1)}/5` : "Bem avaliado"}${input.sourceReviewCount ? ` (${input.sourceReviewCount} opiniões)` : ""}

Descrição Original Extraída da Loja:
${input.sourceDescription || "Não fornecida"}

Especificações Técnicas Reais do Produto:
${specsText}

Amostras de Avaliações de Compradores:
${reviewsText}
`.trim();

      const aiResponse = await aiProvider.generateArticle({
        originalTitle: `Copy de Vendas: ${input.name}`,
        originalDescription: userPrompt,
        systemPrompt,
        categories: [],
      });

      const shortDescription =
        aiResponse.summary?.trim() || fallback.shortDescription;
      const description =
        aiResponse.content?.trim() || fallback.description;
      const pros =
        Array.isArray(aiResponse.tags) && aiResponse.tags.length > 0
          ? aiResponse.tags.map(String).slice(0, 5)
          : fallback.pros;

      return {
        shortDescription,
        description,
        pros,
      };
    } catch (err) {
      console.warn(
        "ProductSalesCopyService: Falha ao gerar cópia de vendas com IA, utilizando fallback determinístico:",
        err
      );
      return fallback;
    }
  }
}

