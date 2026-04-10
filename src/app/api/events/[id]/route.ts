import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runSeed } from "@/lib/seed";
import { WING_TYPES } from "@/data/wing-types";
import { TURN_DEGREES } from "@/data/turn-degrees";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    runSeed();
    const { id } = await params;
    const db = getDb();

    const event = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const pricingTiers = db
      .prepare(`SELECT * FROM pricing_tier WHERE event_id = ?`)
      .all(id) as Array<Record<string, unknown>>;

    const { count } = db
      .prepare(
        `SELECT COUNT(*) as count FROM registration WHERE event_id = ? AND payment_status = 'completed'`
      )
      .get(id) as { count: number };

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        startDate: event.start_date,
        endDate: event.end_date,
        locationName: event.location_name,
        locationCity: event.location_city,
        coach: event.coach,
        description: event.description,
        bannerImageUrl: event.banner_image_url,
        capacity: event.capacity,
        status: event.status,
        instructor: event.instructor,
        courseName: event.course_name,
        courseColor: event.course_color,
        facebookEventUrl: event.facebook_event_url,
        flatPriceCents: event.flat_price_cents,
        memberPriceCents: event.member_price_cents,
        nonMemberPriceCents: event.non_member_price_cents,
        latePriceCents: event.late_price_cents,
        lateRegistrationDate: event.late_registration_date,
        registrationCount: count,
        isFull: event.capacity != null ? count >= (event.capacity as number) : false,
      },
      pricingTiers: pricingTiers.map((t: Record<string, unknown>) => ({
        membershipTier: t.membership_tier,
        compClass: t.comp_class,
        priceCents: t.price_cents,
      })),
      wingTypes: WING_TYPES,
      turnDegrees: TURN_DEGREES,
    });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
