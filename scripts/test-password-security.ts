import { hashPassword, verifyPassword } from "../src/lib/security/password";

async function main() {
  console.log("--- Testando Segurança de Senhas (Task 241) ---");

  // 1. Senha curta deve falhar
  try {
    await hashPassword("123");
    throw new Error("Deveria ter falhado para senha com menos de 6 caracteres!");
  } catch (err) {
    if (err instanceof Error && err.message.includes("mínimo 6 caracteres")) {
      console.log("Validação de tamanho mínimo: OK");
    } else {
      throw err;
    }
  }

  // 2. Hash com SALT
  const plain = "MinhaSenhaForte@2026";
  const hash = await hashPassword(plain);
  console.log("Hash gerado:", hash);

  if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$")) {
    throw new Error("Hash não é do formato bcrypt válido!");
  }
  console.log("Formato bcrypt: OK");

  // 3. Verificação com senha correta
  const isMatch = await verifyPassword(plain, hash);
  if (!isMatch) {
    throw new Error("verifyPassword deveria ter retornado true para a senha correta!");
  }
  console.log("verifyPassword (correta): OK");

  // 4. Verificação com senha incorreta
  const isWrong = await verifyPassword("SenhaErrada123", hash);
  if (isWrong) {
    throw new Error("verifyPassword deveria ter retornado false para senha incorreta!");
  }
  console.log("verifyPassword (incorreta): OK");

  // 5. Casos de borda
  const emptyMatch = await verifyPassword("", hash);
  const nullHash = await verifyPassword(plain, null);
  if (emptyMatch || nullHash) {
    throw new Error("verifyPassword falhou nos casos de borda vazios!");
  }
  console.log("verifyPassword (casos de borda): OK");

  console.log("Todos os testes da Task 241 passaram com sucesso!");
}

main().catch((err) => {
  console.error("Erro no teste da Task 241:", err);
  process.exit(1);
});
