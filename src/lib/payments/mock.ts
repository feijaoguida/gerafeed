import { PaymentGateway } from "./PaymentGateway";
import {
  CreateCustomerParams,
  CustomerResult,
  CustomerDTO,
  CreateSubscriptionParams,
  SubscriptionResult,
  CheckoutParams,
  WebhookEventResult,
  PaymentProviderType,
  PaymentProviderCapabilities,
} from "./types";

export class MockPaymentGateway implements PaymentGateway {
  readonly provider: PaymentProviderType = "mock";
  readonly capabilities: PaymentProviderCapabilities = {
    customer: true,
    checkout: true,
    subscription: true,
    payments: true,
    webhooks: true,
  };

  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    return {
      customerId: params.providerCustomerId || `mock_cus_${params.workspaceId}`,
      provider: "mock",
      created: true,
    };
  }

  async ensureCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    const customerId = params.providerCustomerId || `mock_cus_${params.workspaceId}`;
    return {
      customerId,
      provider: "mock",
      created: !params.providerCustomerId,
      updated: !!params.providerCustomerId,
    };
  }

  async getCustomer(customerId: string): Promise<CustomerDTO | null> {
    return {
      id: customerId,
      name: "Mock Customer",
      email: "mock@example.com",
      provider: "mock",
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    return {
      subscriptionId: `mock_sub_${Date.now()}`,
      status: "ACTIVE",
      paymentUrl: `https://payment.example.com/checkout/${params.planSlug}`,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async getCheckoutUrl(params: CheckoutParams): Promise<string> {
    return `https://payment.example.com/checkout/${params.planSlug}?workspace=${params.workspaceId}`;
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    void subscriptionId;
    return true;
  }

  async handleWebhook(payload: unknown): Promise<WebhookEventResult> {
    const raw = payload as Record<string, unknown>;
    return {
      type: "PAYMENT_CONFIRMED",
      provider: "mock",
      subscriptionId: (raw?.subscriptionId as string) || "mock_sub_id",
      status: "CONFIRMED",
      rawEvent: payload,
    };
  }
}
