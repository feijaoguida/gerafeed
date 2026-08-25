import {
  validateHostForSSRF,
  ResolverError,
  MaxRedirectsExceededError,
  ResolverTimeoutError,
} from "./ssrf";

export interface SafeResolverOptions {
  allowedHosts?: string[];
  maxRedirects?: number;
  timeoutMs?: number;
  maxBodyBytes?: number;
  method?: "GET" | "HEAD";
  userAgent?: string;
}

export interface SafeResolverResult {
  initialUrl: string;
  finalUrl: string;
  redirectChain: string[];
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
}

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const GOOGLEBOT_USER_AGENT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

export class SafeUrlResolver {
  /**
   * Safely resolves a URL through all its redirects with SSRF protection on every hop.
   */
  static async resolve(
    initialUrl: string,
    options: SafeResolverOptions = {}
  ): Promise<SafeResolverResult> {
    const maxRedirects = options.maxRedirects ?? 5;
    const timeoutMs = options.timeoutMs ?? 8000;
    const maxBodyBytes = options.maxBodyBytes ?? 2 * 1024 * 1024;
    const method = options.method ?? "GET";

    let currentUrl = initialUrl.trim();
    const redirectChain: string[] = [currentUrl];
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        throw new ResolverError(`URL inválida no passo ${redirectCount}: ${currentUrl}`, "INVALID_URL");
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new ResolverError(
          `Protocolo não permitido '${parsed.protocol}'. Apenas HTTP e HTTPS são suportados.`,
          "INVALID_PROTOCOL"
        );
      }

      // SSRF & Host Allowlist Validation on every hop
      await validateHostForSSRF(parsed.hostname, options.allowedHosts);

      // Select User-Agent: override or auto-detect (Googlebot for product PDPs, Desktop for shortlinks)
      const userAgent =
        options.userAgent ||
        (parsed.hostname.includes("produto.mercadolivre.com.br") || parsed.pathname.includes("/p/MLB")
          ? GOOGLEBOT_USER_AGENT
          : DESKTOP_USER_AGENT);

      // Perform request with timeout
      let response: Response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        response = await fetch(currentUrl, {
          method,
          redirect: "manual", // Do NOT follow automatically, validate each step
          signal: controller.signal,
          headers: {
            "User-Agent": userAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError" || controller.signal.aborted) {
          throw new ResolverTimeoutError(`Tempo limite de ${timeoutMs}ms excedido ao resolver '${currentUrl}'.`);
        }
        throw new ResolverError(`Erro de rede ao acessar '${currentUrl}': ${(error as Error).message}`, "NETWORK_ERROR");
      } finally {
        clearTimeout(timeoutId);
      }

      const status = response.status;
      const isRedirect = [301, 302, 303, 307, 308].includes(status);

      if (isRedirect) {
        const location = response.headers.get("location");
        if (!location) {
          throw new ResolverError(
            `Resposta de redirecionamento (${status}) sem cabeçalho 'Location' em '${currentUrl}'.`,
            "MISSING_LOCATION_HEADER"
          );
        }

        // Resolve relative redirect URL
        let nextUrl: string;
        try {
          nextUrl = new URL(location, currentUrl).toString();
        } catch {
          throw new ResolverError(`Redirecionamento para URL inválida: ${location}`, "INVALID_REDIRECT_URL");
        }

        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new MaxRedirectsExceededError(
            `Número máximo de redirecionamentos excedido (${maxRedirects}).`
          );
        }

        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        continue;
      }

      // Convert response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key.toLowerCase()] = val;
      });

      let body: string | undefined;
      if (method === "GET") {
        // Read body with size limit
        const reader = response.body?.getReader();
        if (reader) {
          const chunks: Uint8Array[] = [];
          let receivedBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              receivedBytes += value.length;
              if (receivedBytes > maxBodyBytes) {
                reader.cancel();
                throw new ResolverError(
                  `O tamanho da resposta excedeu o limite máximo de ${maxBodyBytes} bytes.`,
                  "MAX_BODY_EXCEEDED"
                );
              }
              chunks.push(value);
            }
          }

          const concatenated = new Uint8Array(receivedBytes);
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }

          const decoder = new TextDecoder("utf-8");
          body = decoder.decode(concatenated);
        }
      }

      return {
        initialUrl,
        finalUrl: currentUrl,
        redirectChain,
        statusCode: status,
        headers: responseHeaders,
        body,
      };
    }

    throw new MaxRedirectsExceededError(`Número máximo de redirecionamentos excedido (${maxRedirects}).`);
  }
}
