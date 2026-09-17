import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Gera um hash criptograficamente seguro utilizando bcrypt com fator de custo (SALT_ROUNDS = 10).
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || plainText.length < 6) {
    throw new Error("A senha deve conter no mínimo 6 caracteres.");
  }
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Verifica se a senha em texto plano confere com o hash armazenado.
 */
export async function verifyPassword(plainText: string, hash: string | null | undefined): Promise<boolean> {
  if (!plainText || !hash) {
    return false;
  }
  return bcrypt.compare(plainText, hash);
}
