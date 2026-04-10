import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["draft", "published", "closed", "archived"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getDb();

    const existing = db.prepare("SELECT id FROM event WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    db.prepare(
      "UPDATE event SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, id);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("PATCH /api/admin/events/[id]/status error:", error);
    return NextResponse.json(
      { error: "Failed to update event status" },
      { status: 500 }
    );
  }
}
