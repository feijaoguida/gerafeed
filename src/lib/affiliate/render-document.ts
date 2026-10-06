import type { CanonicalBlock, CanonicalDocument } from './canonical-document';
import { AffiliateGroupData, AffiliateProductReference, resolveReference } from './block-contract';
export interface RenderProduct {
  id: string; name: string; brand?: string | null; description?: string | null;
  imageUrl?: string | null; rating?: number | null; specs?: unknown; pros?: string[]; cons?: string[];
  offers: { id: string; affiliateUrl: string; status: string; price?: number | null; currency?: string; seller?: string | null }[];
}
export interface RenderDocumentOptions {
  disclosure?: string;
  token?: (productId: string, offerId: string, occurrence: string, position: number) => string;
}
export function escapeHtml(text: string): string {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export function safeHttpUrl(value?: string | null): string {
  try { const u = new URL(value || ''); return ['http:','https:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
const buttonStyle='display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;text-align:center;font-weight:700;line-height:1.5;max-width:100%;box-sizing:border-box';
function button(ref: AffiliateProductReference, catalog: RenderProduct[], text: string, subtitle: boolean, occurrence: string, position: number, options: RenderDocumentOptions): string {
  const {product,offer}=resolveReference(ref,catalog);
  const token=options.token?.(product.id,offer.id,occurrence,position);
  return `<a class="nc-affiliate-link" href="${escapeHtml(offer.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener"${token ? ` data-nc-token="${escapeHtml(token)}"` : ''} style="${buttonStyle}">${escapeHtml(text)}${subtitle ? `<small style="display:block;font-size:12px;font-weight:400;margin-top:4px">${escapeHtml(product.name)}</small>` : ''}</a>`;
}
export function renderProductGroup(data: AffiliateGroupData, catalog: RenderProduct[], options: RenderDocumentOptions = {}): string {
  const cards=data.products.map((ref,index)=>{
    const {product}=resolveReference(ref,catalog);
    const cta=button(ref,catalog,data.ctaText || 'Conferir oferta',data.layout==='BUTTON',data.id,index,options);
    if(data.layout==='BUTTON') return `<div style="text-align:center">${cta}</div>`;
    const image=safeHttpUrl(product.imageUrl);
    return `<div class="gerafeed-product-card" style="box-sizing:border-box;border:1px solid #e2e8f0;border-radius:12px;padding:20px;background:#fff;color:#0f172a;overflow-wrap:anywhere;${data.layout==='CAROUSEL'?'flex:0 0 min(280px,85%);scroll-snap-align:start;':'min-width:0;'}">
${data.layout!=='TEXT_CARD' && image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" style="display:block;width:100%;height:200px;object-fit:contain;margin:0 auto 16px" />` : ''}
<h3 style="font-size:18px;margin:0 0 12px">${escapeHtml(product.name)}</h3>
${product.description && ['IMAGE_CARD','TEXT_CARD'].includes(data.layout)?`<p style="font-size:14px;line-height:1.6">${escapeHtml(product.description.slice(0,300))}</p>`:''}${cta}</div>`;
  });
  const style=data.layout==='CAROUSEL'?'display:flex;overflow-x:auto;scroll-snap-type:x mandatory;':data.layout==='GRID'?'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));':'display:grid;';
  return `<div class="gerafeed-product-group" data-affiliate-block="${escapeHtml(data.id)}"${data.layout==='CAROUSEL'?' role="region" aria-label="Ofertas de produtos; role horizontalmente para ver mais" tabindex="0"':''} style="${style}gap:16px;margin:24px 0;padding:4px">${cards.join('\n')}</div>`;
}
export function renderCanonicalHtml(doc: CanonicalDocument, products: RenderProduct[], options: RenderDocumentOptions = {}): string {
  let disclosed=false;
  const disclosure=(text?:string|null)=>{if(disclosed)return '';disclosed=true;return `<aside class="nc-affiliate-disclosure" style="background:#f8fafc;color:#475569;border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;font-size:13px">${escapeHtml(options.disclosure || text || 'Transparência: podemos receber uma comissão, sem custo adicional para você, ao comprar através dos nossos links.')}</aside>`;};
  const render=(b:CanonicalBlock,index:number):string=>{
    switch(b.type){
      case 'RICH_TEXT':return b.data.html || b.data.markdown || '';
      case 'HEADING':return `<h${b.data.level}${b.data.id?` id="${escapeHtml(b.data.id)}"`:''}>${escapeHtml(b.data.text)}</h${b.data.level}>`;
      case 'AFFILIATE_DISCLOSURE':return disclosure(b.data.text);
      case 'IMAGE':{const url=safeHttpUrl(b.data.url);return url?`<figure style="margin:24px 0;text-align:center"><img src="${escapeHtml(url)}" alt="${escapeHtml(b.data.alt||'')}" style="max-width:100%;height:auto" />${b.data.caption?`<figcaption>${escapeHtml(b.data.caption)}</figcaption>`:''}</figure>`:'';}
      case 'PRODUCT_GROUP':return renderProductGroup(b.data,products,options);
      case 'PRODUCT_CARD': {
        const {product}=resolveReference(b.data,products);
        const badge=b.data.highlightBadge?`<p style="font-weight:700;color:#2563eb">${escapeHtml(b.data.highlightBadge)}</p>`:'';
        const specs=b.data.showSpecs && product.specs && typeof product.specs==='object'?`<dl>${Object.entries(product.specs).map(([k,v])=>`<dt><strong>${escapeHtml(k)}</strong></dt><dd>${escapeHtml(String(v))}</dd>`).join('')}</dl>`:'';
        const pros=b.data.showProsCons?render({type:'PROS_CONS',data:{pros:product.pros||[],cons:product.cons||[]}},index):'';
        return renderProductGroup({id:`legacy-${index}`,layout:'IMAGE_CARD',products:[b.data],ctaText:b.data.ctaText || undefined},products,options).replace('<h3',badge+'<h3').replace('</h3>','</h3>'+specs+pros);
      }
      case 'CTA':return b.data.productId ? renderProductGroup({id:`legacy-${index}`,layout:'BUTTON',products:[{productId:b.data.productId,offerId:b.data.offerId}],ctaText:b.data.text},products,options):'';
      case 'PROS_CONS':return `<div style="display:flex;gap:16px;flex-wrap:wrap;margin:24px 0">${[['Pontos fortes',b.data.pros],['Pontos a considerar',b.data.cons]].map(([title,list])=>`<section><h3>${title}</h3><ul>${(list as string[]).map(v=>`<li>${escapeHtml(v)}</li>`).join('')}</ul></section>`).join('')}</div>`;
      case 'PRODUCT_COMPARISON':{
        const items=b.data.productIds.map(productId=>resolveReference({productId},products));
        const cell='style="padding:12px;border:1px solid #cbd5e1;text-align:left"';
        const criteria=b.data.criteria || [];
        const priceRow=b.data.showPriceRow!==false?`<tr><th ${cell}>Preço consultado (sujeito a alteração)</th>${items.map(i=>`<td ${cell}>${i.offer.price!=null?escapeHtml(`${i.offer.currency || 'BRL'} ${i.offer.price.toFixed(2)}`):'Não informado'}</td>`).join('')}</tr>`:'';
        const ratingRow=`<tr><th ${cell}>Avaliação cadastrada</th>${items.map(i=>`<td ${cell}>${i.product.rating!=null?escapeHtml(String(i.product.rating)):'Não informada'}</td>`).join('')}</tr>`;
        return `<div style="overflow-x:auto;margin:24px 0"><table style="border-collapse:collapse;width:100%"><caption>Comparativo de produtos</caption><thead><tr><th ${cell}>Produto</th>${items.map(i=>`<th ${cell}>${escapeHtml(i.product.name)}</th>`).join('')}</tr></thead><tbody>${priceRow}${ratingRow}${criteria.map(key=>`<tr><th ${cell}>${escapeHtml(key)}</th>${items.map(i=>`<td ${cell}>${escapeHtml(String((i.product.specs as Record<string,unknown>|null)?.[key] ?? 'Não informado'))}</td>`).join('')}</tr>`).join('')}<tr><th ${cell}>Oferta</th>${items.map((i,n)=>`<td ${cell}>${button({productId:i.product.id,offerId:i.offer.id},products,'Ver preço atual',false,`comparison-${index}`,n,options)}</td>`).join('')}</tr></tbody></table></div>`;
      }
    }
  };
  const hasCommercial=doc.blocks.some(b=>['PRODUCT_GROUP','PRODUCT_CARD','PRODUCT_COMPARISON','CTA'].includes(b.type));
  const prefix=hasCommercial && !doc.blocks.some(b=>b.type==='AFFILIATE_DISCLOSURE')?disclosure():'';
  return prefix+doc.blocks.map(render).join('\n');
}
