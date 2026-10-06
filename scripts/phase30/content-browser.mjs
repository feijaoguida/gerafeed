import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {AFFILIATE_FEATURES} from '../../src/lib/billing-constants.ts';
import {prisma} from '../../src/lib/prisma.ts';
import {hashPassword} from '../../src/lib/security/password.ts';
import {withTestWorkspace} from './fixture.ts';
import {listProductArticles,getReviewProduct} from '../../src/lib/affiliate/product-content-service.ts';
const {chromium}=await import(process.env.PHASE30_PLAYWRIGHT||'/tmp/phase30-browser/node_modules/playwright/index.mjs');
try{await withTestWorkspace(async workspaceId=>{
 const password=randomUUID();const user=await prisma.user.create({data:{email:`phase30-${randomUUID()}@example.test`,passwordHash:await hashPassword(password),workspaces:{create:{workspaceId,role:'OWNER'}}}});
 const browser=await chromium.launch({headless:true});
 try{
  const program=await prisma.affiliateProgram.findUniqueOrThrow({where:{code:'SHOPEE'}});
  const product=await prisma.product.create({data:{workspaceId,name:'Produto do review',slug:'review',offers:{create:{workspaceId,affiliateProgramId:program.id,affiliateUrl:'https://shopee.com.br/product/1/2',status:'ACTIVE'}}}});
  assert.equal((await listProductArticles(workspaceId,product.id)).total,0);
  await withTestWorkspace(async other=>{await assert.rejects(()=>getReviewProduct(other,product.id));await assert.rejects(()=>listProductArticles(other,product.id));});
  for(const [i,status] of ['PENDING','PUBLISHED','REJECTED'].entries())await prisma.article.create({data:{workspaceId,title:`Artigo ${i}`,status,articleProducts:{create:{productId:product.id}}}});
  const repeated=await prisma.article.findFirstOrThrow({where:{workspaceId}});
  await prisma.article.update({where:{id:repeated.id},data:{canonicalContent:{version:1,blocks:['first','second'].map(id=>({type:'PRODUCT_GROUP',data:{id,layout:'BUTTON',products:[{productId:product.id}]}}))}}});
  const one=await listProductArticles(workspaceId,product.id,1,2);assert.equal(one.items.length,2);assert.equal(one.total,3);assert(one.hasMore);assert.equal((await listProductArticles(workspaceId,product.id,2,2)).items.length,1);
  await assert.rejects(()=>listProductArticles(workspaceId,'foreign'));assert.equal((await getReviewProduct(workspaceId,product.id)).id,product.id);
  const page=await browser.newPage();let generated=0;page.on('request',r=>{if(r.url().includes('/api/affiliate/generate/'))generated++;});
  await page.goto('http://localhost:3100/login');await page.getByPlaceholder('voce@exemplo.com').fill(user.email);await page.getByPlaceholder('Sua senha').fill(password);await page.getByRole('button',{name:/Entrar/i}).click();await page.waitForURL('**/dashboard',{timeout:60000});
  await page.goto(`http://localhost:3100/affiliates/products/${product.id}`);
  await page.getByRole('button',{name:/Conteúdos & Pesquisa/}).click();
  await page.getByRole('link',{name:'Artigo 0',exact:true}).waitFor();
  // Simulate a first catalog page that does not contain the selected product.
  await page.route('**/api/affiliate/products?limit=100',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({items:[]})}));
  await page.getByRole('link',{name:'Gerar Review deste Produto',exact:true}).click();
  await page.waitForURL(`**/publishing/affiliate?productId=${product.id}`);
  await page.getByRole('heading',{name:'Passo 2: Selecione os produtos do catálogo'}).waitFor();
  await page.getByText('Produto do review',{exact:true}).waitFor();assert(await page.getByRole('checkbox').isChecked());assert.equal(generated,0);
  await page.screenshot({path:'/tmp/phase30-wizard-selected.png',fullPage:true});
  await page.goto('http://localhost:3100/publishing/affiliate?productId=missing');await page.getByText(/Este produto não está disponível/).waitFor();assert.equal(generated,0);
  await prisma.product.update({where:{id:product.id},data:{status:'ARCHIVED'}});
  await assert.rejects(()=>getReviewProduct(workspaceId,product.id));
  await page.goto(`http://localhost:3100/publishing/affiliate?productId=${product.id}`);await page.getByText(/Este produto não está disponível/).waitFor();
  await page.goto('http://localhost:3100/publishing/affiliate');await page.getByRole('heading',{name:/Escolha o formato do conteúdo/i}).waitFor();
  const subscription=await prisma.subscription.findUniqueOrThrow({where:{workspaceId}});
  await prisma.planFeature.updateMany({where:{planId:subscription.planId,feature:{key:AFFILIATE_FEATURES.MODULE}},data:{enabled:false}});
  await assert.rejects(()=>getReviewProduct(workspaceId,product.id),/não está habilitado/);
  await page.goto(`http://localhost:3100/publishing/affiliate?productId=${product.id}`);await page.getByRole('heading',{name:'Módulo de Afiliados Exclusivo'}).waitFor();
  assert.equal((await page.request.get(`http://localhost:3100/api/affiliate/products/${product.id}/articles`)).status(),403);assert.equal(generated,0);
  console.log('PASS: empty list, repeated occurrences without duplicate relations, actual foreign workspace, archived product, normal wizard, plan denied in UI/API; ');
  console.log('PASS: real related ArticleProduct pagination/statuses; tenant rejection; browser detail→review, selected product absent from catalog page, invalid product feedback, zero generation requests.');
 }finally{await browser.close();await prisma.user.delete({where:{id:user.id}});}
});}catch(e){console.error(e);process.exitCode=1;}finally{await prisma.$disconnect();}
