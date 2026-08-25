import * as dns from "node:dns/promises";
import * as net from "node:net";

export class ResolverError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ResolverError";
  }
}

export class SSRFSecurityError extends ResolverError {
  constructor(message: string) {
    super(message, "SSRF_SECURITY_VIOLATION");
    this.name = "SSRFSecurityError";
  }
}

export class InvalidHostError extends ResolverError {
  constructor(message: string) {
    super(message, "INVALID_HOST");
    this.name = "InvalidHostError";
  }
}

export class MaxRedirectsExceededError extends ResolverError {
  constructor(message: string) {
    super(message, "MAX_REDIRECTS_EXCEEDED");
    this.name = "MaxRedirectsExceededError";
  }
}

export class ResolverTimeoutError extends ResolverError {
  constructor(message: string) {
    super(message, "RESOLVER_TIMEOUT");
    this.name = "ResolverTimeoutError";
  }
}

/**
 * Checks if an IPv4 or IPv6 address is in a private, loopback, link-local or reserved range.
 */
export function isPrivateIp(ip: string): boolean {
  const cleanIp = ip.trim().toLowerCase();

  // IPv4 mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (cleanIp.startsWith("::ffff:")) {
    const v4 = cleanIp.slice(7);
    if (net.isIPv4(v4)) {
      return isPrivateIp(v4);
    }
  }

  // IPv6 checks
  if (net.isIPv6(cleanIp)) {
    if (cleanIp === "::1" || cleanIp === "::") return true;
    // fc00::/7 - Unique Local Addresses
    if (cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) return true;
    // fe80::/10 - Link-local
    if (cleanIp.startsWith("fe8") || cleanIp.startsWith("fe9") || cleanIp.startsWith("fea") || cleanIp.startsWith("feb")) return true;
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private network)
    if (a === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local, AWS/GCP metadata)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private network 172.16.0.0 – 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (Private network)
    if (a === 192 && b === 168) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  // If not recognized as valid IPv4 or IPv6, consider dangerous
  return true;
}

/**
 * Validates a hostname and its resolved DNS records against SSRF.
 */
export async function validateHostForSSRF(hostname: string, allowedHosts?: string[]): Promise<void> {
  const cleanHost = hostname.trim().toLowerCase();

  if (!cleanHost) {
    throw new InvalidHostError("Hostname vazio ou ausente.");
  }

  // Block obvious localhost aliases
  if (
    cleanHost === "localhost" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".internal") ||
    cleanHost === "0.0.0.0" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "::1"
  ) {
    throw new SSRFSecurityError(`Acesso bloqueado ao host local: ${cleanHost}`);
  }

  // Check allowlist if provided
  if (allowedHosts && allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some((allowed) => {
      const cleanAllowed = allowed.trim().toLowerCase();
      return cleanHost === cleanAllowed || cleanHost.endsWith(`.${cleanAllowed}`);
    });

    if (!isAllowed) {
      throw new InvalidHostError(
        `O host '${cleanHost}' não pertence à lista de domínios permitidos para este provedor.`
      );
    }
  }

  // If hostname is directly an IP address
  if (net.isIP(cleanHost)) {
    if (isPrivateIp(cleanHost)) {
      throw new SSRFSecurityError(`Acesso bloqueado ao endereço IP privado/reservado: ${cleanHost}`);
    }
    return;
  }

  // DNS lookup to verify resolved IP addresses
  try {
    const addresses = await dns.lookup(cleanHost, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new InvalidHostError(`Não foi possível resolver o DNS para o host: ${cleanHost}`);
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new SSRFSecurityError(
          `O host '${cleanHost}' resolve para um endereço IP privado/reservado bloqueado (${record.address}).`
        );
      }
    }
  } catch (error) {
    if (error instanceof ResolverError) throw error;
    throw new InvalidHostError(`Falha na resolução de DNS para '${cleanHost}': ${(error as Error).message}`);
  }
}
