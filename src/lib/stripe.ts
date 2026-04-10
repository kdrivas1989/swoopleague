import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(amountCents: number, metadata: Record<string, string>) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function createRefund(paymentIntentId: string) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
}

export async function verifyWebhookSignature(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
