import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {prisma} from '../../src/lib/prisma';
import {AFFILIATE_FEATURES} from '../../src/lib/billing';
export async function withTestWorkspace<T>(run:(workspaceId:string)=>Promise<T>):Promise<T>{
 if(!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))throw new Error('Local DB required');
 const slug=`phase30-${randomUUID()}`;
 const features=await prisma.feature.findMany({where:{key:{in:Object.values(AFFILIATE_FEATURES)}}});
 const plan=await prisma.plan.create({data:{name:slug,slug,planFeatures:{create:features.map(f=>({featureId:f.id,enabled:true,limit:100}))}}});
 const ws=await prisma.workspace.create({data:{name:slug,slug,subscription:{create:{planId:plan.id,status:'ACTIVE'}}}});
 try{return await run(ws.id);}finally{await prisma.workspace.delete({where:{id:ws.id}});await prisma.plan.delete({where:{id:plan.id}});}
}
