export interface CreatePaymentDTO {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  returnUrl?: string;
}

export interface PaymentInitResult {
  checkoutUrl: string;
  providerPaymentId?: string;
  status: "PENDING" | "PROCESSING" | "PAID";
}

export interface WebhookVerificationResult {
  isValid: boolean;
  paymentId: string;
  externalTransactionId: string;
  status: "PAID" | "FAILED" | "CANCELLED" | "PROCESSING";
  rawResponse: Record<string, unknown>;
  amount?: number;
}

export interface PaymentProviderInterface {
  readonly name: "click" | "payme" | "card" | "test";
  createPayment(dto: CreatePaymentDTO): Promise<PaymentInitResult>;
  verifyWebhook(payload: unknown, headers: Record<string, string | string[] | undefined>): Promise<WebhookVerificationResult>;
}
