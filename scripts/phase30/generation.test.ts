import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enrichGeneratedBlocks } from '../../src/lib/affiliate/generators/enrich-document';
import { CanonicalDocumentService as Docs } from '../../src/lib/affiliate/canonical-document';
import { documentToEditorHtml, editorHtmlToDocument } from '../../src/lib/affiliate/editor-document';
import { splitHtmlAtCursor } from '../../src/lib/affiliate/html-position';
test('zero/one/many images and 1/2/5-product generation, middle/end stable roundtrip',()=>{
 for(const count of [1,2,5])for(const images of [[],['https://example.com/original.jpg'],['https://example.com/1.jpg','https://example.com/2.jpg']]){
  const products=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`Produto ${i}`,images}));
  const blocks=enrichGeneratedBlocks([{type:'RICH_TEXT',data:{html:'<p>Primeiro</p><p>Segundo</p><p>Terceiro</p><img src="https://inventada.com/a.jpg">'}}],products);
  assert.equal(blocks.filter(b=>b.type==='PRODUCT_GROUP').length,2);
  assert.equal(blocks.at(-1)?.type,'PRODUCT_GROUP');
  assert.equal(blocks.filter(b=>b.type==='IMAGE').length,images.length?1:0);
  assert(!JSON.stringify(blocks).includes('inventada.com'));
  const doc=Docs.createDocument(blocks);assert.deepEqual(editorHtmlToDocument(documentToEditorHtml(doc),doc.meta),doc);
 }
});
test('safe HTML splitting preserves paragraph and inline formatting',()=>{
 const html='<p>Olá <strong>mundo</strong>!</p>';const pos=html.indexOf('mundo')+2;
 const [before,after]=splitHtmlAtCursor(html,pos);
 assert.equal(before,'<p>Olá <strong>mu</strong></p>');assert.equal(after,'<p><strong>ndo</strong>!</p>');
 assert.throws(()=>splitHtmlAtCursor('<p title="abc">Olá</p>',8));
 assert.throws(()=>splitHtmlAtCursor('<ul><li>Teste</li></ul>',10));
});
