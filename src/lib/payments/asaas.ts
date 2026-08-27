import { PaymentGateway } from "./PaymentGateway";
import {
  CreateCustomerParams,
  CustomerResult,
  CustomerDTO,
  CreateSubscriptionParams,
  SubscriptionResult,
  CheckoutParams,
  WebhookEventResult,
  WebhookEventType,
  PaymentProviderType,
  PaymentProviderCapabilities,
} from "./types";
import { prisma } from "@/lib/prisma";

export interface AsaasConfig {
  apiKey?: string;
  baseUrl?: string;
  webhookToken?: string;
}

export class AsaasGateway implements PaymentGateway {
  readonly provider: PaymentProviderType = "asaas";
  readonly capabilities: PaymentProviderCapabilities = {
    customer: true,
    checkout: true,
    subscription: true,
    payments: true,
    webhooks: true,
  };

  private apiKey: string;
  private baseUrl: string;
  private webhookToken: string;

  constructor(config?: AsaasConfig) {
    this.apiKey = config?.apiKey !== undefined ? config.apiKey : (process.env.ASAAS_API_KEY || "");
    const isProd = process.env.ASAAS_ENVIRONMENT === "production";
    this.baseUrl =
      config?.baseUrl ||
      process.env.ASAAS_API_URL ||
      (isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/v3");
    this.webhookToken = config?.webhookToken || process.env.ASAAS_WEBHOOK_TOKEN || "";
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      access_token: this.apiKey,
    };
  }

  private normalizeError(errorMsg: string): Error {
    return new Error(`[Asaas] ${errorMsg}`);
  }

  /**
   * Retrieves a normalized customer DTO by customerId.
   */
  async getCustomer(customerId: string): Promise<CustomerDTO | null> {
    if (!this.apiKey || !customerId) return null;

    try {
      const res = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!res.ok) return null;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return null;

      const data = await res.json();

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        phone: data.mobilePhone || data.phone,
        externalReference: data.externalReference,
        provider: "asaas",
      };
    } catch {
      return null;
    }
  }

  /**
   * Creates a new customer on Asaas.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    const cleanDoc = params.cpfCnpj ? params.cpfCnpj.replace(/\D/g, "") : undefined;

    const payload = {
      name: params.name,
      email: params.email,
      cpfCnpj: cleanDoc,
      mobilePhone: params.phone,
      postalCode: params.postalCode?.replace(/\D/g, ""),
      address: params.address,
      addressNumber: params.addressNumber,
      complement: params.complement,
      province: params.province,
      externalReference: params.workspaceId,
    };

    const res = await fetch(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    let data: Record<string, unknown> = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const errors = data?.errors as Array<{ description?: string }> | undefined;
      const errorMsg = errors?.[0]?.description || `Erro HTTP ${res.status} ao criar cliente no Asaas`;
      throw this.normalizeError(errorMsg);
    }

    const customerId = (data.id as string) || `cus_${Date.now()}`;

    // Persist providerCustomerId to Workspace and BillingProfile if workspaceId provided
    if (params.workspaceId) {
      await this.persistCustomerId(params.workspaceId, customerId);
    }

    return {
      customerId,
      provider: "asaas",
      created: true,
    };
  }

  /**
   * Idempotently ensures customer exists on Asaas.
   * Reconciliation Flow:
   * 1. If providerCustomerId / workspace.asaasCustomerId exists, verify & update.
   * 2. Search Asaas by externalReference (workspaceId).
   * 3. Search Asaas by cpfCnpj.
   * 4. If not found, create new.
   */
  async ensureCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    const workspaceId = params.workspaceId;

    // Check database for existing providerCustomerId
    let existingCustomerId = params.providerCustomerId;
    if (!existingCustomerId && workspaceId) {
      const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      const bp = await (prisma as unknown as { billingProfile: { findUnique: (args: unknown) => Promise<{ providerCustomerId?: string | null } | null> } }).billingProfile.findUnique({
        where: { workspaceId },
      });
      existingCustomerId = bp?.providerCustomerId || ws?.asaasCustomerId || undefined;
    }

    // 1. If existing ID is present, verify on Asaas or adopt cleanly
    if (existingCustomerId) {
      if (this.apiKey) {
        const existing = await this.getCustomer(existingCustomerId);
        if (existing) {
          await this.updateCustomerDetails(existingCustomerId, params);
        }
      }
      if (workspaceId) await this.persistCustomerId(workspaceId, existingCustomerId);
      return { customerId: existingCustomerId, provider: "asaas", updated: true };
    }

    // 2. Search Asaas by externalReference
    if (workspaceId && this.apiKey) {
      const foundByRef = await this.searchCustomers({ externalReference: workspaceId });
      if (foundByRef.length > 0) {
        const targetId = foundByRef[0].id;
        await this.updateCustomerDetails(targetId, params);
        await this.persistCustomerId(workspaceId, targetId);
        return { customerId: targetId, provider: "asaas", updated: true };
      }
    }

    // 3. Search Asaas by clean CPF/CNPJ
    if (params.cpfCnpj && this.apiKey) {
      const cleanDoc = params.cpfCnpj.replace(/\D/g, "");
      const foundByDoc = await this.searchCustomers({ cpfCnpj: cleanDoc });
      if (foundByDoc.length > 0) {
        const targetId = foundByDoc[0].id;
        await this.updateCustomerDetails(targetId, params);
        if (workspaceId) await this.persistCustomerId(workspaceId, targetId);
        return { customerId: targetId, provider: "asaas", updated: true };
      }
    }

    // 4. Create new customer
    return this.createCustomer(params);
  }

  private async searchCustomers(query: { externalReference?: string; cpfCnpj?: string }) {
    if (!this.apiKey) return [];

    try {
      const params = new URLSearchParams();
      if (query.externalReference) params.append("externalReference", query.externalReference);
      if (query.cpfCnpj) params.append("cpfCnpj", query.cpfCnpj);

      const res = await fetch(`${this.baseUrl}/customers?${params.toString()}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!res.ok) return [];
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return [];

      const data = await res.json();
      return data?.data || [];
    } catch {
      return [];
    }
  }

  private async updateCustomerDetails(customerId: string, params: CreateCustomerParams) {
    if (!this.apiKey || !customerId) return;

    try {
      const cleanDoc = params.cpfCnpj ? params.cpfCnpj.replace(/\D/g, "") : undefined;
      const payload = {
        name: params.name,
        email: params.email,
        cpfCnpj: cleanDoc,
        mobilePhone: params.phone,
        postalCode: params.postalCode?.replace(/\D/g, ""),
        address: params.address,
        addressNumber: params.addressNumber,
        complement: params.complement,
        province: params.province,
        externalReference: params.workspaceId,
      };

      await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-fatal update error
    }
  }

  private async persistCustomerId(workspaceId: string, customerId: string) {
    try {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { asaasCustomerId: customerId },
      });

      await (prisma as unknown as { billingProfile: { updateMany: (args: unknown) => Promise<unknown> } }).billingProfile.updateMany({
        where: { workspaceId },
        data: { providerCustomerId: customerId },
      });
    } catch {
      // Non-fatal persistence error
    }
  }

  /**
   * Creates a subscription in Asaas.
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const formattedDueDate = nextDueDate.toISOString().split("T")[0];

    const payload = {
      customer: params.customerId,
      billingType: params.billingType || "UNDEFINED",
      value: params.price,
      nextDueDate: formattedDueDate,
      cycle: params.cycle || "MONTHLY",
      description: `Assinatura News Curator - ${params.planName}`,
      externalReference: params.workspaceId,
    };

    const res = await fetch(`${this.baseUrl}/subscriptions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    let data: Record<string, unknown> = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const errors = data?.errors as Array<{ description?: string }> | undefined;
      const errorMsg = errors?.[0]?.description || `Erro HTTP ${res.status} ao criar assinatura no Asaas`;
      throw this.normalizeError(errorMsg);
    }

    let invoiceUrl: string | undefined = undefined;
    let paymentUrl: string | undefined = undefined;

    try {
      const subId = data.id as string;
      if (subId) {
        const paymentsRes = await fetch(`${this.baseUrl}/subscriptions/${subId}/payments?limit=1`, {
          method: "GET",
          headers: this.getHeaders(),
        });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const firstPayment = paymentsData?.data?.[0];
          if (firstPayment?.invoiceUrl) {
            invoiceUrl = firstPayment.invoiceUrl;
            paymentUrl = invoiceUrl;
          } else if (firstPayment?.invoiceUrl === undefined && firstPayment?.bankSlipUrl) {
            invoiceUrl = firstPayment.bankSlipUrl;
            paymentUrl = invoiceUrl;
          }
        }
      }
    } catch {
      // Ignora erro no fetch do payment e usa default da assinatura se houver
    }

    if (!paymentUrl) {
       paymentUrl = (data.paymentLink as string) || undefined;
    }

    return {
      subscriptionId: (data.id as string) || `sub_${Date.now()}`,
      status: data.status === "ACTIVE" ? "ACTIVE" : "PENDING",
      paymentUrl,
      invoiceUrl,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate as string) : undefined,
      raw: data,
    };
  }

  /**
   * Generates a payment link or hosted checkout URL.
   */
  async getCheckoutUrl(params: CheckoutParams): Promise<string> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    if (params.customerId && params.amount !== undefined && params.planId && params.planName) {
      // Prioritize creating a subscription to get the invoice URL
      try {
        const sub = await this.createSubscription({
          workspaceId: params.workspaceId,
          customerId: params.customerId,
          planId: params.planId,
          planSlug: params.planSlug,
          planName: params.planName,
          price: params.amount,
          billingType: "UNDEFINED",
          cycle: params.cycle || "MONTHLY",
        });

        if (sub.paymentUrl) {
          return sub.paymentUrl;
        }
      } catch (error) {
        throw this.normalizeError(`Falha ao criar assinatura para checkout: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Fallback: create a payment link
    const res = await fetch(`${this.baseUrl}/paymentLinks`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: `News Curator - Plano ${params.planName || params.planSlug.toUpperCase()}`,
        billingType: "UNDEFINED",
        chargeType: "RECURRENT",
        value: params.amount,
        subscriptionCycle: params.cycle || "MONTHLY",
        externalReference: params.workspaceId,
        callback: {
          successUrl: params.successUrl || "/dashboard",
          autoRedirect: true,
        },
      }),
    });

    let data: Record<string, unknown> = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const errors = data?.errors as Array<{ description?: string }> | undefined;
      const errorMsg = errors?.[0]?.description || `Erro HTTP ${res.status} ao gerar link de pagamento no Asaas`;
      throw this.normalizeError(errorMsg);
    }

    const url = (data.url as string) || "";
    if (!url) {
      throw this.normalizeError("O gateway de pagamento não retornou a URL do checkout.");
    }

    return url;
  }

  /**
   * Cancels a subscription in Asaas.
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      let data: Record<string, unknown> = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }
      const errors = data?.errors as Array<{ description?: string }> | undefined;
      const errorMsg = errors?.[0]?.description || `Erro HTTP ${res.status} ao cancelar assinatura no Asaas`;
      throw this.normalizeError(errorMsg);
    }

    return true;
  }

  /**
   * Parses and validates Asaas webhook payloads.
   */
  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<WebhookEventResult> {
    if (this.webhookToken && headers) {
      const token = headers["asaas-access-token"] || headers["access_token"];
      if (token !== this.webhookToken) {
        throw this.normalizeError("Token de autenticação do Webhook Asaas inválido.");
      }
    }

    const raw = payload as {
      event?: string;
      payment?: {
        id?: string;
        customer?: string;
        subscription?: string;
        externalReference?: string;
        status?: string;
      };
      subscription?: {
        id?: string;
        customer?: string;
        externalReference?: string;
        status?: string;
      };
    };

    let eventType: WebhookEventType = "UNKNOWN";
    const rawEvent = raw.event || "";

    switch (rawEvent) {
      case "PAYMENT_CONFIRMED":
        eventType = "PAYMENT_CONFIRMED";
        break;
      case "PAYMENT_RECEIVED":
        eventType = "PAYMENT_RECEIVED";
        break;
      case "PAYMENT_OVERDUE":
        eventType = "PAYMENT_OVERDUE";
        break;
      case "PAYMENT_DELETED":
        eventType = "PAYMENT_DELETED";
        break;
      case "SUBSCRIPTION_CREATED":
        eventType = "SUBSCRIPTION_CREATED";
        break;
      case "SUBSCRIPTION_UPDATED":
        eventType = "SUBSCRIPTION_UPDATED";
        break;
      case "SUBSCRIPTION_DELETED":
        eventType = "SUBSCRIPTION_DELETED";
        break;
      default:
        eventType = "UNKNOWN";
    }

    const subscriptionId =
      raw.payment?.subscription || raw.subscription?.id || undefined;
    const customerId = raw.payment?.customer || raw.subscription?.customer || undefined;
    const workspaceId =
      raw.payment?.externalReference || raw.subscription?.externalReference || undefined;

    return {
      type: eventType,
      provider: "asaas",
      subscriptionId,
      customerId,
      workspaceId,
      status: raw.payment?.status || raw.subscription?.status,
      rawEvent: payload,
    };
  }
}
