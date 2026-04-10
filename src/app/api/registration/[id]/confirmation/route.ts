import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { formatCents } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const registration = db
      .prepare(
        `SELECT r.*, e.name as event_name, e.type as event_type,
                e.start_date, e.end_date, e.location_name, e.location_city,
                c.name as competitor_name, c.email as competitor_email
         FROM registration r
         JOIN event e ON e.id = r.event_id
         JOIN competitor c ON c.id = r.competitor_id
         WHERE r.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registration: {
        id: registration.id,
        eventName: registration.event_name,
        name: registration.competitor_name,
        email: registration.competitor_email,
        compClass: registration.comp_class || null,
        wingType: registration.wing_type || null,
        wingSize: registration.wing_size || null,
        wingLoading: registration.wing_loading || null,
        degreeOfTurn: registration.degree_of_turn || null,
        country: registration.country || null,
        pricePaid: formatCents(registration.price_cents as number),
        paymentStatus: registration.payment_status || registration.status,
      },
    });
  } catch (error) {
    console.error("GET /api/registration/[id]/confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}
