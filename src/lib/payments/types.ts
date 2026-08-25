export type PaymentProviderType = "asaas" | "stripe" | "mock";

export type BillingCycle = "MONTHLY" | "YEARLY";

export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";

export interface PaymentProviderCapabilities {
  customer: boolean;
  checkout: boolean;
  subscription: boolean;
  payments: boolean;
  webhooks: boolean;
}

export interface CreateCustomerParams {
  workspaceId: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  providerCustomerId?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface CustomerResult {
  customerId: string;
  provider: PaymentProviderType;
  created?: boolean;
  updated?: boolean;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  externalReference?: string;
  provider: PaymentProviderType;
}

export interface CreateSubscriptionParams {
  workspaceId: string;
  customerId: string;
  planId: string;
  planSlug: string;
  planName: string;
  price: number;
  billingType?: BillingType;
  cycle?: BillingCycle;
  creditCardToken?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: "ACTIVE" | "PENDING" | "PAST_DUE" | "CANCELED";
  paymentUrl?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  nextDueDate?: Date;
  raw?: unknown;
}

export interface CheckoutParams {
  workspaceId: string;
  planSlug: string;
  userEmail: string;
  userName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export type WebhookEventType =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "UNKNOWN";

export interface WebhookEventResult {
  type: WebhookEventType;
  provider: PaymentProviderType;
  subscriptionId?: string;
  customerId?: string;
  workspaceId?: string;
  status?: string;
  rawEvent: unknown;
}
