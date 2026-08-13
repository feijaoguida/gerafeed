import "dotenv/config";
import { encrypt, decrypt } from "../src/lib/crypto";

async function main() {
  console.log("=== RUNNING ENCRYPTION HELPER TESTS ===");

  const secretPlaintext = "sk-proj-1234567890abcdef-secret-key";

  // 1. Test Round-trip
  console.log("Testing round-trip encryption/decryption...");
  const encrypted = encrypt(secretPlaintext);
  console.log("✓ Encrypted format:", encrypted);

  if (!encrypted.startsWith("v1:")) {
    throw new Error("FAILED: Encrypted string does not start with version prefix 'v1:'.");
  }

  const decrypted = decrypt(encrypted);
  if (decrypted !== secretPlaintext) {
    throw new Error("FAILED: Decrypted text does not match original plaintext.");
  }
  console.log("✓ Round-trip test passed: Decrypted text matches original plaintext perfectly.");

  // 2. Test Unique IV / Nonce per encryption call
  console.log("Testing fresh IV/nonce generation per encryption...");
  const encrypted1 = encrypt(secretPlaintext);
  const encrypted2 = encrypt(secretPlaintext);

  if (encrypted1 === encrypted2) {
    throw new Error("FAILED: Encrypting same plaintext twice produced identical ciphertexts! IV is not unique.");
  }

  const parts1 = encrypted1.split(":");
  const parts2 = encrypted2.split(":");

  if (parts1[1] === parts2[1]) {
    throw new Error("FAILED: Random IVs were identical across invocations!");
  }

  // Ensure both decrypt back to the same plaintext
  if (decrypt(encrypted1) !== secretPlaintext || decrypt(encrypted2) !== secretPlaintext) {
    throw new Error("FAILED: Nonce-variant ciphertexts failed to decrypt.");
  }
  console.log("✓ Nonce test passed: Two encryptions of same plaintext produced different IVs and ciphertexts.");

  // 3. Test Tamper Detection (Authentication Tag failure)
  console.log("Testing tamper detection (integrity check failure on modified ciphertext)...");
  const validParts = encrypted.split(":");
  // Tamper with the ciphertext payload (change last character)
  const tamperedCiphertextHex = validParts[2].slice(0, -1) + (validParts[2].slice(-1) === "a" ? "b" : "a");
  const tamperedPayload = `${validParts[0]}:${validParts[1]}:${tamperedCiphertextHex}:${validParts[3]}`;

  let tamperCaught = false;
  try {
    decrypt(tamperedPayload);
  } catch (err) {
    tamperCaught = true;
    console.log("✓ Tamper error caught as expected:", (err as Error).message);
  }

  if (!tamperCaught) {
    throw new Error("FAILED: Decrypting tampered payload did not throw integrity error!");
  }
  console.log("✓ Tamper test passed: Modified ciphertext was rejected by GCM authentication tag.");

  // 4. Test Invalid Key Decryption Failure
  console.log("Testing decryption failure with different key...");
  let keyMismatchCaught = false;
  try {
    decrypt(encrypted, "different_secret_key_32bytes_long!");
  } catch (err) {
    keyMismatchCaught = true;
    console.log("✓ Key mismatch error caught as expected:", (err as Error).message);
  }

  if (!keyMismatchCaught) {
    throw new Error("FAILED: Decryption with wrong key succeeded!");
  }
  console.log("✓ Key mismatch test passed.");

  console.log("=== ENCRYPTION HELPER TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main().catch((err) => {
  console.error("Crypto test failed:", err);
  process.exit(1);
});
