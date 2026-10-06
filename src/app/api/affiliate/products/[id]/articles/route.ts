import { NextResponse } from 'next/server';
import { requireAffiliateWorkspace } from '@/lib/affiliate/request-auth';
import { AffiliateContentError } from '@/lib/affiliate/block-contract';
import { listProductArticles } from '@/lib/affiliate/product-content-service';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try {return NextResponse.json(await listProductArticles(await requireAffiliateWorkspace(),(await params).id,Number(new URL(request.url).searchParams.get('page')||1)));}
 catch(e){const message=e instanceof Error?e.message:'Erro ao carregar artigos.';return NextResponse.json({error:message},{status:e instanceof AffiliateContentError?e.status:message.includes('não está habilitado')?403:500});}
}
