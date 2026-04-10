import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    runSeed();
    const db = getDb();

    const events = db
      .prepare(
        `SELECT * FROM event WHERE status = 'published' ORDER BY sort_order, start_date`
      )
      .all() as Array<Record<string, unknown>>;

    const countStmt = db.prepare(
      `SELECT COUNT(*) as count FROM registration WHERE event_id = ? AND payment_status = 'completed'`
    );

    const eventsWithCounts = events.map((event: Record<string, unknown>) => {
      const { count } = countStmt.get(event.id) as { count: number };
      return {
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
      };
    });

    return NextResponse.json({ events: eventsWithCounts });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
