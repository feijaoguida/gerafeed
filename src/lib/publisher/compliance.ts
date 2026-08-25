import { getConfig, setConfig } from "@/lib/config";

export const DEFAULT_AFFILIATE_DISCLOSURE =
  "Transparência editorial: Ao comprar através dos nossos links, podemos receber uma comissão de afiliado sem qualquer custo adicional para você.";

export class AffiliateComplianceService {
  /**
   * Retrieves the configured affiliate disclosure text for a workspace,
   * falling back to the global default if none is set.
   */
  static async getWorkspaceDisclosure(workspaceId: string): Promise<string> {
    const custom = await getConfig<{ text: string }>("affiliateDisclosure", workspaceId);
    if (custom && typeof custom.text === "string" && custom.text.trim()) {
      return custom.text.trim();
    }
    return DEFAULT_AFFILIATE_DISCLOSURE;
  }

  /**
   * Sets or updates the custom affiliate disclosure text for a workspace.
   */
  static async setWorkspaceDisclosure(workspaceId: string, text: string): Promise<void> {
    await setConfig("affiliateDisclosure", { text: text.trim() }, workspaceId);
  }

  /**
   * Sanitizes and enforces Google & SEO affiliate compliance rules on all <a> tags:
   * 1. Injects or normalizes `rel="sponsored nofollow noopener"` on affiliate links.
   * 2. Injects `target="_blank"` for external navigation safety.
   */
  static enforceLinkCompliance(html: string): string {
    if (!html) return "";

    return html.replace(/<a\s+([^>]*?)>/gi, (_match, attributes) => {
      let attrs = attributes;

      // Ensure rel contains sponsored, nofollow, noopener
      if (/rel=["'][^"']*["']/i.test(attrs)) {
        attrs = attrs.replace(/rel=["']([^"']*)["']/i, (_m: string, relVal: string) => {
          const rels = new Set(relVal.split(/\s+/).filter(Boolean));
          rels.add("sponsored");
          rels.add("nofollow");
          rels.add("noopener");
          return `rel="${Array.from(rels).join(" ")}"`;
        });
      } else {
        attrs += ' rel="sponsored nofollow noopener"';
      }

      // Ensure target="_blank"
      if (/target=["'][^"']*["']/i.test(attrs)) {
        attrs = attrs.replace(/target=["'][^"']*["']/i, 'target="_blank"');
      } else {
        attrs += ' target="_blank"';
      }

      return `<a ${attrs.trim()}>`;
    });
  }
}
