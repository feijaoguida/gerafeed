import { PaymentGateway } from "./PaymentGateway";
import {
  CreateCustomerParams,
  CustomerResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  CheckoutParams,
  WebhookEventResult,
  WebhookEventType,
  PaymentProviderType,
} from "./types";
import { prisma } from "@/lib/prisma";

export interface AsaasConfig {
  apiKey?: string;
  baseUrl?: string;
  webhookToken?: string;
}

export class AsaasGateway implements PaymentGateway {
  readonly provider: PaymentProviderType = "asaas";
  private apiKey: string;
  private baseUrl: string;
  private webhookToken: string;

  constructor(config?: AsaasConfig) {
    this.apiKey = config?.apiKey || process.env.ASAAS_API_KEY || "";
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

  /**
   * Creates or looks up an existing customer in Asaas.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    if (!this.apiKey) {
      throw new Error("Asaas API Key não configurada.");
    }

    const payload = {
      name: params.name,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
      mobilePhone: params.phone,
      externalReference: params.workspaceId,
    };

    const res = await fetch(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.errors?.[0]?.description || "Erro ao criar cliente no Asaas";
      throw new Error(`[Asaas] ${errorMsg}`);
    }

    // Save asaasCustomerId to workspace if found
    if (params.workspaceId) {
      await prisma.workspace.update({
        where: { id: params.workspaceId },
        data: { asaasCustomerId: data.id },
      }).catch(() => null);
    }

    return {
      customerId: data.id,
      provider: "asaas",
    };
  }

  /**
   * Creates a subscription in Asaas.
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Asaas API Key não configurada.");
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

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.errors?.[0]?.description || "Erro ao criar assinatura no Asaas";
      throw new Error(`[Asaas] ${errorMsg}`);
    }

    return {
      subscriptionId: data.id,
      status: data.status === "ACTIVE" ? "ACTIVE" : "PENDING",
      paymentUrl: data.paymentLink || undefined,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      raw: data,
    };
  }

  /**
   * Generates a payment link or hosted checkout URL.
   */
  async getCheckoutUrl(params: CheckoutParams): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Asaas API Key não configurada.");
    }

    // Create a payment link in Asaas
    const res = await fetch(`${this.baseUrl}/paymentLinks`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: `News Curator - Plano ${params.planSlug.toUpperCase()}`,
        billingType: "UNDEFINED",
        chargeType: "RECURRENT",
        externalReference: params.workspaceId,
        callback: {
          successUrl: params.successUrl || "/dashboard",
          autoRedirect: true,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.errors?.[0]?.description || "Erro ao gerar link de pagamento no Asaas";
      throw new Error(`[Asaas] ${errorMsg}`);
    }

    return data.url;
  }

  /**
   * Cancels a subscription in Asaas.
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error("Asaas API Key não configurada.");
    }

    const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data?.errors?.[0]?.description || "Erro ao cancelar assinatura no Asaas";
      throw new Error(`[Asaas] ${errorMsg}`);
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
    // Validate webhook token if configured
    if (this.webhookToken && headers) {
      const token = headers["asaas-access-token"] || headers["access_token"];
      if (token !== this.webhookToken) {
        throw new Error("Token de autenticação do Webhook Asaas inválido.");
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
