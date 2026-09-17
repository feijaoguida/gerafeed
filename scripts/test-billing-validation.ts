import {
  isValidCPF,
  isValidCNPJ,
  isValidDocument,
  formatCPFOrCNPJ,
  formatPhone,
  formatCEP,
} from "../src/lib/validation/cpf-cnpj";

async function main() {
  console.log("--- Testando Validações Fiscais e Formatações (Task 245) ---");

  // 1. CPF Validação
  const validCpf = "52998224725"; // CPF válido com dígitos verificadores matemáticos
  const invalidCpf = "11111111111"; // CPF repetido (inválido)
  const corruptCpf = "52998224729"; // Dígito final errado

  if (!isValidCPF(validCpf)) {
    throw new Error(`CPF válido ${validCpf} foi rejeitado!`);
  }
  console.log("CPF válido: OK");

  if (isValidCPF(invalidCpf) || isValidCPF(corruptCpf)) {
    throw new Error("CPF inválido foi incorretamente aceito!");
  }
  console.log("Rejeição de CPFs inválidos: OK");

  // 2. CNPJ Validação
  const validCnpj = "11222333000181"; // CNPJ com dígitos verificadores matemáticos
  const invalidCnpj = "00000000000000";

  if (!isValidCNPJ(validCnpj)) {
    throw new Error(`CNPJ válido ${validCnpj} foi rejeitado!`);
  }
  console.log("CNPJ válido: OK");

  if (isValidCNPJ(invalidCnpj)) {
    throw new Error("CNPJ inválido foi aceito!");
  }
  console.log("Rejeição de CNPJ inválido: OK");

  // 3. Validador Unificado
  if (!isValidDocument(validCpf) || !isValidDocument(validCnpj)) {
    throw new Error("isValidDocument falhou para documentos legítimos!");
  }
  console.log("isValidDocument: OK");

  // 4. Formatações
  const formattedCpf = formatCPFOrCNPJ(validCpf);
  if (formattedCpf !== "529.982.247-25") {
    throw new Error(`Formatação de CPF incorreta: ${formattedCpf}`);
  }
  console.log("Máscara CPF: OK (", formattedCpf, ")");

  const formattedCnpj = formatCPFOrCNPJ(validCnpj);
  if (formattedCnpj !== "11.222.333/0001-81") {
    throw new Error(`Formatação de CNPJ incorreta: ${formattedCnpj}`);
  }
  console.log("Máscara CNPJ: OK (", formattedCnpj, ")");

  const formattedPhone = formatPhone("11987654321");
  if (formattedPhone !== "(11) 98765-4321") {
    throw new Error(`Formatação de telefone incorreta: ${formattedPhone}`);
  }
  console.log("Máscara Telefone: OK (", formattedPhone, ")");

  const formattedCep = formatCEP("01310100");
  if (formattedCep !== "01310-100") {
    throw new Error(`Formatação de CEP incorreta: ${formattedCep}`);
  }
  console.log("Máscara CEP: OK (", formattedCep, ")");

  console.log("Todos os testes da Task 245 passaram com sucesso!");
}

main().catch((err) => {
  console.error("Erro no teste da Task 245:", err);
  process.exit(1);
});
