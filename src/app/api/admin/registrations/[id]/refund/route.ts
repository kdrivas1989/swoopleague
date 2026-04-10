import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createRefund } from "@/lib/stripe";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const db = getDb();

    const payment = db
      .prepare(
        "SELECT * FROM payment WHERE registration_id = ? AND status = 'succeeded'"
      )
      .get(id) as
      | { id: number; provider_payment_id: string; registration_id: number }
      | undefined;

    if (!payment) {
      return NextResponse.json(
        { error: "No successful payment found for this registration" },
        { status: 404 }
      );
    }

    if (!payment.provider_payment_id) {
      return NextResponse.json(
        { error: "No payment intent ID found" },
        { status: 400 }
      );
    }

    await createRefund(payment.provider_payment_id);

    db.transaction(() => {
      db.prepare(
        "UPDATE payment SET status = 'refunded', updated_at = datetime('now') WHERE id = ?"
      ).run(payment.id);
      db.prepare(
        "UPDATE registration SET payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?"
      ).run(id);
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/registrations/[id]/refund error:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
