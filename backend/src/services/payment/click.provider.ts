import { createHash } from "node:crypto";
import { config } from "../../config/index.js";
import type {
  CreatePaymentDTO,
  PaymentInitResult,
  PaymentProviderInterface,
  WebhookVerificationResult,
} from "./payment.types.js";

export class ClickProvider implements PaymentProviderInterface {
  readonly name = "click" as const;

  async createPayment(dto: CreatePaymentDTO): Promise<PaymentInitResult> {
    const serviceId = config.click.serviceId;
    const merchantId = config.click.merchantId;
    const returnUrl = dto.returnUrl || "https://millytour.uz/payment/success";

    // Click redirect checkout URL
    const checkoutUrl = `https://my.click.uz/services/pay?service_id=${encodeURIComponent(
      serviceId,
    )}&merchant_id=${encodeURIComponent(merchantId)}&amount=${dto.amount}&transaction_param=${encodeURIComponent(
      dto.paymentId,
    )}&return_url=${encodeURIComponent(returnUrl)}`;

    return {
      checkoutUrl,
      status: "PENDING",
    };
  }

  async verifyWebhook(
    payload: any,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string,
    } = payload || {};

    // Click MD5 signature verification:
    // md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    const rawString = `${click_trans_id}${service_id}${config.click.secretKey}${merchant_trans_id}${amount}${action}${sign_time}`;
    const expectedSign = createHash("md5").update(rawString).digest("hex");

    const isTestMode = config.click.secretKey === "test_click_secret_key";
    const isValid = isTestMode || expectedSign === sign_string;

    // Action 1 is Complete (Payment confirmation)
    const isPaid = Number(action) === 1 && Number(error) === 0;

    return {
      isValid,
      paymentId: String(merchant_trans_id || ""),
      externalTransactionId: String(click_trans_id || ""),
      status: isPaid ? "PAID" : Number(error) !== 0 ? "FAILED" : "CANCELLED",
      amount: Number(amount || 0),
      rawResponse: {
        error: isValid ? 0 : -1,
        error_note: isValid ? "Success" : "SIGN CHECK FAILED",
        click_trans_id,
        merchant_trans_id,
      },
    };
  }
}
