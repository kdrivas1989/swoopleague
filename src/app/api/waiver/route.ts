import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      eventId,
      firstName,
      lastName,
      email,
      dateOfBirth,
      phone,
      totalJumps,
      jumpsLast12Months,
      canopyTypeAndSize,
      jumpsOnCanopy,
      initials,
      signatureData,
      guardianName,
      guardianSignatureData,
      isMinor,
      marketingConsent,
    } = body;

    // Validate required fields
    if (!eventId || !firstName || !lastName || !email || !dateOfBirth || !initials || !signatureData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate event exists
    const event = db.prepare("SELECT id FROM event WHERE id = ?").get(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate age / is_minor flag
    const dob = new Date(dateOfBirth + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    const computedMinor = age < 18 ? 1 : 0;

    // If minor, guardian fields required
    if (computedMinor && (!guardianName || !guardianSignatureData)) {
      return NextResponse.json(
        { error: "Guardian name and signature are required for minors" },
        { status: 400 }
      );
    }

    // Create or find competitor by email
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    db.prepare(
      `INSERT INTO competitor (email, name) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name`
    ).run(email.trim(), fullName);

    const competitor = db
      .prepare("SELECT id FROM competitor WHERE email = ?")
      .get(email.trim()) as { id: number };

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : null;

    // Insert waiver record
    const result = db.prepare(
      `INSERT INTO waiver (
        competitor_id, event_id, first_name, last_name, email,
        date_of_birth, phone, total_jumps, jumps_last_12_months,
        canopy_type_and_size, jumps_on_canopy, initials, signature_data,
        guardian_name, guardian_signature_data, is_minor, marketing_consent,
        ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      competitor.id,
      eventId,
      firstName.trim(),
      lastName.trim(),
      email.trim(),
      dateOfBirth,
      phone || null,
      totalJumps != null ? Number(totalJumps) : null,
      jumpsLast12Months != null ? Number(jumpsLast12Months) : null,
      canopyTypeAndSize || null,
      jumpsOnCanopy != null ? Number(jumpsOnCanopy) : null,
      initials,
      signatureData,
      guardianName || null,
      guardianSignatureData || null,
      computedMinor,
      marketingConsent ? 1 : 0,
      ipAddress
    );

    const waiverId = Number(result.lastInsertRowid);

    return NextResponse.json({
      waiverId,
      competitorId: competitor.id,
    });
  } catch (error) {
    console.error("POST /api/waiver error:", error);
    return NextResponse.json(
      { error: "Waiver submission failed" },
      { status: 500 }
    );
  }
}
