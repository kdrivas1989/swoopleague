import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const db = getDb();

    const event = db.prepare("SELECT * FROM event WHERE id = ?").get(Number(id)) as
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
      .all(Number(id)) as Array<Record<string, unknown>>;

    // Class-based numbering: sport=100s, intermediate=200s, advanced=300s, pro/open=400s
    const classBase: Record<string, number> = {
      sport: 100,
      intermediate: 200,
      advanced: 300,
      pro: 400,
      open: 400,
    };

    // Group by class, then assign TeamNo per country within each class
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

        // Extract meet number from event name (e.g. "Meet #1 Registration 2026" -> "1")
        const meetMatch = (event.name as string).match(/#(\d+)/);
        const meetNum = meetMatch ? meetMatch[1] : "1";
        const year = new Date().getFullYear();

        // Class abbreviation
        const classAbbrev: Record<string, string> = {
          sport: "SPT",
          intermediate: "INT",
          advanced: "ADV",
          pro: "OPEN",
          open: "OPEN",
        };
        const abbrev = classAbbrev[cls] || cls.toUpperCase();

        // TeamName: "2026 1 INT" for USA, "CAN 2026 1 INT" for non-USA
        const teamName =
          country === "USA"
            ? `${year} ${meetNum} ${abbrev}`
            : `${country} ${year} ${meetNum} ${abbrev}`;

        // Split name into first + surname on last space
        const fullName = (r.competitor_name as string) || "";
        const lastSpace = fullName.lastIndexOf(" ");
        let firstName: string;
        let surname: string;
        if (lastSpace > 0) {
          firstName = fullName.substring(0, lastSpace);
          surname = fullName.substring(lastSpace + 1);
        } else {
          firstName = fullName;
          surname = "";
        }

        const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
        rows.push(
          [
            q(country),
            q(String(teamNo)),
            q(teamName),
            q(firstName),
            q(surname),
            q(""),
            q(""),
          ].join(",")
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
  } catch (error) {
    console.error("GET /api/admin/events/[id]/registrations/export/intime error:", error);
    return NextResponse.json(
      { error: "Failed to export InTime CSV" },
      { status: 500 }
    );
  }
}
