import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = await verifyWebhookSignature(body, signature);
    const db = getDb();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const registrationId = paymentIntent.metadata.registrationId;
        const eventId = paymentIntent.metadata.eventId;
        const groupRegistrationId = paymentIntent.metadata.groupRegistrationId;

        // Update payment status for all payments with this PI
        db.prepare(
          `UPDATE payment SET status = 'succeeded', updated_at = datetime('now')
           WHERE provider_payment_id = ?`
        ).run(paymentIntent.id);

        if (groupRegistrationId) {
          // Group registration flow
          // Update group_registration status
          db.prepare(
            `UPDATE group_registration SET payment_status = 'completed' WHERE id = ?`
          ).run(groupRegistrationId);

          // Update ALL registrations in this group
          db.prepare(
            `UPDATE registration SET payment_status = 'completed', updated_at = datetime('now')
             WHERE group_registration_id = ?`
          ).run(groupRegistrationId);

          // Handle league memberships for group registrations
          const groupRegs = db
            .prepare(
              `SELECT r.id, r.competitor_id, r.event_id, e.type
               FROM registration r
               JOIN event e ON r.event_id = e.id
               WHERE r.group_registration_id = ?`
            )
            .all(groupRegistrationId) as Array<{
              id: number;
              competitor_id: number;
              event_id: number;
              type: string;
            }>;

          const currentYear = new Date().getFullYear();
          for (const reg of groupRegs) {
            if (reg.type === "league") {
              db.prepare(
                `INSERT OR IGNORE INTO league_membership (competitor_id, season, registration_id)
                 VALUES (?, ?, ?)`
              ).run(reg.competitor_id, currentYear, reg.id);
            }
          }
        } else {
          // Single registration flow
          // Update registration payment status
          db.prepare(
            `UPDATE registration SET payment_status = 'completed', updated_at = datetime('now')
             WHERE id = ?`
          ).run(registrationId);

          // If league event, create league membership
          const eventRow = db
            .prepare(`SELECT type FROM event WHERE id = ?`)
            .get(eventId) as { type: string } | undefined;

          if (eventRow && eventRow.type === "league") {
            const registration = db
              .prepare(`SELECT competitor_id FROM registration WHERE id = ?`)
              .get(registrationId) as { competitor_id: number } | undefined;

            if (registration) {
              const currentYear = new Date().getFullYear();
              db.prepare(
                `INSERT OR IGNORE INTO league_membership (competitor_id, season, registration_id)
                 VALUES (?, ?, ?)`
              ).run(registration.competitor_id, currentYear, registrationId);
            }
          }
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const registrationId = paymentIntent.metadata.registrationId;

        // Update payment status
        db.prepare(
          `UPDATE payment SET status = 'failed', updated_at = datetime('now')
           WHERE provider_payment_id = ?`
        ).run(paymentIntent.id);

        // Update registration payment status
        db.prepare(
          `UPDATE registration SET payment_status = 'failed', updated_at = datetime('now')
           WHERE id = ?`
        ).run(registrationId);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
