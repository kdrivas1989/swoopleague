import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const db = getDb();

    const event = db.prepare("SELECT name FROM event WHERE id = ?").get(id) as
      | { name: string }
      | undefined;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registrations = db
      .prepare(
        `SELECT r.*, c.name as competitor_name, c.email as competitor_email
         FROM registration r
         JOIN competitor c ON r.competitor_id = c.id
         WHERE r.event_id = ?
         ORDER BY r.created_at DESC`
      )
      .all(id) as Array<Record<string, unknown>>;

    const headers = [
      "Name",
      "Email",
      "Membership Tier",
      "Class",
      "Wing Type",
      "Wing Size",
      "Wing Loading",
      "Degree of Turn",
      "Country",
      "Payment Status",
      "Registration Date",
    ];

    const escapeCSV = (val: unknown): string => {
      const str = val == null ? "" : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = registrations.map((r) =>
      [
        r.competitor_name,
        r.competitor_email,
        r.membership_tier,
        r.comp_class,
        r.wing_type,
        r.wing_size,
        r.wing_loading,
        r.degree_of_turn,
        r.country,
        r.payment_status,
        r.created_at,
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const safeName = event.name.replace(/[^a-zA-Z0-9]/g, "_");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${safeName}_registrations.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/events/[id]/registrations/export/csv error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
