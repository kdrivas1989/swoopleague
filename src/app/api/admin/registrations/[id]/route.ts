import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const body = await request.json();
    const {
      membership_tier,
      comp_class,
      wing_type,
      wing_size,
      wing_loading,
      degree_of_turn,
      country,
    } = body;

    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM registration WHERE id = ?")
      .get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    db.prepare(
      `UPDATE registration SET
        membership_tier = COALESCE(?, membership_tier),
        comp_class = COALESCE(?, comp_class),
        wing_type = COALESCE(?, wing_type),
        wing_size = COALESCE(?, wing_size),
        wing_loading = COALESCE(?, wing_loading),
        degree_of_turn = COALESCE(?, degree_of_turn),
        country = COALESCE(?, country),
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      membership_tier ?? null,
      comp_class ?? null,
      wing_type ?? null,
      wing_size ?? null,
      wing_loading ?? null,
      degree_of_turn ?? null,
      country ?? null,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/registrations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}
