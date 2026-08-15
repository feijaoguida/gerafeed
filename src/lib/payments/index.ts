import { PaymentGateway } from "./PaymentGateway";
import { MockPaymentGateway } from "./mock";
import { AsaasGateway } from "./asaas";
import { PaymentProviderType } from "./types";

export * from "./types";
export * from "./PaymentGateway";
export * from "./mock";
export * from "./asaas";

/**
 * Registry/Factory for Payment Gateways.
 */
export function getPaymentGateway(provider?: PaymentProviderType): PaymentGateway {
  const selected = provider || (process.env.PAYMENT_PROVIDER as PaymentProviderType) || "mock";

  switch (selected) {
    case "asaas":
      return new AsaasGateway();
    case "mock":
    default:
      return new MockPaymentGateway();
  }
}

