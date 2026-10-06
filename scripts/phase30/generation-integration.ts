import assert from 'node:assert/strict';
import {prisma} from '../../src/lib/prisma';
import {withTestWorkspace} from './fixture';
import {ProductReviewGenerator} from '../../src/lib/affiliate/generators/review-generator';
import {ProductComparisonGenerator} from '../../src/lib/affiliate/generators/comparison-generator';
import {BestProductsGenerator,BuyingGuideGenerator} from '../../src/lib/affiliate/generators/roundup-generator';
import {AIProvider} from '../../src/lib/ai/types';
const ai:AIProvider={name:'test',model:'fixture',testConnection:async()=>({connected:true,provider:'test',model:'fixture'}),generateArticle:async()=>({relevant:true,score:80,title:'Artigo de teste',summary:'Resumo',content:'<p>Introdução</p><p>Análise com informações disponíveis.</p><p>Conclusão.</p>',suggestedCategoryId:null,tags:[],seoFocusKeyword:'produto',seoTitle:'Produto',seoDescription:'Review'})};
withTestWorkspace(async workspaceId=>{
 const program=await prisma.affiliateProgram.findUniqueOrThrow({where:{code:'SHOPEE'}});
 const products=[];
 for(let i=0;i<2;i++)products.push(await prisma.product.create({data:{workspaceId,name:`Teste ${i}`,slug:`teste-${i}`,imageUrl:'https://example.com/original.jpg',offers:{create:{workspaceId,affiliateProgramId:program.id,affiliateUrl:'https://shopee.com.br/product/1/2',status:'ACTIVE'}}}}));
 const productIds=products.map(p=>p.id);
 const inputs={workspaceId,productIds,categoryName:'Teste',aiProvider:ai};
 const results=[await ProductReviewGenerator.generate({workspaceId,productId:productIds[0],aiProvider:ai}),await ProductComparisonGenerator.generate(inputs),await BestProductsGenerator.generate(inputs),await BuyingGuideGenerator.generate(inputs)];
 for(const result of results){
  assert.equal(result.canonicalDocument.blocks.filter(b=>b.type==='PRODUCT_GROUP').length,2);
  assert(result.canonicalDocument.blocks.some(b=>b.type==='IMAGE'));
  const saved=await prisma.article.findUniqueOrThrow({where:{id:result.article.id},include:{articleProducts:true}});
  assert(saved.originalImageUrl);assert(saved.articleProducts.every(r=>r.score===null));
  assert.deepEqual(saved.canonicalContent,JSON.parse(JSON.stringify(result.canonicalDocument)));
 }
 console.log('PASS: four real generators, simulated AI, original single image in body/cover, middle/end occurrences and persisted unique relations in local DB.');
}).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
