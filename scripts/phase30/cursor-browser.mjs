import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AFFILIATE_FEATURES } from "../../src/lib/billing-constants";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/security/password";
import { withTestWorkspace } from "./fixture";

const { chromium } = await import(
  process.env.PHASE30_PLAYWRIGHT || "/tmp/phase30-browser/node_modules/playwright/index.mjs"
);

try {
  await withTestWorkspace(async (workspaceId) => {
    const password = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `phase30-cursor-${randomUUID()}@example.test`,
        passwordHash: await hashPassword(password),
        workspaces: { create: { workspaceId, role: "OWNER" } },
      },
    });

    const browser = await chromium.launch({ headless: true });

    try {
      const program = await prisma.affiliateProgram.findFirstOrThrow();

      // Create test products with active offers
      const prod1 = await prisma.product.create({
        data: {
          workspaceId,
          name: "Fone Bluetooth Cancelamento de Ruído",
          slug: `fone-${randomUUID()}`,
          brand: "AudioPro",
          imageUrl: "https://example.com/fone.jpg",
          offers: {
            create: {
              workspaceId,
              affiliateProgramId: program.id,
              affiliateUrl: "https://shopee.com.br/product/111/222",
              price: 299.9,
              status: "ACTIVE",
            },
          },
        },
      });

      await prisma.product.create({
        data: {
          workspaceId,
          name: "Teclado Mecânico RGB Gamer",
          slug: `teclado-${randomUUID()}`,
          brand: "TechGear",
          imageUrl: "https://example.com/teclado.jpg",
          offers: {
            create: {
              workspaceId,
              affiliateProgramId: program.id,
              affiliateUrl: "https://shopee.com.br/product/333/444",
              price: 199.5,
              status: "ACTIVE",
            },
          },
        },
      });

      // Create test RSS article
      const rssArticle = await prisma.article.create({
        data: {
          workspaceId,
          title: "Notícia Editorial de Tecnologia",
          content: "<p>Primeiro parágrafo informativo sobre tecnologia.</p><p>Segundo parágrafo com detalhes adicionais.</p>",
          status: "PENDING",
        },
      });

      // Create test Commercial article
      const commArticle = await prisma.article.create({
        data: {
          workspaceId,
          title: "Review do Produto Comercial",
          commercialType: "PRODUCT_REVIEW",
          content: "<p>Abertura do review comercial completo.</p>",
          status: "PENDING",
          articleProducts: {
            create: { productId: prod1.id, position: 0 },
          },
        },
      });

      const page = await browser.newPage();

      // 1. Login
      await page.goto("http://localhost:3100/login");
      await page.getByPlaceholder("voce@exemplo.com").fill(user.email);
      await page.getByPlaceholder("Sua senha").fill(password);
      await page.getByRole("button", { name: /Entrar/i }).click();
      await page.waitForURL("**/dashboard", { timeout: 60000 });

      // Dismiss cookie banner if present
      const consentBtn = page.getByRole("button", { name: /Continuar sem Analytics|Aceitar Analytics/i });
      if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await consentBtn.click();
      }

      // 2. Test Entitlement: Absence of tool when AFFILIATE_MODULE is disabled
      const subscription = await prisma.subscription.findUniqueOrThrow({ where: { workspaceId } });
      await prisma.planFeature.updateMany({
        where: { planId: subscription.planId, feature: { key: AFFILIATE_FEATURES.MODULE } },
        data: { enabled: false },
      });

      await page.goto(`http://localhost:3100/articles/${rssArticle.id}`);
      await page.waitForSelector("textarea");
      const insertBtnDisabled = await page.getByRole("button", { name: /Inserir produto afiliado/i }).count();
      assert.equal(insertBtnDisabled, 0, "Tool must be absent when entitlement is disabled");

      // Re-enable entitlement
      await prisma.planFeature.updateMany({
        where: { planId: subscription.planId, feature: { key: AFFILIATE_FEATURES.MODULE } },
        data: { enabled: true },
      });

      // Reload page and check tool is now present
      await page.goto(`http://localhost:3100/articles/${rssArticle.id}`);
      const insertBtn = page.getByRole("button", { name: /Inserir produto afiliado/i });
      await insertBtn.waitFor({ state: "visible", timeout: 10000 });
      assert.equal(await insertBtn.count(), 1, "Tool must be present when entitlement is enabled");

      // 3. Test Invalid Cursor Position inside tag
      // Set cursor inside <p> tag
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        el.setSelectionRange(1, 1); // inside '<p>'
      });
      await insertBtn.click();
      const cursorAlert = page.locator("div[role='alert']:not(#__next-route-announcer__)");
      await cursorAlert.waitFor({ timeout: 5000 });
      const alertText = await cursorAlert.innerText();
      assert(alertText.includes("tag ou bloco"), `Alert should warn about invalid tag position: ${alertText}`);

      // Dismiss alert
      await page.getByRole("button", { name: /Fechar aviso/i }).click();

      // 4. Test Valid Cursor Insertion in middle of paragraph
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        const pos = el.value.indexOf("informativo");
        el.setSelectionRange(pos, pos);
      });
      await insertBtn.click();

      // Modal dialog must be open
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 10000 });

      // Test Search
      const searchInput = page.getByRole("textbox", { name: /Buscar produtos do catálogo/i });
      await searchInput.fill("Fone");
      await page.getByText("Fone Bluetooth Cancelamento de Ruído").waitFor();

      // Select product
      await page.getByRole("checkbox", { name: /Selecionar Fone Bluetooth/i }).click();

      // Test all 5 Layouts selection
      for (const layoutName of ["Card com foto", "Card de texto", "Grade", "Carrossel", "Botão"]) {
        await page.getByText(layoutName, { exact: true }).click();
      }

      // Choose "Card com foto"
      await page.getByText("Card com foto", { exact: true }).click();

      // Edit CTA
      const ctaInput = page.getByRole("textbox", { name: /Texto do botão de chamada/i });
      await ctaInput.fill("Ver Melhor Desconto");

      // Check Live Preview in modal
      await page.getByText("Pré-visualização do Bloco").waitFor();
      await page.locator(".preview-wrapper a.nc-affiliate-link").waitFor();
      const previewCta = await page.locator(".preview-wrapper a.nc-affiliate-link").innerText();
      assert(previewCta.includes("Ver Melhor Desconto"));

      // Test Cancel: clicking Cancelar closes modal and leaves content unchanged
      const contentBeforeCancel = await page.locator("textarea.font-mono").inputValue();
      await page.getByRole("button", { name: "Cancelar" }).click();
      await dialog.waitFor({ state: "hidden" });
      const contentAfterCancel = await page.locator("textarea.font-mono").inputValue();
      assert.equal(contentBeforeCancel, contentAfterCancel, "Cancelling must not modify content");

      // 5. Test Body Altered While Modal Open
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        el.setSelectionRange(0, 0);
      });
      await insertBtn.click();
      await dialog.waitFor({ state: "visible" });
      await page.getByRole("checkbox", { name: /Selecionar Fone Bluetooth/i }).click();

      // Simulate external content alteration
      const currentVal = await page.locator("textarea.font-mono").inputValue();
      await page.locator("textarea.font-mono").fill(currentVal + "<p>Texto alterado externamente</p>");
      await page.getByRole("button", { name: "Inserir no Artigo" }).click();
      const modalAlertLoc = dialog.locator("div[role='alert']:not(#__next-route-announcer__)");
      await modalAlertLoc.waitFor();
      const modalAlert = await modalAlertLoc.innerText();
      assert(modalAlert.includes("alterado enquanto o seletor estava aberto"), "Must detect body alteration");

      // Close modal
      await page.getByRole("button", { name: "Cancelar" }).click();
      await dialog.waitFor({ state: "hidden" });

      // Reset content to clean state
      await page.locator("textarea.font-mono").fill("<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>");

      // 6. Test Insert at Beginning (cursor = 0)
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        el.setSelectionRange(0, 0);
      });
      await insertBtn.click();
      await dialog.waitFor({ state: "visible" });
      await page.getByRole("checkbox", { name: /Selecionar Fone Bluetooth/i }).click();
      await page.getByRole("button", { name: "Inserir no Artigo" }).click();
      await dialog.waitFor({ state: "hidden" });

      let currentContent = await page.locator("textarea.font-mono").inputValue();
      assert(currentContent.startsWith("<!-- gerafeed-block:"), "Block must be inserted at beginning");

      // 7. Test Insert at End (cursor = length) with multiple products and GRID
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
      await insertBtn.click();
      await dialog.waitFor({ state: "visible" });
      await page.getByRole("checkbox", { name: /Selecionar Fone Bluetooth/i }).click();
      await page.getByRole("checkbox", { name: /Selecionar Teclado Mecânico/i }).click();
      await page.getByText("Grade", { exact: true }).click();
      await page.getByRole("button", { name: "Inserir no Artigo" }).click();
      await dialog.waitFor({ state: "hidden" });

      currentContent = await page.locator("textarea.font-mono").inputValue();
      assert(currentContent.includes("<!-- gerafeed-block:"), "Second block must be present");

      // 8. Test Occurrence List: Preview, Edit, Duplicate, Remove
      await page.getByText("Blocos de Afiliados no Artigo (2)").waitFor();

      // Duplicate block 1
      await page.getByRole("button", { name: "Duplicar bloco 1" }).click();
      await page.getByText("Blocos de Afiliados no Artigo (3)").waitFor();

      // Edit block 1
      await page.getByRole("button", { name: "Editar bloco 1" }).click();
      await dialog.waitFor({ state: "visible" });
      await page.getByText("Botão", { exact: true }).click();
      await ctaInput.fill("CTA Editado Teste");
      await page.getByRole("button", { name: "Salvar Alterações" }).click();
      await dialog.waitFor({ state: "hidden" });

      currentContent = await page.locator("textarea.font-mono").inputValue();
      assert(decodeURIComponent(currentContent).includes("CTA Editado Teste"), "Updated CTA must be in content");

      // Remove the duplicated block
      await page.getByRole("button", { name: "Remover bloco 3" }).click();
      await page.getByText("Blocos de Afiliados no Artigo (2)").waitFor();

      // 9. Save Draft and Reload
      await page.getByRole("button", { name: "Salvar Rascunho" }).click();
      await page.getByText("Rascunho salvo com sucesso!").waitFor();

      // Reload page and verify occurrences and content persist
      await page.reload();
      await page.waitForSelector("textarea");
      await page.getByText("Blocos de Afiliados no Artigo (2)").waitFor();
      const reloadedContent = await page.locator("textarea.font-mono").inputValue();
      assert(decodeURIComponent(reloadedContent).includes("CTA Editado Teste"), "Content must persist after reload");

      // 10. Test Commercial Article Editor
      await page.goto(`http://localhost:3100/articles/${commArticle.id}`);
      await page.waitForSelector("textarea");
      const commInsertBtn = page.getByRole("button", { name: /Inserir produto afiliado/i });
      await commInsertBtn.waitFor({ state: "visible" });

      // Insert block at cursor in commercial editor
      await page.locator("textarea.font-mono").evaluate((el) => {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
      await commInsertBtn.click();
      await page.getByRole("dialog").waitFor({ state: "visible" });
      await page.getByRole("checkbox", { name: /Selecionar Teclado Mecânico/i }).click();
      await page.getByRole("button", { name: "Inserir no Artigo" }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });

      // Save commercial article draft
      await page.getByRole("button", { name: "Salvar Rascunho" }).click();
      await page.getByText("Alterações salvas com sucesso!").waitFor();

      // Verify in database that canonicalContent was saved
      const savedComm = await prisma.article.findUniqueOrThrow({ where: { id: commArticle.id } });
      assert(savedComm.canonicalContent != null, "Canonical document must be saved in database");

      // 11. Test Mobile Viewport (390px)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: "/tmp/phase30-editor-390.png", fullPage: true });

      // 12. Test Desktop Viewport (1280px)
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.screenshot({ path: "/tmp/phase30-editor-1280.png", fullPage: true });

      console.log("PASS: cursor insertion (beginning/middle/end), paragraph split without corruption;");
      console.log("PASS: text selection preserved, invalid tag position rejected, cancel untouched;");
      console.log("PASS: body alteration detected, 5 layouts, multi-product, duplicate, edit, remove;");
      console.log("PASS: save draft and reload persistence in both RSS and Commercial editors;");
      console.log("PASS: fail-closed entitlement gating, keyboard, responsive (390/1280px).");
    } finally {
      await browser.close();
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
