import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const url = new URL(request.url);
    const classFilter = url.searchParams.get("class");
    const tierFilter = url.searchParams.get("tier");
    const countryFilter = url.searchParams.get("country");

    const db = getDb();

    const existing = db.prepare("SELECT id FROM event WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let query = `
      SELECT r.*, c.name as competitor_name, c.email as competitor_email
      FROM registration r
      JOIN competitor c ON r.competitor_id = c.id
      WHERE r.event_id = ?
    `;
    const queryParams: (string | number)[] = [Number(id)];

    if (classFilter) {
      query += " AND r.comp_class = ?";
      queryParams.push(classFilter);
    }
    if (tierFilter) {
      query += " AND r.membership_tier = ?";
      queryParams.push(tierFilter);
    }
    if (countryFilter) {
      query += " AND r.country = ?";
      queryParams.push(countryFilter);
    }

    query += " ORDER BY r.created_at DESC";

    const registrations = db.prepare(query).all(...queryParams) as Array<
      Record<string, unknown>
    >;

    const totalCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM registration WHERE event_id = ?"
      )
      .get(Number(id)) as { count: number };

    return NextResponse.json({
      registrations,
      totalCount: totalCount.count,
    });
  } catch (error) {
    console.error("GET /api/admin/events/[id]/registrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
