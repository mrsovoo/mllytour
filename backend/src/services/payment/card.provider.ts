import { config } from "../../config/index.js";
import type {
  CreatePaymentDTO,
  PaymentInitResult,
  PaymentProviderInterface,
  WebhookVerificationResult,
} from "./payment.types.js";

export class CardProvider implements PaymentProviderInterface {
  readonly name = "card" as const;

  async createPayment(dto: CreatePaymentDTO): Promise<PaymentInitResult> {
    // International Card acquiring URL (Stripe, Dodo, or National Interbank Card Gateway)
    // In dev / test mode, directs to returnUrl with success callback
    const returnUrl = dto.returnUrl || "https://millytour.uz/payment/success";
    const checkoutUrl = `${returnUrl}?paymentId=${encodeURIComponent(
      dto.paymentId,
    )}&orderNumber=${encodeURIComponent(dto.orderNumber)}&amount=${dto.amount}`;

    return {
      checkoutUrl,
      status: "PENDING",
    };
  }

  async verifyWebhook(
    payload: any,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    const { paymentId, transactionId, status, amount } = payload || {};

    return {
      isValid: true,
      paymentId: String(paymentId || ""),
      externalTransactionId: String(transactionId || `card_tx_${Date.now()}`),
      status: status === "PAID" ? "PAID" : "FAILED",
      amount: Number(amount || 0),
      rawResponse: { received: true, status: "OK" },
    };
  }
}
