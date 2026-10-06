import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFFILIATE_LAYOUTS, validateAffiliateGroup, resolveReference } from '../../src/lib/affiliate/block-contract';
import { CanonicalDocumentService as Docs, CanonicalBlock } from '../../src/lib/affiliate/canonical-document';
import { documentToEditorHtml, editorHtmlToDocument } from '../../src/lib/affiliate/editor-document';

test('five models, repeated products in distinct occurrences and lossless editor roundtrip', () => {
  const blocks: CanonicalBlock[] = [{type:'RICH_TEXT',data:{html:'<p>Antes &amp; depois</p>'}}];
  AFFILIATE_LAYOUTS.forEach((layout, i) => blocks.push({type:'PRODUCT_GROUP',data:{id:`block_${i}`,layout,products:[{productId:'a'},{productId:'b',offerId:'offer_b'}]}}));
  blocks.push({type:'PRODUCT_CARD',data:{productId:'a'}});
  const doc=Docs.createDocument(blocks,{baseProductIds:['a']});
  const parsed=editorHtmlToDocument(documentToEditorHtml(doc),doc.meta);
  assert.deepEqual(parsed, doc);
  assert.deepEqual(Docs.extractReferencedProductIds(parsed),['a','b']);
  assert.deepEqual(Docs.extractReferencedOfferIds(parsed),['offer_b']);
  assert(!JSON.stringify(doc).includes('affiliateUrl'));
});
test('reject malformed, oversized, unknown, duplicate and URL-bearing references', () => {
  const good={id:'one',layout:'GRID',products:[{productId:'a'}]};
  for(const bad of [null, {...good,layout:'bad'}, {...good,id:''}, {...good,products:[]}, {...good,products:Array(21).fill({productId:'a'})}, {...good,products:[{productId:'a',affiliateUrl:'https://example.com'}]}, {...good,ctaText:'a'.repeat(101)}]) assert.throws(()=>validateAffiliateGroup(bad));
  assert.throws(()=>Docs.createDocument([{type:'PRODUCT_GROUP',data:validateAffiliateGroup(good)},{type:'PRODUCT_GROUP',data:validateAffiliateGroup(good)}]));
  assert.throws(()=>editorHtmlToDocument('<!-- gerafeed-block:broken -->'));
});
test('offer selection deterministic, explicit mismatch/inactive/cross-tenant product rejected', () => {
  const catalog=[{id:'a',offers:[{id:'b',price:10,status:'ACTIVE',affiliateUrl:'https://example.com/b'},{id:'a',price:10,status:'ACTIVE',affiliateUrl:'https://example.com/a'},{id:'off',status:'PAUSED',affiliateUrl:'https://example.com'}]}];
  assert.equal(resolveReference({productId:'a'},catalog).offer.id,'a');
  for(const ref of [{productId:'foreign'},{productId:'a',offerId:'foreign'},{productId:'a',offerId:'off'}]) assert.throws(()=>resolveReference(ref,catalog));
});
