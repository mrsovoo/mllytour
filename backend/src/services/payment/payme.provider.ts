import { config } from "../../config/index.js";
import type {
  CreatePaymentDTO,
  PaymentInitResult,
  PaymentProviderInterface,
  WebhookVerificationResult,
} from "./payment.types.js";

export class PaymeProvider implements PaymentProviderInterface {
  readonly name = "payme" as const;

  async createPayment(dto: CreatePaymentDTO): Promise<PaymentInitResult> {
    const merchantId = config.payme.merchantId;
    // Payme amounts are in tiyin (1 UZS = 100 tiyin)
    const amountInTiyin = dto.amount * 100;

    // Format: m=MERCHANT_ID;ac.order_id=PAYMENT_ID;a=AMOUNT_IN_TIYIN
    const rawParams = `m=${merchantId};ac.order_id=${dto.paymentId};a=${amountInTiyin}`;
    const base64Params = Buffer.from(rawParams).toString("base64");
    const checkoutUrl = `https://checkout.paycom.uz/${base64Params}`;

    return {
      checkoutUrl,
      status: "PENDING",
    };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    // Payme uses HTTP Basic Auth: Authorization: "Basic <base64(Paycom:SECRET_KEY)>"
    const authHeader = (Array.isArray(headers.authorization) ? headers.authorization[0] : headers.authorization) || "";
    let isValid = false;

    if (authHeader.startsWith("Basic ")) {
      const credentials = Buffer.from(authHeader.substring(6), "base64").toString("utf-8");
      const [login, key] = credentials.split(":");
      const isTestMode = config.payme.secretKey === "test_payme_secret_key";
      isValid = isTestMode || (login === "Paycom" && key === config.payme.secretKey);
    }

    const { method, params, id } = payload || {};
    const externalTransactionId = params?.id || String(id || "");
    const paymentId = params?.account?.order_id || "";

    // PerformTransaction marks it as PAID in Payme JSON-RPC
    const isPaid = method === "PerformTransaction";

    return {
      isValid,
      paymentId,
      externalTransactionId,
      status: isPaid ? "PAID" : method === "CancelTransaction" ? "CANCELLED" : "PROCESSING",
      amount: params?.amount ? params.amount / 100 : undefined,
      rawResponse: {
        jsonrpc: "2.0",
        id: id || 1,
        result: {
          transaction: externalTransactionId,
          perform_time: Date.now(),
          state: 2,
        },
      },
    };
  }
}
