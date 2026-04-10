import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    runSeed();
    const db = getDb();

    const events = db
      .prepare(`SELECT * FROM event ORDER BY sort_order, start_date`)
      .all() as Array<Record<string, unknown>>;

    const countStmt = db.prepare(
      `SELECT COUNT(*) as count FROM registration WHERE event_id = ? AND payment_status = 'completed'`
    );

    const eventsWithCounts = events.map((event) => {
      const { count } = countStmt.get(event.id) as { count: number };
      return {
        ...event,
        registrationCount: count,
      };
    });

    return NextResponse.json({ events: eventsWithCounts });
  } catch (error) {
    console.error("GET /api/admin/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const {
      name,
      type,
      startDate,
      endDate,
      locationName,
      locationCity,
      coach,
      instructor,
      courseName,
      courseColor,
      facebookEventUrl,
      flatPriceCents,
      memberPriceCents,
      nonMemberPriceCents,
      latePriceCents,
      lateRegistrationDate,
      description,
      bannerImageUrl,
      capacity,
      sortOrder,
      pricingTiers,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["meet", "league", "freestyle", "team", "course"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const db = getDb();

    const insertEvent = db.prepare(`
      INSERT INTO event (name, type, start_date, end_date, location_name, location_city, coach, instructor, course_name, course_color, facebook_event_url, flat_price_cents, member_price_cents, non_member_price_cents, late_price_cents, late_registration_date, description, banner_image_url, capacity, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTier = db.prepare(`
      INSERT INTO pricing_tier (event_id, membership_tier, comp_class, price_cents)
      VALUES (?, ?, ?, ?)
    `);

    const result = db.transaction(() => {
      const res = insertEvent.run(
        name,
        type,
        startDate || null,
        endDate || null,
        locationName || null,
        locationCity || null,
        coach || null,
        instructor || null,
        courseName || null,
        courseColor || null,
        facebookEventUrl || null,
        flatPriceCents || null,
        memberPriceCents || null,
        nonMemberPriceCents || null,
        latePriceCents || null,
        lateRegistrationDate || null,
        description || null,
        bannerImageUrl || null,
        capacity || null,
        sortOrder ?? 0
      );
      const eventId = res.lastInsertRowid;

      if (pricingTiers && Array.isArray(pricingTiers)) {
        for (const tier of pricingTiers) {
          insertTier.run(
            eventId,
            tier.membershipTier,
            tier.compClass || null,
            tier.priceCents
          );
        }
      }

      return eventId;
    })();

    return NextResponse.json({ id: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/events error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
