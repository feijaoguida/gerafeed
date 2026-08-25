import { parseAIJsonResponse } from "@/lib/ai";

function testParser() {
  console.log("=== TEST: AI JSON Parser & Sanitizer ===");

  // Case 1: Standard markdown code block ```json ... ```
  const sample1 = `\`\`\`json
{
  "relevant": true,
  "score": 9.5,
  "title": "Review do Produto X",
  "summary": "Resumo completo.",
  "content": "<p>Conteúdo</p>"
}
\`\`\``;

  const res1 = parseAIJsonResponse<{ relevant: boolean; score: number }>(sample1);
  if (!res1.relevant || res1.score !== 9.5) {
    throw new Error("FAIL Case 1: Markdown ```json falhou!");
  }
  console.log("✓ Case 1 PASS: Markdown ```json ... ```");

  // Case 2: Markdown block without lang tag: ``` { ... } ```
  const sample2 = `\`\`\`
{
  "relevant": true,
  "score": 8.0,
  "title": "Comparativo Y vs Z"
}
\`\`\``;

  const res2 = parseAIJsonResponse<{ relevant: boolean; score: number }>(sample2);
  if (!res2.relevant || res2.score !== 8.0) {
    throw new Error("FAIL Case 2: Markdown ``` { ... } falhou!");
  }
  console.log("✓ Case 2 PASS: Markdown ``` { ... } ```");

  // Case 3: Space after opening backticks (as in the user screenshot: ``` { "r"... )
  const sample3 = `\`\`\` { "relevant": true, "score": 9.0, "title": "Guia de Compra" } \`\`\``;
  const res3 = parseAIJsonResponse<{ relevant: boolean; score: number }>(sample3);
  if (!res3.relevant || res3.score !== 9.0) {
    throw new Error("FAIL Case 3: ``` { ... } inline falhou!");
  }
  console.log("✓ Case 3 PASS: ``` { ... } inline");

  // Case 4: Text preamble and postamble around JSON
  const sample4 = `Aqui está o resultado da análise estruturada:
{
  "relevant": true,
  "score": 7.5,
  "title": "Melhores Caixas de Som"
}
Espero que isso ajude!`;

  const res4 = parseAIJsonResponse<{ relevant: boolean; score: number }>(sample4);
  if (!res4.relevant || res4.score !== 7.5) {
    throw new Error("FAIL Case 4: Texto ao redor do JSON falhou!");
  }
  console.log("✓ Case 4 PASS: Texto antes e depois do JSON");

  // Case 5: Plain valid JSON
  const sample5 = `{"relevant": true, "score": 10.0, "title": "Perfeito"}`;
  const res5 = parseAIJsonResponse<{ relevant: boolean; score: number }>(sample5);
  if (!res5.relevant || res5.score !== 10.0) {
    throw new Error("FAIL Case 5: JSON puro falhou!");
  }
  console.log("✓ Case 5 PASS: JSON puro");

  // Case 6: Invalid JSON error handling
  try {
    parseAIJsonResponse("Isso não é um json { quebrado : ");
    throw new Error("FAIL Case 6: Deveria ter lançado erro descritivo!");
  } catch (err) {
    if ((err as Error).message.includes("Falha ao converter resposta da IA em JSON válido")) {
      console.log("✓ Case 6 PASS: Tratamento de erro claro e amigável.");
    } else {
      throw err;
    }
  }

  console.log("\n=======================================================");
  console.log("TODOS OS TESTES DO PARSER DE JSON DA IA PASSARAM!");
  console.log("=======================================================");
}

testParser();
