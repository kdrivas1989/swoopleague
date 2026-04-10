import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      admin: { id: session.adminId, email: session.email, name: session.name },
    });
  } catch (error) {
    console.error("GET /api/admin/session error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
