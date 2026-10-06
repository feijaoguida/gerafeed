import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ShopeeAffiliateProvider, extractShopeeMetadata, shopeeProductId } from '../../src/lib/affiliate/shopee';
import { SafeUrlResolver } from '../../src/lib/affiliate/resolver';
import { SSRFSecurityError } from '../../src/lib/affiliate/ssrf';
const url='https://shopee.com.br/product/123/456';
const ld='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Produto real',image:'https://img.example.com/a.jpg',offers:{price:'19.90',priceCurrency:'BRL'}})+'</script>';
test('Shopee identity, public metadata, affiliate attribution and manual fallback',async()=>{
 assert.equal(shopeeProductId(url),'123.456');assert.equal(shopeeProductId('https://shopee.com.br/Teste-i.123.456'),'123.456');
 const p=new ShopeeAffiliateProvider(async input=>({initialUrl:input,finalUrl:url,redirectChain:[input,url],statusCode:200,headers:{},body:ld}));
 const input='https://s.shopee.com.br/abc?sub_id=meu_site';
 const result=await p.fetchProductMetadata({affiliateUrl:input});
 assert.equal(result.status,'COMPLETE');assert.equal(result.price,19.9);assert.equal(result.affiliateUrl,input);assert.equal(result.seller,undefined);
 assert.equal(extractShopeeMetadata('<title>Login Shopee</title>',input,url).name,undefined);
 assert.equal(extractShopeeMetadata('<title>Shopee</title>',input,url).status,'PARTIAL');
 assert.equal(extractShopeeMetadata(ld,input,'https://shopee.com.br/login').status,'PARTIAL');
 for(const bad of ['http://localhost/','https://shopee.com.br.evil.com/p','https://user:pass@shopee.com.br/','ftp://shopee.com.br/p','https://shopee.com.br:3000/p']) assert.equal((await p.validateAffiliateUrl(bad)).valid,false);
 const denied=new ShopeeAffiliateProvider(async()=>{throw new SSRFSecurityError('blocked');});
 assert.equal((await denied.fetchProductMetadata({affiliateUrl:input})).status,'FAILED');
 const unavailable=new ShopeeAffiliateProvider(async()=>{throw new Error('network');});
 assert.equal((await unavailable.fetchProductMetadata({affiliateUrl:input})).status,'PARTIAL');
});
test('resolver rejects unsafe redirect, oversized body and body timeout',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1'}});
  await assert.rejects(()=>SafeUrlResolver.resolve('https://93.184.216.34',{allowedHosts:['93.184.216.34']}));
  globalThis.fetch=async()=>new Response('abcdef');
  await assert.rejects(()=>SafeUrlResolver.resolve('https://93.184.216.34',{maxBodyBytes:3}));
  globalThis.fetch=async()=>new Response(new ReadableStream({start(){}}));
  await assert.rejects(()=>SafeUrlResolver.resolve('https://93.184.216.34',{timeoutMs:20}),/Tempo limite/);
 } finally {globalThis.fetch=original;}
});
