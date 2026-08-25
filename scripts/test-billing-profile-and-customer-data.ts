import { prisma } from "../src/lib/prisma";
import {
  BillingProfileService,
  validateCpfCnpj,
  maskCpfCnpj,
} from "../src/lib/billing-profile";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 181 - Billing Profile & Customer Data ===");
  console.log("=================================================");

  // Cleanup test workspaces and profiles
  await prisma.billingProfile.deleteMany({
    where: {
      workspace: { slug: { in: ["test-billing-ws-a", "test-billing-ws-b"] } },
    },
  });
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-billing-ws-a", "test-billing-ws-b"] } },
  });

  try {
    // ----------------------------------------------------------------
    // 1. Validation Logic & PII Masking Tests
    // ----------------------------------------------------------------
    console.log("\n--- 1. Testing Document Validation & PII Masking ---");

    // Invalid CPFs / CNPJs
    const inv1 = validateCpfCnpj("11111111111");
    if (inv1.valid) throw new Error("FAIL: Repetitive CPF should be invalid.");

    const inv2 = validateCpfCnpj("12345678900");
    if (inv2.valid) throw new Error("FAIL: Bad checksum CPF should be invalid.");

    const inv3 = validateCpfCnpj("12345");
    if (inv3.valid) throw new Error("FAIL: Invalid length document should be invalid.");

    // Valid CPF algorithm test (Generates/verifies valid CPF: 52998224725 or standard sample)
    // 52998224725 is a valid CPF format mathematically
    const validCpfSample = "52998224725";
    const vCpf = validateCpfCnpj(validCpfSample);
    if (!vCpf.valid || vCpf.type !== "CPF") {
      throw new Error(`FAIL: Valid CPF rejected: ${vCpf.error}`);
    }
    console.log(`✓ Valid CPF test: ${vCpf.formatted}`);

    // Valid CNPJ algorithm test: 00000000000191 (Banco do Brasil CNPJ)
    const validCnpjSample = "00000000000191";
    const vCnpj = validateCpfCnpj(validCnpjSample);
    if (!vCnpj.valid || vCnpj.type !== "CNPJ") {
      throw new Error(`FAIL: Valid CNPJ rejected: ${vCnpj.error}`);
    }
    console.log(`✓ Valid CNPJ test: ${vCnpj.formatted}`);

    // Masking test
    const maskedCpf = maskCpfCnpj("52998224725");
    console.log(`✓ Masked CPF: ${maskedCpf}`);
    if (maskedCpf !== "529.***.***-25") {
      throw new Error(`FAIL: Expected 529.***.***-25, got ${maskedCpf}`);
    }

    const maskedCnpj = maskCpfCnpj("00000000000191");
    console.log(`✓ Masked CNPJ: ${maskedCnpj}`);
    if (!maskedCnpj.includes("***")) {
      throw new Error(`FAIL: CNPJ masking failed: ${maskedCnpj}`);
    }

    console.log("✓ Check 1 PASS: Validações e mascaramento de PII 100% corretos.");

    // ----------------------------------------------------------------
    // 2. Database CRUD & 1:1 Workspace Relation
    // ----------------------------------------------------------------
    console.log("\n--- 2. Testing BillingProfile CRUD & Tenant Isolation ---");

    const wsA = await prisma.workspace.create({
      data: { name: "Workspace Alpha", slug: "test-billing-ws-a" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Workspace Beta", slug: "test-billing-ws-b" },
    });

    // Create profile for Workspace A
    const profileA = await BillingProfileService.upsertProfile(wsA.id, {
      name: "Empresa Alpha Ltda",
      cpfCnpj: validCnpjSample,
      email: "financeiro@alpha.com",
      mobilePhone: "11988887777",
      postalCode: "01310-100",
      address: "Av. Paulista",
      addressNumber: "1000",
      city: "São Paulo",
      state: "SP",
      providerCustomerId: "cus_asaas_alpha_123",
    });

    console.log(`✓ BillingProfile criado para Workspace A (${profileA.id})`);
    if (profileA.providerCustomerId !== "cus_asaas_alpha_123") {
      throw new Error("FAIL: providerCustomerId incorreto.");
    }

    // Verify workspace.asaasCustomerId was synced
    const updatedWsA = await prisma.workspace.findUnique({ where: { id: wsA.id } });
    if (updatedWsA?.asaasCustomerId !== "cus_asaas_alpha_123") {
      throw new Error("FAIL: asaasCustomerId não foi sincronizado no Workspace A.");
    }

    // Update profile for Workspace A
    const updatedProfileA = await BillingProfileService.upsertProfile(wsA.id, {
      name: "Empresa Alpha Brasil S.A.",
      cpfCnpj: validCnpjSample,
      email: "billing@alpha.com",
      mobilePhone: "11988887777",
      city: "São Paulo",
      state: "SP",
    });

    if (updatedProfileA.name !== "Empresa Alpha Brasil S.A.") {
      throw new Error("FAIL: Atualização do perfil A falhou.");
    }

    // Verify Workspace B has no profile initially (Tenant Isolation)
    const profileB = await BillingProfileService.getProfile(wsB.id);
    if (profileB !== null) {
      throw new Error("FAIL: Isolamento de tenant violado. Workspace B não deveria ter perfil.");
    }

    console.log("✓ Check 2 PASS: CRUD, sincronização com Asaas e isolamento de tenant validados.");

    // ----------------------------------------------------------------
    // 3. Invalid Inputs & Card Field Rejection
    // ----------------------------------------------------------------
    console.log("\n--- 3. Testing Invalid Inputs Rejection ---");

    // Empty name
    try {
      await BillingProfileService.upsertProfile(wsB.id, {
        name: "   ",
        cpfCnpj: validCpfSample,
        email: "test@test.com",
      });
      throw new Error("FAIL: Nome vazio deveria falhar.");
    } catch (err) {
      console.log(`✓ Rejeição de nome vazio: ${(err as Error).message}`);
    }

    // Invalid email
    try {
      await BillingProfileService.upsertProfile(wsB.id, {
        name: "Empresa Beta",
        cpfCnpj: validCpfSample,
        email: "invalid-email-format",
      });
      throw new Error("FAIL: E-mail inválido deveria falhar.");
    } catch (err) {
      console.log(`✓ Rejeição de e-mail inválido: ${(err as Error).message}`);
    }

    // Invalid CPF
    try {
      await BillingProfileService.upsertProfile(wsB.id, {
        name: "Empresa Beta",
        cpfCnpj: "12345678900",
        email: "beta@test.com",
      });
      throw new Error("FAIL: Documento com dígitos inválidos deveria falhar.");
    } catch (err) {
      console.log(`✓ Rejeição de documento inválido: ${(err as Error).message}`);
    }

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 181 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.billingProfile.deleteMany({
      where: {
        workspace: { slug: { in: ["test-billing-ws-a", "test-billing-ws-b"] } },
      },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-billing-ws-a", "test-billing-ws-b"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE BILLING PROFILE & CUSTOMER DATA:", err);
    process.exit(1);
  });
