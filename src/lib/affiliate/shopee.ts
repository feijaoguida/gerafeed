import type { AffiliateProvider, AffiliateUrlValidationResult, NormalizedProductImport, ProductMetadataInput, ResolvedAffiliateLink } from './types';
import { SafeUrlResolver, SafeResolverResult } from './resolver';
import { ResolverError } from './ssrf';
import { extractJsonLd, extractMetaTags } from './metadata-extractor';

export const SHOPEE_HOSTS = ['shopee.com.br', 'shope.ee', 'shp.ee'];
export function shopeeProductId(url: string): string | undefined {
  const path = new URL(url).pathname;
  const match = path.match(/(?:-i\.|\/product\/)(\d+)[./](\d+)(?:\/|$)/);
  return match ? `${match[1]}.${match[2]}` : undefined;
}
export function extractShopeeMetadata(html: string, affiliateUrl: string, resolvedUrl: string): NormalizedProductImport {
  const externalProductId = shopeeProductId(resolvedUrl);
  const base = { affiliateUrl, resolvedUrl, externalProductId, fetchedAt: new Date(), metadataSource: 'SHOPEE_PUBLIC_METADATA' };
  const partial: NormalizedProductImport = { ...base, status:'PARTIAL', warnings:['A Shopee não disponibilizou os dados completos. Revise e preencha os campos abaixo.'] };
  if (!externalProductId || /<title[^>]*>[^<]*(?:login|entrar|captcha|security|verificação|access denied)/i.test(html)) return partial;
  const ld = extractJsonLd(html);
  const og = extractMetaTags(html);
  // Require product-specific evidence; a generic marketplace page is not a product.
  if (!ld && !/(?:property|name)=["'](?:og:type|product:price:amount)["']/i.test(html)) return partial;
  if (!ld && !/content=["'](?:product|[0-9][0-9.,]*)["']/i.test(html)) return partial;
  const raw = ld || og;
  const imageUrl = raw.imageUrl && /^https?:\/\//i.test(raw.imageUrl) ? raw.imageUrl : undefined;
  return { ...base, status: raw.name && imageUrl && raw.price !== undefined ? 'COMPLETE' : 'PARTIAL',
    name:raw.name, brand:raw.brand, description:raw.description, sourceDescription:raw.description,
    imageUrl, images:imageUrl ? [imageUrl] : [], price:raw.price, currency:raw.currency,
    // og:site_name names the platform, not the seller.
    seller:ld?.seller, sourceSpecs:ld?.sourceSpecs, sourceRating:ld?.sourceRating, sourceReviewCount:ld?.sourceReviewCount,
    warnings:raw.name && imageUrl && raw.price !== undefined ? [] : partial.warnings };
}
export class ShopeeAffiliateProvider implements AffiliateProvider {
  readonly code = 'SHOPEE'; readonly name = 'Shopee';
  constructor(private readonly resolve = (url: string): Promise<SafeResolverResult> => SafeUrlResolver.resolve(url, {allowedHosts:SHOPEE_HOSTS})) {}
  capabilities() { return {automaticAffiliateLinkGeneration:false,affiliateLinkImport:true,productMetadataImport:true,supportsTrackingLabel:true}; }
  async validateAffiliateUrl(raw: string): Promise<AffiliateUrlValidationResult> {
    try {
      const url = new URL(raw.trim());
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80','443'].includes(url.port))) throw new Error();
      if (!SHOPEE_HOSTS.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) throw new Error();
      return {valid:true,normalizedUrl:url.toString()};
    } catch { return {valid:false,error:'Informe um link de produto válido da Shopee.'}; }
  }
  async resolveAffiliateUrl(raw: string): Promise<ResolvedAffiliateLink> {
    const v = await this.validateAffiliateUrl(raw);
    if (!v.valid || !v.normalizedUrl) throw new Error(v.error);
    const r = await this.resolve(v.normalizedUrl);
    return {affiliateUrl:v.normalizedUrl,resolvedUrl:r.finalUrl,externalProductId:shopeeProductId(r.finalUrl),provider:this.code};
  }
  async fetchProductMetadata(input: ProductMetadataInput): Promise<NormalizedProductImport> {
    const v=await this.validateAffiliateUrl(input.affiliateUrl);
    const base={affiliateUrl:v.normalizedUrl || input.affiliateUrl,metadataSource:'SHOPEE_PUBLIC_METADATA',fetchedAt:new Date()};
    if (!v.valid) return {...base,status:'FAILED',warnings:[v.error!]};
    try {
      const r=await this.resolve(base.affiliateUrl);
      if (r.statusCode>=400 || !r.body) return {...base,resolvedUrl:r.finalUrl,externalProductId:shopeeProductId(r.finalUrl),status:'PARTIAL',warnings:['Dados públicos indisponíveis na Shopee. Complete o cadastro manualmente.']};
      return extractShopeeMetadata(r.body,base.affiliateUrl,r.finalUrl);
    } catch (error) {
      const unsafe=error instanceof ResolverError && !['NETWORK_ERROR','RESOLVER_TIMEOUT'].includes(error.code);
      return {...base,status:unsafe?'FAILED':'PARTIAL',warnings:[unsafe?'Não foi possível validar o destino seguro deste link. Verifique a URL.':'A Shopee não respondeu agora. Você pode completar o cadastro manualmente.']};
    }
  }
}
