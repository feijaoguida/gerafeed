import { prisma } from '@/lib/prisma';
import { BillingService, AFFILIATE_FEATURES } from '@/lib/billing';
import { AffiliateContentError } from './block-contract';
export async function getReviewProduct(workspaceId:string,productId:string){
 await BillingService.assertFeature(workspaceId,AFFILIATE_FEATURES.MODULE,'O módulo de afiliados não está habilitado no seu plano.');
 const product=await prisma.product.findFirst({where:{id:productId,workspaceId,status:'ACTIVE'},select:{id:true,name:true,brand:true,imageUrl:true,categoryId:true,category:{select:{id:true,name:true}},offers:{where:{workspaceId,status:'ACTIVE'},select:{id:true,price:true,seller:true,affiliateUrl:true,status:true}}}});
 if(!product || !product.offers.length)throw new AffiliateContentError('Este produto não está disponível para review. Selecione outro produto ou ative uma oferta.',404);
 return product;
}
export async function listProductArticles(workspaceId:string,productId:string,page=1,pageSize=10){
 await BillingService.assertFeature(workspaceId,AFFILIATE_FEATURES.MODULE,'O módulo de afiliados não está habilitado no seu plano.');
 if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>50)throw new AffiliateContentError('Paginação inválida.');
 if(!await prisma.product.findFirst({where:{workspaceId,id:productId},select:{id:true}}))throw new AffiliateContentError('Produto não encontrado.',404);
 const where={productId,product:{workspaceId},article:{workspaceId}};
 const [rows,total]=await Promise.all([
 prisma.articleProduct.findMany({where,orderBy:[{article:{createdAt:'desc'}},{articleId:'asc'}],skip:(page-1)*pageSize,take:pageSize,select:{article:{select:{id:true,title:true,originalTitle:true,status:true,createdAt:true,lastPublishedAt:true,wordpressPostId:true,wordpressSite:{select:{url:true}}}}}}),
 prisma.articleProduct.count({where}),
 ]);
 return {items:rows.map(({article:a})=>({id:a.id,title:a.title||a.originalTitle||'Artigo sem título',status:a.status,date:(a.lastPublishedAt||a.createdAt).toISOString(),publishedUrl:a.wordpressPostId && a.wordpressSite?`${a.wordpressSite.url.replace(/\/$/,'')}/?p=${a.wordpressPostId}`:null})),total,page,hasMore:page*pageSize<total};
}
