import { PaymentGateway } from "./PaymentGateway";
import {
  CreateCustomerParams,
  CustomerResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  CheckoutParams,
  WebhookEventResult,
  PaymentProviderType,
} from "./types";

export class MockPaymentGateway implements PaymentGateway {
  readonly provider: PaymentProviderType = "mock";

  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    return {
      customerId: `mock_cus_${params.workspaceId}`,
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
