import { CanonicalBlock, CanonicalDocument, CanonicalDocumentService } from "./canonical-document";

// Encoded blocks keep structured references in an HTML textarea, without affiliate URLs.
export function blockMarker(block: CanonicalBlock): string {
  return `<!-- gerafeed-block:${encodeURIComponent(JSON.stringify(block)).replace(/-/g, "%2D")} -->`;
}
export function documentToEditorHtml(doc: CanonicalDocument): string {
  return doc.blocks.map(b => b.type === "RICH_TEXT" ? b.data.html ?? b.data.markdown ?? "" : blockMarker(b)).join("");
}
export function editorHtmlToDocument(html: string, meta?: CanonicalDocument['meta']): CanonicalDocument {
  if (html.length > 2_000_000) throw new Error("Documento muito grande.");
  const blocks: CanonicalBlock[] = [];
  let end = 0;
  for (const match of html.matchAll(/<!-- gerafeed-block:([^\n]*?) -->/g)) {
    if (match.index > end) blocks.push({ type: "RICH_TEXT", data: { html: html.slice(end, match.index) } });
    try { blocks.push(JSON.parse(decodeURIComponent(match[1]))); } catch { throw new Error("Bloco incompleto. Remova-o e insira novamente."); }
    end = match.index + match[0].length;
  }
  if (end < html.length) blocks.push({ type: "RICH_TEXT", data: { html: html.slice(end) } });
  if (blocks.some(b => b.type === "RICH_TEXT" && b.data.html?.includes("gerafeed-block:"))) throw new Error("Marcador de bloco incompleto.");
  return CanonicalDocumentService.createDocument(blocks, meta);
}
export function documentProductReferences(doc: CanonicalDocument) {
  return doc.blocks.flatMap(b => b.type === "PRODUCT_GROUP" ? b.data.products : b.type === "PRODUCT_COMPARISON" ? b.data.productIds.map(productId => ({ productId })) : (b.type === "PRODUCT_CARD" || b.type === "CTA") && b.data.productId ? [{ productId: b.data.productId, offerId: b.data.offerId }] : []);
}

export interface ParsedBlockOccurrence {
  rawMarker: string;
  block: CanonicalBlock;
  startIndex: number;
  endIndex: number;
}

export function parseBlockOccurrences(html: string): ParsedBlockOccurrence[] {
  const occurrences: ParsedBlockOccurrence[] = [];
  for (const match of html.matchAll(/<!-- gerafeed-block:([^\n]*?) -->/g)) {
    try {
      const block = JSON.parse(decodeURIComponent(match[1])) as CanonicalBlock;
      occurrences.push({
        rawMarker: match[0],
        block,
        startIndex: match.index ?? 0,
        endIndex: (match.index ?? 0) + match[0].length,
      });
    } catch {
      // skip invalid marker
    }
  }
  return occurrences;
}

export function removeBlockOccurrence(html: string, rawMarker: string): string {
  const index = html.indexOf(rawMarker);
  if (index === -1) return html;
  const before = html.slice(0, index);
  const after = html.slice(index + rawMarker.length);
  return (before.replace(/\n+$/, "") + "\n\n" + after.replace(/^\n+/, "")).trim();
}

export function duplicateBlockOccurrence(html: string, rawMarker: string, newId: string): string {
  for (const match of html.matchAll(/<!-- gerafeed-block:([^\n]*?) -->/g)) {
    if (match[0] === rawMarker) {
      try {
        const block = JSON.parse(decodeURIComponent(match[1])) as CanonicalBlock;
        const dupBlock = { ...block, data: { ...block.data, id: newId } } as CanonicalBlock;
        const dupMarker = blockMarker(dupBlock);
        const idx = (match.index ?? 0) + match[0].length;
        return html.slice(0, idx) + "\n\n" + dupMarker + html.slice(idx);
      } catch {
        break;
      }
    }
  }
  return html;
}

export function updateBlockOccurrence(html: string, oldRawMarker: string, updatedBlock: CanonicalBlock): string {
  const newMarker = blockMarker(updatedBlock);
  return html.replace(oldRawMarker, newMarker);
}
