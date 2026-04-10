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
    const db = getDb();

    const existing = db.prepare("SELECT id FROM event WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    const waivers = db.prepare(`
      SELECT w.*, c.name as competitor_name
      FROM waiver w
      LEFT JOIN competitor c ON w.competitor_id = c.id
      WHERE w.event_id = ?
      ORDER BY w.signed_at DESC
    `).all(Number(id)) as Array<Record<string, unknown>>;

    // CSV export
    if (format === "csv") {
      const headers = [
        "ID", "First Name", "Last Name", "Email", "Date of Birth", "Phone",
        "Total Jumps", "Jumps Last 12 Mo", "Canopy Type/Size", "Jumps on Canopy",
        "Is Minor", "Guardian Name", "Marketing Consent", "Signed At", "IP Address",
      ];

      const rows = waivers.map((w) => [
        w.id,
        w.first_name,
        w.last_name,
        w.email,
        w.date_of_birth,
        w.phone || "",
        w.total_jumps ?? "",
        w.jumps_last_12_months ?? "",
        w.canopy_type_and_size || "",
        w.jumps_on_canopy ?? "",
        w.is_minor ? "Yes" : "No",
        w.guardian_name || "",
        w.marketing_consent ? "Yes" : "No",
        w.signed_at,
        w.ip_address || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=waivers-event-${id}.csv`,
        },
      });
    }

    return NextResponse.json({
      waivers,
      totalCount: waivers.length,
    });
  } catch (error) {
    console.error("GET /api/admin/events/[id]/waivers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waivers" },
      { status: 500 }
    );
  }
}
