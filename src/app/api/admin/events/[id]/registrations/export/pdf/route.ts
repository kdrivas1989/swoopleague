import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateRegistrationPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = getDb();

  const event = db.prepare("SELECT * FROM event WHERE id = ?").get(Number(id)) as {
    name: string;
    start_date: string | null;
    end_date: string | null;
    location_name: string | null;
    location_city: string | null;
  } | undefined;

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registrations = db.prepare(`
    SELECT r.*, c.name, c.email
    FROM registration r
    JOIN competitor c ON c.id = r.competitor_id
    WHERE r.event_id = ?
    ORDER BY r.created_at
  `).all(Number(id)) as Array<{
    name: string;
    email: string;
    comp_class: string | null;
    wing_type: string | null;
    wing_size: string | null;
    wing_loading: string | null;
    degree_of_turn: string | null;
    country: string | null;
    payment_status: string;
    created_at: string;
  }>;

  const pdfBuffer = await generateRegistrationPdf(
    {
      name: event.name,
      startDate: event.start_date,
      endDate: event.end_date,
      locationName: event.location_name,
      locationCity: event.location_city,
    },
    registrations.map((r) => ({
      name: r.name,
      email: r.email,
      compClass: r.comp_class,
      wingType: r.wing_type,
      wingSize: r.wing_size,
      wingLoading: r.wing_loading,
      degreeOfTurn: r.degree_of_turn,
      country: r.country,
      paymentStatus: r.payment_status,
      createdAt: r.created_at,
    }))
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="registrations-event-${id}.pdf"`,
    },
  });
}
