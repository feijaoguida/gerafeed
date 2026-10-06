import { prisma } from '@/lib/prisma';
import { CanonicalDocument, CanonicalDocumentService } from '@/lib/affiliate/canonical-document';
import { renderCanonicalHtml } from '@/lib/affiliate/render-document';
import { ClickTrackingService } from '@/lib/affiliate/click-tracking';
import { BillingService, AFFILIATE_FEATURES } from '@/lib/billing';
import { AffiliateComplianceService } from './compliance';
export interface RenderOptions { articleId?: string; publicationId?: string; includeTrackingScript?: boolean; }
export class WordPressAffiliateRenderer {
  static async renderToHtml(workspaceId: string, input: CanonicalDocument, options: RenderOptions = {}): Promise<string> {
    const doc=CanonicalDocumentService.validateDocument(input);
    const ids=CanonicalDocumentService.extractReferencedProductIds(doc);
    if(ids.length) await BillingService.assertFeature(workspaceId,AFFILIATE_FEATURES.MODULE,'O módulo de afiliados não está habilitado no seu plano.');
    const products=ids.length?await prisma.product.findMany({where:{workspaceId,id:{in:ids}},include:{offers:{where:{workspaceId,status:'ACTIVE'},orderBy:[{price:'asc'},{id:'asc'}]}}}):[];
    const tracking=ids.length>0 && options.includeTrackingScript!==false && await BillingService.hasFeature(workspaceId,AFFILIATE_FEATURES.ANALYTICS);
    const html=renderCanonicalHtml(doc,products,{
      disclosure:ids.length?await AffiliateComplianceService.getWorkspaceDisclosure(workspaceId):undefined,
      token:tracking?(productId,offerId,occurrence,position)=>ClickTrackingService.generateEventToken({workspaceId,articleId:options.articleId,publicationId:options.publicationId,productId,offerId,component:occurrence,position}):undefined,
    });
    return html+(tracking?ClickTrackingService.getTrackingScript():'');
  }
}
