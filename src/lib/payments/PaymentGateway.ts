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

export interface PaymentGateway {
  readonly provider: PaymentProviderType;
  readonly capabilities: PaymentProviderCapabilities;

  /**
   * Creates or resolves a customer in the payment gateway.
   */
  createCustomer(params: CreateCustomerParams): Promise<CustomerResult>;

  /**
   * Idempotent method: recovers/updates existing customer or creates a new one,
   * associating externalReference (workspaceId) and avoiding duplicates.
   */
  ensureCustomer(params: CreateCustomerParams): Promise<CustomerResult>;

  /**
   * Retrieves a normalized customer DTO by customerId.
   */
  getCustomer(customerId: string): Promise<CustomerDTO | null>;

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
