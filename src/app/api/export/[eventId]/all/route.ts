import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const API_KEY = process.env.EXPORT_API_KEY || "swoop-export-key-change-me";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { eventId } = await params;
  const db = getDb();

  const event = db.prepare("SELECT name FROM event WHERE id = ?").get(Number(eventId)) as
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
       ORDER BY r.created_at`
    )
    .all(Number(eventId)) as Array<Record<string, unknown>>;

  const escapeCSV = (val: unknown): string => {
    const str = val == null ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Name", "Email", "Membership Tier", "Class", "Wing Type", "Wing Size",
    "Wing Loading", "Degree of Turn", "Country", "Payment Status", "Waiver Signed", "Registration Date",
  ];

  const rows = registrations.map((r) =>
    [
      r.competitor_name, r.competitor_email, r.membership_tier, r.comp_class,
      r.wing_type, r.wing_size, r.wing_loading, r.degree_of_turn, r.country,
      r.payment_status, r.waiver_signed ? "Yes" : "No", r.created_at,
    ].map(escapeCSV).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const safeName = event.name.replace(/[^a-zA-Z0-9]/g, "_");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}_all.csv"`,
    },
  });
}
