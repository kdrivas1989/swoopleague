import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
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

    const db = getDb();

    const existing = db.prepare("SELECT id FROM event WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateEvent = db.prepare(`
      UPDATE event SET
        name = ?, type = ?, start_date = ?, end_date = ?,
        location_name = ?, location_city = ?, coach = ?,
        instructor = ?, course_name = ?, course_color = ?,
        facebook_event_url = ?, flat_price_cents = ?,
        member_price_cents = ?, non_member_price_cents = ?,
        late_price_cents = ?, late_registration_date = ?,
        description = ?, banner_image_url = ?, capacity = ?,
        sort_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const deleteTiers = db.prepare("DELETE FROM pricing_tier WHERE event_id = ?");
    const insertTier = db.prepare(`
      INSERT INTO pricing_tier (event_id, membership_tier, comp_class, price_cents)
      VALUES (?, ?, ?, ?)
    `);

    db.transaction(() => {
      updateEvent.run(
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
        sortOrder ?? 0,
        id
      );

      deleteTiers.run(id);

      if (pricingTiers && Array.isArray(pricingTiers)) {
        for (const tier of pricingTiers) {
          insertTier.run(
            id,
            tier.membershipTier,
            tier.compClass || null,
            tier.priceCents
          );
        }
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
