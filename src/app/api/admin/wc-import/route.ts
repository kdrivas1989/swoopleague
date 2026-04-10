import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fetchAllWCOrders, WC_PRODUCT_MAP, WCParsedRegistration } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

interface EventRow {
  id: number;
  name: string;
  type: string;
}

interface CompetitorRow {
  id: number;
  email: string;
  name: string;
}

interface RegistrationRow {
  id: number;
  event_id: number;
  competitor_id: number;
}

function findEventForProduct(
  events: EventRow[],
  reg: WCParsedRegistration
): EventRow | undefined {
  // Try exact name match first
  let match = events.find(
    (e) => e.name.toLowerCase() === reg.wcProductName.toLowerCase()
  );
  if (match) return match;

  // Try partial match: event name contains product name or vice versa
  match = events.find(
    (e) =>
      e.name.toLowerCase().includes(reg.wcProductName.toLowerCase()) ||
      reg.wcProductName.toLowerCase().includes(e.name.toLowerCase())
  );
  if (match) return match;

  // Try matching by type and extracting the number
  const meetMatch = reg.wcProductName.match(/Meet\s*#(\d+)/i);
  if (meetMatch) {
    match = events.find(
      (e) =>
        e.type === "meet" &&
        e.name.toLowerCase().includes(`#${meetMatch[1]}`)
    );
    if (match) return match;
  }

  // Fallback: match by type alone (for league, freestyle, team which are typically unique)
  if (["league", "freestyle", "team"].includes(reg.eventType)) {
    match = events.find(
      (e) => e.type === reg.eventType && e.name.includes("2026")
    );
    if (match) return match;
  }

  return undefined;
}

// GET: Preview WC data without importing
export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const registrations = await fetchAllWCOrders();
    const db = getDb();
    const events = db.prepare("SELECT id, name, type FROM event").all() as EventRow[];

    // Check which already exist
    const existingStmt = db.prepare(
      "SELECT r.id FROM registration r JOIN competitor c ON c.id = r.competitor_id WHERE c.email = ? AND r.event_id = ?"
    );

    const preview = registrations.map((reg) => {
      const event = findEventForProduct(events, reg);
      const eventId = event?.id;
      let exists = false;
      if (eventId) {
        const existing = existingStmt.get(reg.email, eventId) as RegistrationRow | undefined;
        exists = !!existing;
      }
      return {
        ...reg,
        localEventId: eventId || null,
        localEventName: event?.name || null,
        alreadyExists: exists,
        unmapped: !eventId,
      };
    });

    const newCount = preview.filter((p) => !p.alreadyExists && !p.unmapped).length;
    const existingCount = preview.filter((p) => p.alreadyExists).length;
    const unmappedCount = preview.filter((p) => p.unmapped).length;

    return NextResponse.json({
      registrations: preview,
      summary: {
        total: preview.length,
        new: newCount,
        existing: existingCount,
        unmapped: unmappedCount,
      },
      wcProducts: WC_PRODUCT_MAP,
      localEvents: events,
    });
  } catch (error) {
    console.error("GET /api/admin/wc-import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch WooCommerce data" },
      { status: 500 }
    );
  }
}

// POST: Actually import the orders
export async function POST() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const registrations = await fetchAllWCOrders();
    const db = getDb();
    const events = db.prepare("SELECT id, name, type FROM event").all() as EventRow[];

    const upsertCompetitor = db.prepare(`
      INSERT INTO competitor (email, name) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name
      RETURNING id
    `);

    const findCompetitor = db.prepare("SELECT id FROM competitor WHERE email = ?");

    const checkRegistration = db.prepare(
      "SELECT id FROM registration WHERE event_id = ? AND competitor_id = ?"
    );

    const insertRegistration = db.prepare(`
      INSERT INTO registration (event_id, competitor_id, membership_tier, comp_class, wing_type, wing_size, wing_loading, degree_of_turn, country, price_cents, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `);

    let imported = 0;
    let skippedExisting = 0;
    let skippedUnmapped = 0;
    const errors: string[] = [];

    const importAll = db.transaction(() => {
      for (const reg of registrations) {
        const event = findEventForProduct(events, reg);
        if (!event) {
          skippedUnmapped++;
          continue;
        }

        try {
          // Upsert competitor
          let competitorId: number;
          const upserted = upsertCompetitor.get(reg.email, reg.name) as { id: number } | undefined;
          if (upserted) {
            competitorId = upserted.id;
          } else {
            const found = findCompetitor.get(reg.email) as CompetitorRow;
            competitorId = found.id;
          }

          // Check duplicate
          const existing = checkRegistration.get(event.id, competitorId);
          if (existing) {
            skippedExisting++;
            continue;
          }

          // Normalize membership tier
          let membershipTier = reg.membership;
          if (!["non-member", "member", "sport"].includes(membershipTier)) {
            membershipTier = "non-member";
          }

          // Normalize comp class
          let compClass: string | null = reg.compClass;
          if (compClass && !["sport", "intermediate", "advanced", "pro"].includes(compClass)) {
            compClass = null;
          }

          insertRegistration.run(
            event.id,
            competitorId,
            membershipTier,
            compClass || null,
            reg.wingType || null,
            reg.wingSize || null,
            reg.wingLoading || null,
            reg.degreeOfTurn || null,
            reg.country || null,
            reg.priceCents,
          );
          imported++;
        } catch (err) {
          errors.push(`Order ${reg.orderId} (${reg.email}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });

    importAll();

    return NextResponse.json({
      success: true,
      imported,
      skippedExisting,
      skippedUnmapped,
      errors,
      total: registrations.length,
    });
  } catch (error) {
    console.error("POST /api/admin/wc-import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import WooCommerce data" },
      { status: 500 }
    );
  }
}
