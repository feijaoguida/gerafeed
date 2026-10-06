import { randomUUID } from 'node:crypto';
import { CanonicalBlock } from '../canonical-document';
import { safeHttpUrl } from '../render-document';
import { splitHtmlInMiddle } from '../html-position';
interface ProductImage { id:string; name:string; imageUrl?:string|null; images?:string[]; }
/** Generation only: never called when saving existing articles. */
export function enrichGeneratedBlocks(blocks:CanonicalBlock[],products:ProductImage[]):CanonicalBlock[]{
  if(!products.length)return blocks;
  const refs=products.map(p=>{
    const card=blocks.find(b=>b.type==='PRODUCT_CARD' && b.data.productId===p.id);
    return {productId:p.id,offerId:card?.type==='PRODUCT_CARD'?card.data.offerId:undefined};
  });
  const group=():CanonicalBlock=>({type:'PRODUCT_GROUP',data:{id:randomUUID(),layout:products.length===1?'IMAGE_CARD':'GRID',products:refs,ctaText:'Conferir oferta'}});
  const result:CanonicalBlock[]=[];
  let middle=false;
  const knownImages=new Set(products.flatMap(p=>[p.imageUrl,...(p.images||[])].filter((u):u is string=>!!u && !!safeHttpUrl(u))));
  for(const block of blocks){
    if(block.type==='CTA')continue; // Replace final CTA with the complete selected-product group.
    if(block.type==='PRODUCT_CARD' && products.length>1)continue;
    if(block.type==='IMAGE' && !knownImages.has(block.data.url))continue;
    if(block.type==='RICH_TEXT' && !middle){
      // Generated rich text must not introduce ungrounded image URLs or encoded product blocks.
      const html=(block.data.html||'').replace(/<img\b[^>]*>/gi,'').replace(/<!-- gerafeed-block:[\s\S]*?-->/g,'');
      const [before,after]=splitHtmlInMiddle(html);
      const first=products[0];const image=[first.imageUrl,...(first.images||[])].find(u=>u && safeHttpUrl(u));
      if(image && !blocks.some(b=>b.type==='IMAGE'))result.push({type:'IMAGE',data:{url:image,alt:first.name}});
      result.push({type:'RICH_TEXT',data:{html:before}},group());
      if(after)result.push({type:'RICH_TEXT',data:{html:after}});
      middle=true;
    }else result.push(block);
  }
  if(!middle)result.push(group());
  result.push(group());
  return result;
}
