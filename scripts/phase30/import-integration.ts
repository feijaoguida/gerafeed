import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/lib/prisma';
import { AffiliateService } from '../../src/lib/affiliate/service';
import { AffiliateProviderFactory } from '../../src/lib/affiliate/factory';
import { ShopeeAffiliateProvider } from '../../src/lib/affiliate/shopee';
import { BillingService, AFFILIATE_FEATURES } from '../../src/lib/billing';

async function run() {
 const host=new URL(process.env.DATABASE_URL!).hostname;
 assert(['localhost','127.0.0.1'].includes(host),'Integration test requires local DB');
 const slug=`phase30-test-${randomUUID()}`;
 const featureKeys=[AFFILIATE_FEATURES.MODULE,AFFILIATE_FEATURES.MAX_PRODUCTS,AFFILIATE_FEATURES.MAX_PROGRAMS];
 // Read existing features only; do not reseed unrelated billing/plans.
 const features=await prisma.feature.findMany({where:{key:{in:featureKeys}}});
 assert.equal(features.length,3,'Required affiliate features must already exist');
 const plan=await prisma.plan.create({data:{name:slug,slug,planFeatures:{create:features.map(f=>({featureId:f.id,enabled:true,limit:5}))}}});
 const ws=await prisma.workspace.create({data:{name:slug,slug,subscription:{create:{planId:plan.id,status:'ACTIVE'}}}});
 const shopee=AffiliateProviderFactory.getProvider('SHOPEE');
 const mercado=AffiliateProviderFactory.getProvider('MERCADO_LIVRE');
 if (!process.env.PHASE30_LIVE_SHOPEE) AffiliateProviderFactory.registerProvider(new ShopeeAffiliateProvider(async initialUrl=>({initialUrl,finalUrl:'https://shopee.com.br/product/123/456',redirectChain:[],headers:{},statusCode:403})));
 const fetchMeli=mercado.fetchProductMetadata;
 mercado.fetchProductMetadata=async input=>({status:'PARTIAL',affiliateUrl:input.affiliateUrl,externalProductId:'MLB123456',metadataSource:'TEST',fetchedAt:new Date(),warnings:[]});
 try {
  assert(await BillingService.hasFeature(ws.id,AFFILIATE_FEATURES.MODULE));
  const input={affiliateUrl:process.env.PHASE30_LIVE_SHOPEE || 'https://s.shopee.com.br/TestFixture',providerCode:'SHOPEE',name:'Produto teste',description:'Texto editorial'};
  const preview=await AffiliateService.previewImport(ws.id,input);assert(['PARTIAL','COMPLETE'].includes(preview.metadata.status));console.log('Shopee preview:',preview.metadata.status,process.env.PHASE30_LIVE_SHOPEE ? '(real network)' : '(fixture)');assert.equal(await prisma.product.count({where:{workspaceId:ws.id}}),0);
  const attempts=await Promise.allSettled([AffiliateService.confirmImport(ws.id,{...input}),AffiliateService.confirmImport(ws.id,{...input})]);
  assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
  const saved=attempts.find(r=>r.status==='fulfilled');assert(saved?.status==='fulfilled');
  assert.equal(await prisma.product.count({where:{workspaceId:ws.id}}),1);
  assert.equal((await AffiliateService.previewImport(ws.id,input)).isDuplicate,true);
  const updated=await AffiliateService.confirmImport(ws.id,{...input,overwriteExistingProductId:saved.value.product.id,description:'Não sobrescrever'});
  assert.equal(updated.product.description,'Texto editorial');
  await assert.rejects(()=>AffiliateService.confirmImport(ws.id,{...input,categoryId:'foreign'}));
  const meli=await AffiliateService.confirmImport(ws.id,{affiliateUrl:'https://produto.mercadolivre.com.br/MLB-123456',name:'Mercado teste'});
  assert.notEqual(meli.product.id,saved.value.product.id);
  console.log('PASS: real local DB; partial/manual import, preview read-only, concurrent dedupe, editorial preservation, tenant category and Mercado Livre regression (Mercado Livre fetch is a fixture; Shopee network mode reported above).');
 } finally {
  mercado.fetchProductMetadata=fetchMeli;AffiliateProviderFactory.registerProvider(shopee);
  await prisma.workspace.delete({where:{id:ws.id}});await prisma.plan.delete({where:{id:plan.id}});
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
