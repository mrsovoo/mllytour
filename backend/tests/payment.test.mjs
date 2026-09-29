import test from "node:test";
import assert from "node:assert/strict";
import { ClickProvider } from "../dist/services/payment/click.provider.js";
import { PaymeProvider } from "../dist/services/payment/payme.provider.js";
import { CardProvider } from "../dist/services/payment/card.provider.js";
import { createToken, verifyToken, hashPassword, verifyPassword } from "../dist/utils/security.js";

test("ClickProvider generates correct checkout URL with merchant params", async () => {
  const click = new ClickProvider();
  const res = await click.createPayment({
    paymentId: "pay_test123",
    orderId: "ord_test123",
    orderNumber: "MT-2026-TEST",
    amount: 1800000,
    currency: "UZS",
    returnUrl: "https://millytour.uz/payment/success",
  });

  assert.ok(res.checkoutUrl.includes("my.click.uz"));
  assert.ok(res.checkoutUrl.includes("pay_test123"));
  assert.ok(res.checkoutUrl.includes("1800000"));
  assert.equal(res.status, "PENDING");
});

test("PaymeProvider generates valid Base64 encoded checkout URL", async () => {
  const payme = new PaymeProvider();
  const res = await payme.createPayment({
    paymentId: "pay_test456",
    orderId: "ord_test456",
    orderNumber: "MT-2026-TEST",
    amount: 1800000,
    currency: "UZS",
  });

  assert.ok(res.checkoutUrl.startsWith("https://checkout.paycom.uz/"));
  const base64Part = res.checkoutUrl.replace("https://checkout.paycom.uz/", "");
  const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

  assert.ok(decoded.includes("ac.order_id=pay_test456"));
  // 1,800,000 UZS = 180,000,000 tiyin
  assert.ok(decoded.includes("a=180000000"));
});

test("CardProvider generates checkout URL with params", async () => {
  const card = new CardProvider();
  const res = await card.createPayment({
    paymentId: "pay_card789",
    orderId: "ord_card789",
    orderNumber: "MT-2026-CARD",
    amount: 2900000,
    currency: "UZS",
  });

  assert.ok(res.checkoutUrl.includes("pay_card789"));
  assert.ok(res.checkoutUrl.includes("2900000"));
  assert.equal(res.status, "PENDING");
});

test("Security utility hashes passwords and verifies accurately", () => {
  const raw = "MillyTourPass2026!";
  const hash = hashPassword(raw);

  assert.notEqual(raw, hash);
  assert.ok(verifyPassword(raw, hash));
  assert.ok(!verifyPassword("WrongPassword", hash));
});

test("Security utility creates and verifies JWT tokens with expiration", () => {
  const payload = { id: "usr_1", role: "CUSTOMER", email: "test@millytour.uz" };
  const token = createToken(payload, 1);

  const verified = verifyToken(token);
  assert.ok(verified);
  assert.equal(verified.id, "usr_1");
  assert.equal(verified.role, "CUSTOMER");
  assert.equal(verified.email, "test@millytour.uz");

  // Invalid token check
  assert.equal(verifyToken("invalid.token.signature"), null);
});
