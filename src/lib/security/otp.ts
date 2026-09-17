import crypto from "crypto";

/**
 * Gera um código OTP numérico de 6 dígitos (100000 a 999999) utilizando geração criptográfica segura.
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
