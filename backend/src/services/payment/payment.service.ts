import { prisma } from "../../db/client.js";
import { ClickProvider } from "./click.provider.js";
import { PaymeProvider } from "./payme.provider.js";
import { CardProvider } from "./card.provider.js";
import type { PaymentProviderInterface } from "./payment.types.js";
import { randomUUID } from "node:crypto";

export class PaymentService {
  private providers = new Map<string, PaymentProviderInterface>();

  constructor() {
    this.registerProvider(new ClickProvider());
    this.registerProvider(new PaymeProvider());
    this.registerProvider(new CardProvider());
  }

  private registerProvider(provider: PaymentProviderInterface) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  getProvider(name: string): PaymentProviderInterface {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`To'lov provayderi topilmadi: ${name}`);
    }
    return provider;
  }

  /**
   * Yangi to'lov yaratish.
   * Xavfsizlik: Summa frontend'dan olinmaydi, to'g'ridan-to'g'ri Order'dan hisoblanadi!
   */
  async createPayment(params: {
    orderId: string;
    provider: "click" | "payme" | "card";
    userId?: string;
    returnUrl?: string;
  }) {
    const { orderId, provider: providerName, userId, returnUrl } = params;

    // 1. Buyurtmani tekshirish
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tour: true },
    });

    if (!order) {
      throw new Error("Buyurtma topilmadi");
    }

    if (order.status === "PAID" || order.status === "CONFIRMED") {
      throw new Error("Ushbu buyurtma uchun to'lov allaqachon amalga oshirilgan");
    }

    const provider = this.getProvider(providerName);
    const paymentId = `pay_${randomUUID().replace(/-/g, "").substring(0, 16)}`;

    // 2. Provayderdan to'lov havolasini olish
    const initResult = await provider.createPayment({
      paymentId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: order.currency,
      returnUrl,
    });

    // 3. Bazaga to'lov yozuvini saqlash
    const providerEnum = providerName.toUpperCase() as "CLICK" | "PAYME" | "CARD";
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        orderId: order.id,
        userId: userId || order.userId,
        provider: providerEnum,
        amount: order.totalAmount,
        currency: order.currency,
        status: "PENDING",
        paymentUrl: initResult.checkoutUrl,
        providerPaymentId: initResult.providerPaymentId,
      },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: payment.amount,
      currency: payment.currency,
      provider: providerName,
      status: payment.status,
      checkoutUrl: initResult.checkoutUrl,
    };
  }

  /**
   * Provayderlardan kelgan webhook'larni tekshirish va to'lovni tasdiqlash.
   * Idempotency bilan himoyalangan: bitta tranzaksiya ikki marta tasdiqlanmaydi!
   */
  async handleWebhook(
    providerName: string,
    payload: any,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const provider = this.getProvider(providerName);
    const verification = await provider.verifyWebhook(payload, headers);

    if (!verification.isValid) {
      throw new Error("Webhook imzosi noto'g'ri (Signature verification failed)");
    }

    const { paymentId, externalTransactionId, status, amount } = verification;

    // 1. Tranzaksiya allaqachon qayta ishlanganligini tekshirish (Idempotency)
    const providerEnum = providerName.toUpperCase() as "CLICK" | "PAYME" | "CARD";
    const existingTx = await prisma.paymentTransaction.findUnique({
      where: {
        provider_externalTransactionId: {
          provider: providerEnum,
          externalTransactionId,
        },
      },
    });

    if (existingTx) {
      // Takroriy webhook kelgan bo'lsa, xatosiz qaytaramiz (idempotent)
      return verification.rawResponse;
    }

    // 2. To'lovni bazadan topish
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error(`To'lov topilmadi: ${paymentId}`);
    }

    // Agar webhookdagi summa to'lov summasiga mos kelmasa, xatolik beramiz
    if (amount !== undefined && amount !== payment.amount) {
      throw new Error("To'lov summasi mos kelmadi (Amount mismatch)");
    }

    // 3. Tranzaksiyani saqlash
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider: providerEnum,
        externalTransactionId,
        type: "PAYMENT",
        amount: payment.amount,
        currency: payment.currency,
        status,
        rawReference: JSON.stringify(payload),
      },
    });

    // 4. Agar status PAID bo'lsa, Payment va Order holatini yangilash
    if (status === "PAID") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
        },
      });

      // 5. Hamkor ulushini (Partner Earnings) hisoblash va yaratish
      if (payment.order.partnerId) {
        // Platforma komissiyasini aniqlash (sozlamalardan yoki standart 10%)
        const commissionSetting = await prisma.setting.findUnique({
          where: { key: "platform_commission_percent" },
        });
        const commissionRate = commissionSetting ? Number(commissionSetting.value) : 10.0;
        const commissionAmount = Math.round((payment.amount * commissionRate) / 100);
        const netAmount = payment.amount - commissionAmount;

        await prisma.partnerEarning.create({
          data: {
            partnerId: payment.order.partnerId,
            orderId: payment.orderId,
            grossAmount: payment.amount,
            commissionRate,
            commissionAmount,
            netAmount,
            currency: payment.currency,
            status: "PENDING",
          },
        });
      }
    } else if (status === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
        },
      });
    }

    return verification.rawResponse;
  }

  /**
   * To'lovni qaytarish (Refund)
   */
  async processRefund(paymentId: string, reason: string, adminUsername?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error("To'lov topilmadi");
    }

    if (payment.status !== "PAID") {
      throw new Error("Faqat to'langan (PAID) to'lovlarni qaytarish mumkin");
    }

    // 1. Refund yozuvini yaratish
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        reason,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 2. Payment va Order holatini REFUNDED qilish
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "REFUNDED" },
    });

    // 3. Audit log yozish
    await prisma.auditLog.create({
      data: {
        adminUsername: adminUsername || "system",
        action: "REFUND_PAYMENT",
        targetType: "Payment",
        targetId: payment.id,
        details: `To'lov qaytarildi: ${payment.amount} ${payment.currency}. Sababi: ${reason}`,
      },
    });

    return refund;
  }
}

export const paymentService = new PaymentService();
