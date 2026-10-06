'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
interface RelatedArticle {id:string;title:string;status:string;date:string;publishedUrl:string|null;}
export function ProductContentResearch({productId}:{productId:string}){
 const [items,setItems]=useState<RelatedArticle[]>([]);const [page,setPage]=useState(1);const [hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();
  fetch(`/api/affiliate/products/${encodeURIComponent(productId)}/articles?page=${page}`,{signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro ao carregar artigos.');return data;}).then(data=>{setItems(prev=>page===1?data.items:[...prev,...data.items.filter((item:RelatedArticle)=>!prev.some(p=>p.id===item.id))]);setHasMore(data.hasMore);setLoading(false);}).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setLoading(false);}});
  return()=>controller.abort();
 },[productId,page,retry]);
 return <Card className="p-6 space-y-4">
  <h2 className="font-heading text-lg font-semibold">Conteúdos que usam este produto</h2>
  <p className="text-sm text-muted-foreground">Transforme as informações deste produto em um review. Você poderá revisar tudo antes de publicar.</p>
  <Link href={`/publishing/affiliate?productId=${encodeURIComponent(productId)}`} className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2">Gerar Review deste Produto</Link>
  {loading && <p role="status" className="text-sm">Carregando artigos…</p>}
  {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={()=>{setError('');setLoading(true);setRetry(r=>r+1);}}>Tentar novamente</Button></div>}
  {!loading&&!error&&!items.length&&<p className="text-sm text-muted-foreground">Este produto ainda não foi usado em um artigo. Comece pelo seu primeiro review.</p>}
  <ul className="divide-y">{items.map(a=><li key={a.id} className="py-3 space-y-1">
   <Link className="font-medium text-primary hover:underline" href={`/articles/${a.id}`}>{a.title}</Link>
   <p className="text-xs text-muted-foreground">{{PENDING:'Em revisão',PUBLISHED:'Publicado',REJECTED:'Rejeitado'}[a.status]||a.status} · {new Date(a.date).toLocaleDateString('pt-BR')}</p>
   {a.publishedUrl&&<a className="text-xs text-primary underline" href={a.publishedUrl} target="_blank" rel="noopener noreferrer">Ver post publicado</a>}
  </li>)}</ul>
  {hasMore&&!error&&<Button disabled={loading} variant="outline" onClick={()=>{setLoading(true);setPage(p=>p+1);}}>Carregar mais</Button>}
 </Card>;
}
