/** Shared, browser-safe occurrence contract. URLs are resolved from offers, never stored here. */
export const AFFILIATE_LAYOUTS = ["IMAGE_CARD", "TEXT_CARD", "GRID", "CAROUSEL", "BUTTON"] as const;
export type AffiliateLayout = typeof AFFILIATE_LAYOUTS[number];
export interface AffiliateProductReference { productId: string; offerId?: string | null; }
export interface AffiliateGroupData {
  id: string;
  layout: AffiliateLayout;
  products: AffiliateProductReference[];
  ctaText?: string;
}
export class AffiliateContentError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
const idPattern = /^[a-zA-Z0-9_-]{1,128}$/;
export function validReferenceId(value: unknown): value is string {
  return typeof value === "string" && idPattern.test(value);
}
export function validateAffiliateGroup(input: unknown): AffiliateGroupData {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AffiliateContentError("Bloco de produtos inválido.");
  const d = input as Record<string, unknown>;
  if (!validReferenceId(d.id)) throw new AffiliateContentError("Identificador do bloco inválido.");
  if (!AFFILIATE_LAYOUTS.includes(d.layout as AffiliateLayout)) throw new AffiliateContentError("Modelo de bloco inválido.");
  if (!Array.isArray(d.products) || !d.products.length || d.products.length > 20) throw new AffiliateContentError("Selecione de 1 a 20 produtos.");
  const ids = new Set<string>();
  const products = d.products.map((p: unknown) => {
    if (!p || typeof p !== "object") throw new AffiliateContentError("Referência de produto inválida.");
    const ref = p as Record<string, unknown>;
    if (!validReferenceId(ref.productId) || (ref.offerId != null && !validReferenceId(ref.offerId))) throw new AffiliateContentError("Referência de produto/oferta inválida.");
    if (ids.has(ref.productId)) throw new AffiliateContentError("Selecione cada produto uma vez por bloco.");
    if (Object.keys(ref).some(k => !["productId", "offerId"].includes(k))) throw new AffiliateContentError("A referência só pode conter IDs de produto e oferta.");
    ids.add(ref.productId);
    return { productId: ref.productId, offerId: ref.offerId as string | null | undefined };
  });
  if (d.ctaText !== undefined && (typeof d.ctaText !== "string" || d.ctaText.length > 100)) throw new AffiliateContentError("Texto do botão deve ter até 100 caracteres.");
  if (Object.keys(d).some(k => !["id", "layout", "products", "ctaText"].includes(k))) throw new AffiliateContentError("Campo desconhecido no bloco.");
  return { id: d.id, layout: d.layout as AffiliateLayout, products, ctaText: (d.ctaText as string | undefined)?.trim() || undefined };
}
export interface CatalogReference {
  id: string;
  offers: { id: string; status: string; affiliateUrl: string; price?: number | null }[];
}
export function resolveReference<T extends CatalogReference>(ref: AffiliateProductReference, catalog: T[]): { product: T; offer: T['offers'][number] } {
  const product = catalog.find(p => p.id === ref.productId);
  if (!product) throw new AffiliateContentError("Produto não encontrado no workspace.", 404);
  const active = product.offers.filter(o => o.status === "ACTIVE");
  const offer = ref.offerId ? active.find(o => o.id === ref.offerId) : [...active].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) || a.id.localeCompare(b.id))[0];
  if (!offer) throw new AffiliateContentError(`O produto ${product.id} está sem a oferta ativa selecionada. Corrija ou remova o bloco.`, 409);
  try {
    const url = new URL(offer.affiliateUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { throw new AffiliateContentError("Oferta com URL inválida.", 409); }
  return { product, offer };
}
