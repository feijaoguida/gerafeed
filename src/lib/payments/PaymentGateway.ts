import {
  CreateCustomerParams,
  CustomerResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  CheckoutParams,
  WebhookEventResult,
  PaymentProviderType,
} from "./types";

export interface PaymentGateway {
  readonly provider: PaymentProviderType;

  /**
   * Creates or resolves a customer in the payment gateway.
   */
  createCustomer(params: CreateCustomerParams): Promise<CustomerResult>;

  /**
   * Creates a recurring subscription in the payment gateway.
   */
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;

  /**
   * Generates a hosted checkout URL or payment link for the plan.
   */
  getCheckoutUrl(params: CheckoutParams): Promise<string>;

  /**
   * Cancels an active subscription in the payment gateway.
   */
  cancelSubscription(subscriptionId: string): Promise<boolean>;

  /**
   * Processes a webhook event received from the payment gateway.
   */
  handleWebhook(payload: unknown, headers?: Record<string, string>): Promise<WebhookEventResult>;
}
