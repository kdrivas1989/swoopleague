import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const db = getDb();

    const rows = db
      .prepare(
        `SELECT r.id, r.team_name, r.comp_class, r.payment_status, r.event_id,
                c.name AS competitor_name, c.email AS competitor_email,
                e.name AS event_name
         FROM registration r
         JOIN competitor c ON c.id = r.competitor_id
         JOIN event e ON e.id = r.event_id
         WHERE e.type = 'team'
         ORDER BY e.name, r.team_name, c.name`
      )
      .all() as Array<{
      id: number;
      team_name: string | null;
      comp_class: string | null;
      payment_status: string;
      event_id: number;
      competitor_name: string;
      competitor_email: string;
      event_name: string;
    }>;

    // Group by event, then by team_name
    const eventMap = new Map<
      number,
      {
        eventId: number;
        eventName: string;
        teams: Map<
          string,
          Array<{
            id: number;
            competitorName: string;
            competitorEmail: string;
            compClass: string | null;
            paymentStatus: string;
            teamName: string | null;
          }>
        >;
      }
    >();

    for (const row of rows) {
      if (!eventMap.has(row.event_id)) {
        eventMap.set(row.event_id, {
          eventId: row.event_id,
          eventName: row.event_name,
          teams: new Map(),
        });
      }
      const event = eventMap.get(row.event_id)!;
      const key = row.team_name || `__unassigned_${row.id}`;

      if (!event.teams.has(key)) {
        event.teams.set(key, []);
      }
      event.teams.get(key)!.push({
        id: row.id,
        competitorName: row.competitor_name,
        competitorEmail: row.competitor_email,
        compClass: row.comp_class,
        paymentStatus: row.payment_status,
        teamName: row.team_name,
      });
    }

    // Convert to plain objects for JSON
    const events = Array.from(eventMap.values()).map((ev) => ({
      eventId: ev.eventId,
      eventName: ev.eventName,
      teams: Array.from(ev.teams.entries()).map(([teamName, members]) => ({
        teamName: teamName.startsWith("__unassigned_") ? null : teamName,
        members,
      })),
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/admin/teams error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { registrationId, newTeamName } = body;

    if (!registrationId || typeof registrationId !== "number") {
      return NextResponse.json(
        { error: "registrationId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM registration WHERE id = ?")
      .get(registrationId);
    if (!existing) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    db.prepare(
      `UPDATE registration SET team_name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newTeamName || null, registrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/teams error:", error);
    return NextResponse.json(
      { error: "Failed to update team name" },
      { status: 500 }
    );
  }
}
