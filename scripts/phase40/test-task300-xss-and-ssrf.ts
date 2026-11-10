import { sanitizeHtml } from "../../src/lib/security/sanitize-html";
import { validateSafeRemoteUrl } from "../../src/lib/affiliate/ssrf";
import { parseFeedUrl } from "../../src/lib/rss";
import { scrapeArticleContent } from "../../src/lib/scraper";

async function runTests() {
  console.log("=== INICIANDO TESTES DA TASK 300: XSS & SSRF GUARD ===");

  // 1. Testes de Sanitização XSS
  console.log("\n[1] Testando sanitizeHtml...");
  
  const scriptPayload = "<p>Artigo legítimo</p><script>alert('xss')</script>";
  const cleanScript = sanitizeHtml(scriptPayload);
  if (cleanScript.includes("<script") || cleanScript.includes("alert")) {
    throw new Error(`Falha no bloqueio de <script>: ${cleanScript}`);
  }
  console.log("  ✓ Tags <script> removidas com sucesso");

  const eventPayload = '<img src="https://images.unsplash.com/photo" onerror="alert(document.cookie)" onload="evil()" />';
  const cleanEvent = sanitizeHtml(eventPayload);
  if (cleanEvent.includes("onerror") || cleanEvent.includes("onload") || cleanEvent.includes("evil")) {
    throw new Error(`Falha no bloqueio de handlers de evento: ${cleanEvent}`);
  }
  console.log("  ✓ Atributos de evento on* removidos com sucesso");

  const iframePayload = '<div>Conteúdo</div><iframe src="http://evil.com"></iframe>';
  const cleanIframe = sanitizeHtml(iframePayload);
  if (cleanIframe.includes("<iframe")) {
    throw new Error(`Falha no bloqueio de <iframe>: ${cleanIframe}`);
  }
  console.log("  ✓ Tags <iframe> removidas com sucesso");

  const jsHrefPayload = '<a href="javascript:alert(1)">Clique aqui</a>';
  const cleanJsHref = sanitizeHtml(jsHrefPayload);
  if (cleanJsHref.includes("javascript:")) {
    throw new Error(`Falha no bloqueio de href javascript:: ${cleanJsHref}`);
  }
  console.log("  ✓ Esquema javascript: removido com sucesso");

  const safePayload = '<p>Texto com <strong>negrito</strong> e <a href="https://exemplo.com">link seguro</a></p>';
  const cleanSafe = sanitizeHtml(safePayload);
  if (!cleanSafe.includes("<strong>negrito</strong>") || !cleanSafe.includes('href="https://exemplo.com"')) {
    throw new Error(`Tags válidas corrompidas: ${cleanSafe}`);
  }
  console.log("  ✓ Conteúdo HTML seguro preservado corretamente");

  // 2. Testes de Bloqueio SSRF
  console.log("\n[2] Testando validateSafeRemoteUrl (Anti-SSRF)...");

  const blockedUrls = [
    "http://127.0.0.1/admin",
    "http://localhost:3000/api",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/internal",
    "http://192.168.1.254/",
    "http://172.16.5.1/",
    "file:///etc/passwd",
    "ftp://example.com/file",
    "http://admin:secret@trusted.com/",
  ];

  for (const url of blockedUrls) {
    let blocked = false;
    try {
      await validateSafeRemoteUrl(url);
    } catch {
      blocked = true;
    }
    if (!blocked) {
      throw new Error(`URL perigosa NÃO foi bloqueada: ${url}`);
    }
    console.log(`  ✓ Bloqueou com sucesso: ${url}`);
  }

  // 3. Teste em parseFeedUrl (RSS)
  console.log("\n[3] Testando RSS SSRF Guard (parseFeedUrl)...");
  const rssResult = await parseFeedUrl("http://127.0.0.1:9999/feed.xml", "test-source");
  if (rssResult.length !== 0) {
    throw new Error("parseFeedUrl deveria retornar array vazio para URL privada.");
  }
  console.log("  ✓ parseFeedUrl rejeitou feed local/SSRF sem quebrar");

  // 4. Teste em scrapeArticleContent
  console.log("\n[4] Testando Scraper SSRF Guard (scrapeArticleContent)...");
  const scrapeResult = await scrapeArticleContent("http://169.254.169.254/metadata");
  if (scrapeResult !== null) {
    throw new Error("scrapeArticleContent deveria retornar null para URL de metadados de nuvem.");
  }
  console.log("  ✓ scrapeArticleContent rejeitou URL SSRF com segurança");

  console.log("\n=== TODOS OS TESTES DA TASK 300 PASSARAM COM SUCESSO! ===");
}

runTests().catch((err) => {
  console.error("ERRO nos testes da Task 300:", err);
  process.exit(1);
});

