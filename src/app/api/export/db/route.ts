import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const API_KEY = process.env.EXPORT_API_KEY || "swoop-export-key-change-me";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const db = getDb();

  const competitors = db.prepare("SELECT * FROM competitor").all();
  const registrations = db.prepare("SELECT * FROM registration").all();
  const events = db.prepare("SELECT * FROM event").all();

  return NextResponse.json({ competitors, registrations, events });
}
