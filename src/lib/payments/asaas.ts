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
      (isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3");
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

    console.log(`[Asaas] createCustomer initiating for workspace ${params.workspaceId || "unknown"} (name: ${params.name}, email: ${params.email})`);

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
      console.error(`[Asaas] createCustomer error: ${errorMsg}`, data);
      throw this.normalizeError(errorMsg);
    }

    const customerId = (data.id as string) || `cus_${Date.now()}`;
    console.log(`[Asaas] createCustomer success: ${customerId}`);

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
   * 1. If providerCustomerId / workspace.asaasCustomerId exists, verify on Asaas & update.
   * 2. Search Asaas by externalReference (workspaceId).
   * 3. Search Asaas by cpfCnpj.
   * 4. If not found, create new.
   */
  async ensureCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    const workspaceId = params.workspaceId;
    console.log(`[Asaas] ensureCustomer starting for workspace: ${workspaceId}, email: ${params.email}`);

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
      console.log(`[Asaas] ensureCustomer found existing local ID: ${existingCustomerId}`);
      if (this.apiKey) {
        const existing = await this.getCustomer(existingCustomerId);
        if (existing) {
          console.log(`[Asaas] ensureCustomer confirmed existing customer on Asaas, updating details...`);
          await this.updateCustomerDetails(existingCustomerId, params);
          if (workspaceId) await this.persistCustomerId(workspaceId, existingCustomerId);
          return { customerId: existingCustomerId, provider: "asaas", updated: true };
        } else {
          console.warn(`[Asaas] ensureCustomer: ID ${existingCustomerId} not found on Asaas, will search or create.`);
        }
      } else {
        if (workspaceId) await this.persistCustomerId(workspaceId, existingCustomerId);
        return { customerId: existingCustomerId, provider: "asaas", updated: true };
      }
    }

    // 2. Search Asaas by externalReference
    if (workspaceId && this.apiKey) {
      console.log(`[Asaas] searching customer by externalReference: ${workspaceId}`);
      const foundByRef = await this.searchCustomers({ externalReference: workspaceId });
      if (foundByRef.length > 0) {
        const targetId = foundByRef[0].id;
        console.log(`[Asaas] found customer by externalReference: ${targetId}`);
        await this.updateCustomerDetails(targetId, params);
        await this.persistCustomerId(workspaceId, targetId);
        return { customerId: targetId, provider: "asaas", updated: true };
      }
    }

    // 3. Search Asaas by clean CPF/CNPJ
    if (params.cpfCnpj && this.apiKey) {
      const cleanDoc = params.cpfCnpj.replace(/\D/g, "");
      console.log(`[Asaas] searching customer by clean CPF/CNPJ: ${cleanDoc.slice(0, 3)}***`);
      const foundByDoc = await this.searchCustomers({ cpfCnpj: cleanDoc });
      if (foundByDoc.length > 0) {
        const targetId = foundByDoc[0].id;
        console.log(`[Asaas] found customer by CPF/CNPJ: ${targetId}`);
        await this.updateCustomerDetails(targetId, params);
        if (workspaceId) await this.persistCustomerId(workspaceId, targetId);
        return { customerId: targetId, provider: "asaas", updated: true };
      }
    }

    // 4. Create new customer
    console.log(`[Asaas] customer not found, creating new customer.`);
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

    const billingType =
      params.billingType && params.billingType !== "UNDEFINED"
        ? params.billingType
        : "BOLETO";

    const payload: Record<string, unknown> = {
      customer: params.customerId,
      billingType,
      value: params.price,
      nextDueDate: formattedDueDate,
      cycle: params.cycle || "MONTHLY",
      description: `Assinatura News Curator - ${params.planName}`,
      externalReference: params.workspaceId,
    };

    if (params.successUrl) {
      payload.callback = {
        successUrl: params.successUrl,
        autoRedirect: true,
      };
    }

    let res = await fetch(`${this.baseUrl}/subscriptions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    let data: Record<string, unknown> = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    // Fallback: If Asaas rejects due to callback domain mismatch, retry without callback
    if (!res.ok && payload.callback) {
      const errors = data?.errors as Array<{ code?: string; description?: string }> | undefined;
      const isDomainError = errors?.some(
        (e) => e.code === "invalid_object" && e.description?.toLowerCase().includes("domínio")
      );
      if (isDomainError) {
        console.warn(
          "[Asaas] Callback domain mismatch, retrying subscription creation without callback payload..."
        );
        delete payload.callback;
        res = await fetch(`${this.baseUrl}/subscriptions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        }
      }
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
          } else if (firstPayment?.bankSlipUrl) {
            invoiceUrl = firstPayment.bankSlipUrl;
            paymentUrl = invoiceUrl;
          } else if (firstPayment?.id) {
            invoiceUrl = `https://www.asaas.com/i/${firstPayment.id}`;
            paymentUrl = invoiceUrl;
          }
        }
      }
    } catch {
      // Non-fatal error during first payment fetch
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
   * Generates a hosted checkout / invoice URL for the plan subscription.
   */
  async getCheckoutUrl(params: CheckoutParams): Promise<string> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    if (!params.customerId) {
      throw this.normalizeError("Cliente inválido ou não informado para checkout.");
    }

    if (params.amount === undefined || !params.planId || !params.planName) {
      throw this.normalizeError("Dados do plano ou valor incompletos para checkout.");
    }

    const billingType =
      params.billingType && params.billingType !== "UNDEFINED"
        ? params.billingType
        : "BOLETO";

    const sub = await this.createSubscription({
      workspaceId: params.workspaceId,
      customerId: params.customerId,
      planId: params.planId,
      planSlug: params.planSlug,
      planName: params.planName,
      price: params.amount,
      billingType,
      cycle: params.cycle || "MONTHLY",
    });

    const targetUrl = sub.paymentUrl || sub.invoiceUrl;

    if (!targetUrl) {
      throw this.normalizeError("O gateway de pagamento não retornou a URL da fatura de checkout.");
    }

    return targetUrl;
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
   * Retrieves subscription details from Asaas API.
   */
  async getSubscription(subscriptionId: string): Promise<Record<string, unknown> | null> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw this.normalizeError(`Erro ao consultar assinatura ${subscriptionId} no Asaas: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Retrieves payments for a subscription from Asaas API.
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<Array<Record<string, unknown>>> {
    if (!this.apiKey) {
      throw this.normalizeError("Asaas API Key não configurada.");
    }

    const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/payments?limit=50`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw this.normalizeError(`Erro ao consultar cobranças da assinatura ${subscriptionId} no Asaas: HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
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
      id?: string;
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
      case "PAYMENT_CREATED":
        eventType = "PAYMENT_CREATED";
        break;
      case "PAYMENT_UPDATED":
        eventType = "PAYMENT_UPDATED";
        break;
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
      case "PAYMENT_REFUNDED":
        eventType = "PAYMENT_REFUNDED";
        break;
      case "PAYMENT_PARTIALLY_REFUNDED":
        eventType = "PAYMENT_PARTIALLY_REFUNDED";
        break;
      case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
        eventType = "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED";
        break;
      case "PAYMENT_CHARGEBACK_REQUESTED":
        eventType = "PAYMENT_CHARGEBACK_REQUESTED";
        break;
      case "SUBSCRIPTION_CREATED":
        eventType = "SUBSCRIPTION_CREATED";
        break;
      case "SUBSCRIPTION_UPDATED":
        eventType = "SUBSCRIPTION_UPDATED";
        break;
      case "SUBSCRIPTION_INACTIVATED":
        eventType = "SUBSCRIPTION_INACTIVATED";
        break;
      case "SUBSCRIPTION_DELETED":
        eventType = "SUBSCRIPTION_DELETED";
        break;
      default:
        eventType = "UNKNOWN";
    }

    const providerEventId =
      raw.id ||
      (raw.payment?.id ? `${raw.payment.id}_${rawEvent}` : undefined) ||
      (raw.subscription?.id ? `${raw.subscription.id}_${rawEvent}` : undefined);

    const subscriptionId =
      raw.payment?.subscription || raw.subscription?.id || undefined;
    const paymentId = raw.payment?.id || undefined;
    const customerId = raw.payment?.customer || raw.subscription?.customer || undefined;
    const workspaceId =
      raw.payment?.externalReference || raw.subscription?.externalReference || undefined;

    return {
      type: eventType,
      provider: "asaas",
      providerEventId,
      paymentId,
      subscriptionId,
      customerId,
      workspaceId,
      status: raw.payment?.status || raw.subscription?.status,
      rawEvent: payload,
    };
  }
}
