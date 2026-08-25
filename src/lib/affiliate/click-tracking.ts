import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface ClickTokenPayload {
  workspaceId: string;
  articleId?: string | null;
  productId?: string | null;
  offerId?: string | null;
  publicationId?: string | null;
  component?: string | null;
  position?: number | null;
  timestamp?: number;
}

export interface RecordClickOptions {
  token?: string;
  payload?: ClickTokenPayload;
}

export class ClickTrackingService {
  private static getSecretKey(): string {
    return (
      process.env.ENCRYPTION_KEY ||
      process.env.NEXTAUTH_SECRET ||
      "news-curator-click-tracking-secret-key-v1"
    );
  }

  /**
   * Generates a tamper-proof, signed, opaque event token for tracking affiliate link clicks.
   */
  static generateEventToken(payload: ClickTokenPayload): string {
    if (!payload.workspaceId) {
      throw new Error("workspaceId é obrigatório para gerar eventToken de clique.");
    }

    const cleanPayload: ClickTokenPayload = {
      workspaceId: payload.workspaceId,
      articleId: payload.articleId || null,
      productId: payload.productId || null,
      offerId: payload.offerId || null,
      publicationId: payload.publicationId || null,
      component: payload.component || null,
      position: typeof payload.position === "number" ? payload.position : null,
      timestamp: payload.timestamp || Date.now(),
    };

    const payloadJson = JSON.stringify(cleanPayload);
    const payloadBase64 = Buffer.from(payloadJson, "utf8").toString("base64url");

    const hmac = crypto.createHmac("sha256", this.getSecretKey());
    hmac.update(payloadBase64);
    const signature = hmac.digest("hex");

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Cryptographically verifies the signed event token and returns its decoded payload.
   * Throws an error if token is malformed or signature validation fails (tampering).
   */
  static verifyEventToken(token: string): ClickTokenPayload {
    if (!token || typeof token !== "string") {
      throw new Error("Token de clique inválido ou não fornecido.");
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      throw new Error("Formato de token de clique inválido.");
    }

    const [payloadBase64, signature] = parts;
    if (!payloadBase64 || !signature || signature.length !== 64 || !/^[0-9a-f]{64}$/i.test(signature)) {
      throw new Error("Componentes do token de clique corrompidos ou formato de assinatura inválido.");
    }

    const hmac = crypto.createHmac("sha256", this.getSecretKey());
    hmac.update(payloadBase64);
    const expectedSignature = hmac.digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      throw new Error("Falha na validação do token de clique: assinatura adulterada ou inválida.");
    }

    try {
      const decodedJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
      const parsed = JSON.parse(decodedJson) as ClickTokenPayload;

      if (!parsed || typeof parsed !== "object" || !parsed.workspaceId) {
        throw new Error("Payload do token de clique inválido.");
      }

      return parsed;
    } catch {
      throw new Error("Falha ao decodificar dados do token de clique.");
    }
  }

  /**
   * Records an affiliate click event into the database.
   * Ensures tenant isolation and non-arbitrary client data by decoding verified token.
   */
  static async recordClick(input: string | ClickTokenPayload, rawToken?: string) {
    let payload: ClickTokenPayload;
    let tokenString: string | null = null;

    if (typeof input === "string") {
      tokenString = input;
      payload = this.verifyEventToken(input);
    } else {
      payload = input;
      tokenString = rawToken || null;
      if (!payload.workspaceId) {
        throw new Error("workspaceId é obrigatório para registrar clique.");
      }
    }

    // Verify workspace existence and active status
    const workspace = await prisma.workspace.findUnique({
      where: { id: payload.workspaceId },
      select: { id: true, active: true },
    });

    if (!workspace) {
      throw new Error("Workspace associado ao clique não foi encontrado.");
    }

    if (!workspace.active) {
      throw new Error("Workspace inativo.");
    }

    // Persist click event with tenant isolation
    const click = await prisma.affiliateClick.create({
      data: {
        workspaceId: payload.workspaceId,
        articleId: payload.articleId || null,
        productId: payload.productId || null,
        offerId: payload.offerId || null,
        publicationId: payload.publicationId || null,
        component: payload.component || null,
        position: typeof payload.position === "number" ? payload.position : null,
        eventToken: tokenString,
      },
    });

    return click;
  }

  /**
   * Generates the client-side non-blocking tracking script for WordPress / HTML renders.
   */
  static getTrackingScript(endpoint = "/api/affiliate/clicks"): string {
    return `<script>
(function(){
  if (window.__nc_tracking_initialized) return;
  window.__nc_tracking_initialized = true;

  document.addEventListener('click', function(event) {
    try {
      var target = event.target;
      var link = target && target.closest ? target.closest('a[data-nc-token]') : null;
      if (!link) return;

      var token = link.getAttribute('data-nc-token');
      if (!token) return;

      var endpointUrl = ${JSON.stringify(endpoint)};
      var payload = JSON.stringify({ token: token });

      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpointUrl, blob);
      } else if (window.fetch) {
        window.fetch(endpointUrl, {
          method: 'POST',
          body: payload,
          keepalive: true,
          headers: { 'Content-Type': 'application/json' }
        }).catch(function() {});
      }
    } catch (e) {
      // Failure is strictly non-blocking: user navigation proceeds unimpeded
    }
  }, true);
})();
</script>`;
  }
}
