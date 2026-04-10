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

  const event = db.prepare("SELECT * FROM event WHERE id = ?").get(Number(eventId)) as
    | Record<string, unknown>
    | undefined;
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registrations = db
    .prepare(
      `SELECT r.*, c.name as competitor_name, c.email as competitor_email
       FROM registration r
       JOIN competitor c ON r.competitor_id = c.id
       WHERE r.event_id = ? AND r.payment_status = 'completed'
       ORDER BY r.comp_class, r.country, c.name`
    )
    .all(Number(eventId)) as Array<Record<string, unknown>>;

  const classBase: Record<string, number> = {
    sport: 100, intermediate: 200, advanced: 300, pro: 400, open: 400,
  };

  const classBuckets: Record<string, Array<Record<string, unknown>>> = {};
  for (const r of registrations) {
    const cls = (r.comp_class as string) || "open";
    if (!classBuckets[cls]) classBuckets[cls] = [];
    classBuckets[cls].push(r);
  }

  const rows: string[] = [];

  for (const [cls, regs] of Object.entries(classBuckets)) {
    const base = classBase[cls] ?? 200;
    const countrySeen: Record<string, number> = {};
    let nextNo = base;

    for (const r of regs) {
      const country = ((r.country as string) || "USA").toUpperCase();
      if (!(country in countrySeen)) {
        countrySeen[country] = nextNo;
        nextNo++;
      }
      const teamNo = countrySeen[country];

      const meetMatch = (event.name as string).match(/#(\d+)/);
      const meetNum = meetMatch ? meetMatch[1] : "1";
      const year = new Date().getFullYear();
      const classAbbrev: Record<string, string> = {
        sport: "SPT", intermediate: "INT", advanced: "ADV", pro: "OPEN", open: "OPEN",
      };
      const abbrev = classAbbrev[cls] || cls.toUpperCase();
      const teamName = country === "USA"
        ? `${year} ${meetNum} ${abbrev}`
        : `${country} ${year} ${meetNum} ${abbrev}`;

      const fullName = (r.competitor_name as string) || "";
      const lastSpace = fullName.lastIndexOf(" ");
      const firstName = lastSpace > 0 ? fullName.substring(0, lastSpace) : fullName;
      const surname = lastSpace > 0 ? fullName.substring(lastSpace + 1) : "";

      const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
      rows.push(
        [q(country), q(String(teamNo)), q(teamName), q(firstName), q(surname), q(""), q("")].join(",")
      );
    }
  }

  const header = "Nation,TeamNo,TeamName,TeamMemberFirstName,TeamMemberSurname,IsVideographer,AssociationNo";
  const csv = [header, ...rows].join("\n");
  const safeName = (event.name as string).replace(/[^a-zA-Z0-9]/g, "_");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}_intime.csv"`,
    },
  });
}
