import assert from "node:assert/strict";
import { test } from "node:test";
import { splitHtmlAtCursor } from "../../src/lib/affiliate/html-position";
import {
  blockMarker,
  parseBlockOccurrences,
  duplicateBlockOccurrence,
  updateBlockOccurrence,
  removeBlockOccurrence,
  editorHtmlToDocument,
} from "../../src/lib/affiliate/editor-document";
import { CanonicalBlock, ProductGroupBlock } from "../../src/lib/affiliate/canonical-document";

test("splitHtmlAtCursor handles beginning, end, and empty content safely", () => {
  // Empty content
  const [bEmpty, aEmpty] = splitHtmlAtCursor("", 0);
  assert.equal(bEmpty, "");
  assert.equal(aEmpty, "");

  // Beginning
  const html = "<p>Conteúdo de teste</p>";
  const [bStart, aStart] = splitHtmlAtCursor(html, 0);
  assert.equal(bStart, "");
  assert.equal(aStart, "<p>Conteúdo de teste</p>");

  // End
  const [bEnd, aEnd] = splitHtmlAtCursor(html, html.length);
  assert.equal(bEnd, "<p>Conteúdo de teste</p>");
  assert.equal(aEnd, "");
});

test("splitHtmlAtCursor cleanly splits a paragraph without tag breakage", () => {
  const html = "<p>Primeira parte. Segunda parte.</p>";
  const pos = html.indexOf("Segunda");
  const [before, after] = splitHtmlAtCursor(html, pos);
  assert.equal(before, "<p>Primeira parte. </p>");
  assert.equal(after, "<p>Segunda parte.</p>");
});

test("splitHtmlAtCursor at selection start preserves full selected text", () => {
  const html = "<p>Texto selecionado para leitura.</p>";
  const selStart = html.indexOf("selecionado");
  const [before, after] = splitHtmlAtCursor(html, selStart);
  assert.equal(before, "<p>Texto </p>");
  assert.equal(after, "<p>selecionado para leitura.</p>");
  // The after portion still contains 'selecionado para leitura.', preserving the selected text!
});

test("splitHtmlAtCursor rejects invalid cursor positions inside tags, entities, markers, and lists", () => {
  // Inside opening tag
  assert.throws(() => splitHtmlAtCursor('<p class="destaque">Texto</p>', 5), /tag ou bloco/);

  // Inside closing tag
  assert.throws(() => splitHtmlAtCursor("<p>Texto</p>", 10), /tag ou bloco/);

  // Inside HTML comment
  assert.throws(() => splitHtmlAtCursor("<p>A</p><!-- comentario --><p>B</p>", 15), /tag ou bloco/);

  // Inside gerafeed block marker
  const marker = '<!-- gerafeed-block:{"type":"PRODUCT_GROUP"} -->';
  const htmlWithMarker = `<p>Antes</p>${marker}<p>Depois</p>`;
  const markerPos = htmlWithMarker.indexOf("PRODUCT_GROUP");
  assert.throws(() => splitHtmlAtCursor(htmlWithMarker, markerPos), /tag ou bloco/);

  // Inside entity
  assert.throws(() => splitHtmlAtCursor("<p>Caf&eacute; da tarde</p>", 8), /entidade HTML/);

  // Inside list
  assert.throws(() => splitHtmlAtCursor("<ul><li>Item 1</li></ul>", 10), /fora de listas e tabelas/);

  // Out of bounds
  assert.throws(() => splitHtmlAtCursor("<p>A</p>", -1), /Posição do cursor inválida/);
  assert.throws(() => splitHtmlAtCursor("<p>A</p>", 100), /Posição do cursor inválida/);
});

test("occurrence helpers: parse, update, duplicate, and remove blocks", () => {
  const block1: CanonicalBlock = {
    type: "PRODUCT_GROUP",
    data: {
      id: "group-1",
      layout: "IMAGE_CARD",
      products: [{ productId: "p1" }],
      ctaText: "Ver Oferta",
    },
  };
  const marker1 = blockMarker(block1);
  const initialHtml = `<p>Primeiro parágrafo.</p>\n\n${marker1}\n\n<p>Segundo parágrafo.</p>`;

  // 1. Parse
  const occurrences = parseBlockOccurrences(initialHtml);
  assert.equal(occurrences.length, 1);
  assert.equal(occurrences[0].rawMarker, marker1);
  assert.equal(occurrences[0].block.type, "PRODUCT_GROUP");
  assert.equal((occurrences[0].block as ProductGroupBlock).data.id, "group-1");

  // 2. Duplicate
  const duplicatedHtml = duplicateBlockOccurrence(initialHtml, marker1, "group-2");
  const occAfterDup = parseBlockOccurrences(duplicatedHtml);
  assert.equal(occAfterDup.length, 2);
  assert.equal((occAfterDup[0].block as ProductGroupBlock).data.id, "group-1");
  assert.equal((occAfterDup[1].block as ProductGroupBlock).data.id, "group-2");
  assert.equal((occAfterDup[1].block as ProductGroupBlock).data.layout, "IMAGE_CARD");

  // 3. Update
  const updatedBlock: CanonicalBlock = {
    type: "PRODUCT_GROUP",
    data: {
      id: "group-1",
      layout: "CAROUSEL",
      products: [{ productId: "p1" }, { productId: "p2" }],
      ctaText: "Aproveitar Desconto",
    },
  };
  const updatedHtml = updateBlockOccurrence(duplicatedHtml, marker1, updatedBlock);
  const occAfterUpdate = parseBlockOccurrences(updatedHtml);
  assert.equal(occAfterUpdate.length, 2);
  assert.equal((occAfterUpdate[0].block as ProductGroupBlock).data.layout, "CAROUSEL");
  assert.equal((occAfterUpdate[0].block as ProductGroupBlock).data.products.length, 2);
  assert.equal((occAfterUpdate[0].block as ProductGroupBlock).data.ctaText, "Aproveitar Desconto");

  // 4. Remove
  const removedHtml = removeBlockOccurrence(updatedHtml, occAfterUpdate[1].rawMarker);
  const occAfterRemove = parseBlockOccurrences(removedHtml);
  assert.equal(occAfterRemove.length, 1);
  assert.equal((occAfterRemove[0].block as ProductGroupBlock).data.id, "group-1");

  // 5. Canonical round-trip
  const doc = editorHtmlToDocument(removedHtml);
  assert.equal(doc.blocks.filter((b) => b.type === "PRODUCT_GROUP").length, 1);
});
