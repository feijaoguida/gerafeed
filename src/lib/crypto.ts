import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const VERSION_PREFIX = "v1";
const CONTEXT_SALT = Buffer.from("news-curator-v1-salt", "utf-8");

/**
 * Derives a 32-byte key from ENCRYPTION_KEY using scryptSync and a fixed version salt.
 */
function getDerivedKey(overrideKey?: string): Buffer {
  const secretKey = overrideKey || process.env.ENCRYPTION_KEY;
  if (!secretKey) {
    throw new Error(
      "A variável de ambiente ENCRYPTION_KEY não está definida."
    );
  }

  // Derive 32-byte key using scryptSync with fixed version context salt
  return crypto.scryptSync(secretKey, CONTEXT_SALT, 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a fresh random IV.
 * Returns versioned string format: `v1:iv_hex:ciphertext_hex:auth_tag_hex`
 */
export function encrypt(plaintext: string, overrideKey?: string): string {
  if (plaintext === null || plaintext === undefined) return "";
  if (plaintext === "") return "";

  const key = getDerivedKey(overrideKey);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  const ivHex = iv.toString("hex");

  return `${VERSION_PREFIX}:${ivHex}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a versioned AES-256-GCM ciphertext string (`v1:iv_hex:ciphertext_hex:auth_tag_hex`).
 * Throws an error if payload is corrupted or authentication tag verification fails (tampering detected).
 */
export function decrypt(versionedCiphertext: string, overrideKey?: string): string {
  if (!versionedCiphertext) return "";

  const parts = versionedCiphertext.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Formato de texto criptografado inválido ou versão não suportada.");
  }

  const [, ivHex, encryptedHex, authTagHex] = parts;

  const key = getDerivedKey(overrideKey);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Formato de metadados IV/AuthTag corrompido.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    throw new Error("Falha na descriptografia: dados adulterados ou chave de criptografia inválida.");
  }
}
