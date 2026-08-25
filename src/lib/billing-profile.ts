import { prisma } from "@/lib/prisma";
import { validateCpfCnpj, maskCpfCnpj } from "@/lib/billing-profile-validation";

export { validateCpfCnpj, maskCpfCnpj };

export interface BillingProfileInput {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  province?: string | null;
  city?: string | null;
  state?: string | null;
  providerCustomerId?: string | null;
}

export class BillingProfileService {
  /**
   * Retrieves the BillingProfile for a workspace.
   */
  static async getProfile(workspaceId: string) {
    return prisma.billingProfile.findUnique({
      where: { workspaceId },
    });
  }

  /**
   * Upserts a BillingProfile for a workspace with strict validation.
   */
  static async upsertProfile(workspaceId: string, input: BillingProfileInput) {
    if (!workspaceId || typeof workspaceId !== "string") {
      throw new Error("ID do Workspace é obrigatório.");
    }

    const name = input.name?.trim();
    if (!name) {
      throw new Error("Nome ou Razão Social de cobrança é obrigatório.");
    }

    const email = input.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("E-mail de cobrança válido é obrigatório.");
    }

    const docCheck = validateCpfCnpj(input.cpfCnpj);
    if (!docCheck.valid || !docCheck.formatted) {
      throw new Error(docCheck.error || "CPF/CNPJ de cobrança inválido.");
    }

    // Check workspace existence
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new Error("Workspace não encontrado.");
    }

    // Determine providerCustomerId: preference input, or existing on workspace
    const providerCustId =
      input.providerCustomerId?.trim() || workspace.asaasCustomerId || null;

    const profileData = {
      name,
      cpfCnpj: docCheck.formatted,
      email,
      mobilePhone: input.mobilePhone?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      address: input.address?.trim() || null,
      addressNumber: input.addressNumber?.trim() || null,
      complement: input.complement?.trim() || null,
      province: input.province?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim()?.toUpperCase() || null,
      providerCustomerId: providerCustId,
    };

    const profile = await prisma.billingProfile.upsert({
      where: { workspaceId },
      update: profileData,
      create: {
        workspaceId,
        ...profileData,
      },
    });

    // Keep workspace.asaasCustomerId in sync if providerCustomerId is defined
    if (providerCustId && workspace.asaasCustomerId !== providerCustId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { asaasCustomerId: providerCustId },
      });
    }

    return profile;
  }
}
