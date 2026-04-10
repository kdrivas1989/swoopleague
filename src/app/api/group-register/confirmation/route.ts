import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { formatCents } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const group = db
      .prepare(`SELECT * FROM group_registration WHERE id = ?`)
      .get(groupId) as Record<string, unknown> | undefined;

    if (!group) {
      return NextResponse.json(
        { error: "Group registration not found" },
        { status: 404 }
      );
    }

    const registrations = db
      .prepare(
        `SELECT r.*, e.name as event_name, e.type as event_type, c.name as competitor_name, c.email as competitor_email
         FROM registration r
         JOIN event e ON r.event_id = e.id
         JOIN competitor c ON r.competitor_id = c.id
         WHERE r.group_registration_id = ?
         ORDER BY c.name, e.sort_order`
      )
      .all(groupId) as Array<Record<string, unknown>>;

    return NextResponse.json({
      group: {
        id: group.id,
        payerName: group.payer_name,
        payerEmail: group.payer_email,
        totalCents: group.total_cents,
        totalFormatted: formatCents(group.total_cents as number),
        paymentStatus: group.payment_status,
        createdAt: group.created_at,
      },
      registrations: registrations.map((r) => ({
        id: r.id,
        competitorName: r.competitor_name,
        competitorEmail: r.competitor_email,
        eventName: r.event_name,
        eventType: r.event_type,
        compClass: r.comp_class,
        priceCents: r.price_cents,
        priceFormatted: formatCents(r.price_cents as number),
        paymentStatus: r.payment_status,
      })),
    });
  } catch (error) {
    console.error("GET /api/group-register/confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group registration" },
      { status: 500 }
    );
  }
}
