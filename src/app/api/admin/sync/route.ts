import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Import full DB dump from production (paste JSON from /api/export/db)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { competitors, registrations } = await request.json();
  if (!competitors || !registrations) {
    return NextResponse.json({ error: "Missing competitors or registrations" }, { status: 400 });
  }

  const db = getDb();

  const upsertCompetitor = db.prepare(`
    INSERT INTO competitor (id, email, name, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name
  `);

  const upsertRegistration = db.prepare(`
    INSERT INTO registration (id, event_id, competitor_id, membership_tier, comp_class, wing_type, wing_size, wing_loading, degree_of_turn, country, price_cents, payment_status, waiver_signed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      membership_tier = excluded.membership_tier,
      comp_class = excluded.comp_class,
      wing_type = excluded.wing_type,
      wing_size = excluded.wing_size,
      wing_loading = excluded.wing_loading,
      degree_of_turn = excluded.degree_of_turn,
      country = excluded.country,
      price_cents = excluded.price_cents,
      payment_status = excluded.payment_status,
      waiver_signed = excluded.waiver_signed
  `);

  let compCount = 0;
  let regCount = 0;

  const importAll = db.transaction(() => {
    for (const c of competitors) {
      upsertCompetitor.run(c.id, c.email, c.name, c.created_at || new Date().toISOString());
      compCount++;
    }
    for (const r of registrations) {
      upsertRegistration.run(
        r.id, r.event_id, r.competitor_id, r.membership_tier, r.comp_class,
        r.wing_type, r.wing_size, r.wing_loading, r.degree_of_turn,
        r.country, r.price_cents, r.payment_status, r.waiver_signed || 0, r.created_at
      );
      regCount++;
    }
  });

  importAll();

  return NextResponse.json({ success: true, competitors: compCount, registrations: regCount });
}
