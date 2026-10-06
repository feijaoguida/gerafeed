import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { AFFILIATE_LAYOUTS } from '../../src/lib/affiliate/block-contract';
import { renderCanonicalHtml, renderProductGroup, RenderProduct } from '../../src/lib/affiliate/render-document';
import { CanonicalDocumentService as Docs } from '../../src/lib/affiliate/canonical-document';
const products:RenderProduct[]=[{id:'a',name:'Produto <seguro> & nome longo '.repeat(3),description:'Descrição <script> nunca executada',imageUrl:'https://placehold.co/240x200/png',offers:[{id:'o',status:'ACTIVE',affiliateUrl:'https://example.com/?a=1&b=2'}]},{id:'b',name:'Sem imagem',offers:[{id:'ob',status:'ACTIVE',affiliateUrl:'https://example.com/b'}]}];
const doc=Docs.createDocument(AFFILIATE_LAYOUTS.map((layout,i)=>({type:'PRODUCT_GROUP',data:{id:`block${i}`,layout,products:products.map(p=>({productId:p.id}))}})));
test('five layouts, safe markup, no-image fallback and preview/render parity',()=>{
 const html=renderCanonicalHtml(doc,products);
 assert.equal(html,Docs.renderToHtml(doc,products));
 assert(html.includes('&lt;seguro&gt;'));assert(!html.includes('<script>'));
 assert.equal((html.match(/<img /g)||[]).length,3);
 assert(html.includes('tabindex="0"'));assert(html.includes('<small'));
 assert.equal((html.match(/nc-affiliate-disclosure/g)||[]).length,1);
 assert.equal((html.match(/rel="sponsored nofollow noopener"/g)||[]).length,10);
 const unsafe=[{...products[0],offers:[{id:'o',status:'ACTIVE',affiliateUrl:'javascript:alert(1)'}]}];
 assert.throws(()=>renderCanonicalHtml(doc,unsafe));
 assert.throws(()=>renderProductGroup({id:'x',layout:'BUTTON',products:[{productId:'a',offerId:'missing'}]},products));
 writeFileSync('/tmp/phase30-cards.html',`<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modelos de afiliados</title><body style="font-family:Arial;margin:16px">${html}</body></html>`);
});
test('comparison remains table, tracking per occurrence and explicit offer validated',()=>{
 const html=renderCanonicalHtml(Docs.createDocument([{type:'PRODUCT_COMPARISON',data:{productIds:['a','b']}}]),products,{token:(_p,_o,occurrence)=>occurrence});
 assert(html.includes('<table'));assert(html.includes('data-nc-token="comparison-0"'));
});
