import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runSeed } from "@/lib/seed";
import { createPaymentIntent, formatCents } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    runSeed();
    const db = getDb();

    const body = await request.json();
    const {
      eventId,
      name,
      email,
      membershipTier,
      compClass,
      wingType,
      wingSize,
      wingLoading,
      degreeOfTurn,
      country,
      waiverId,
      teamName,
    } = body;

    // Validate required fields
    if (!eventId || !name || !email || !membershipTier) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, name, email, membershipTier" },
        { status: 400 }
      );
    }

    // Fetch event
    const event = db.prepare(`SELECT * FROM event WHERE id = ?`).get(eventId) as
      | Record<string, unknown>
      | undefined;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not open for registration" },
        { status: 400 }
      );
    }

    // Check capacity
    const { count: regCount } = db
      .prepare(
        `SELECT COUNT(*) as count FROM registration WHERE event_id = ? AND payment_status = 'completed'`
      )
      .get(eventId) as { count: number };

    if (event.capacity != null && regCount >= (event.capacity as number)) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }

    // Validate team fields
    const eventType = event.type as string;
    if (eventType === "team") {
      if (!teamName?.trim()) {
        return NextResponse.json(
          { error: "Team name is required for team registration" },
          { status: 400 }
        );
      }
      if (!compClass) {
        return NextResponse.json(
          { error: "Comp class is required for team registration" },
          { status: 400 }
        );
      }

      // Check if team already has 2 members
      const { count: teamCount } = db
        .prepare(
          `SELECT COUNT(*) as count FROM registration
           WHERE event_id = ? AND team_name = ? AND payment_status IN ('pending', 'completed')`
        )
        .get(eventId, teamName.trim()) as { count: number };

      if (teamCount >= 2) {
        return NextResponse.json(
          { error: `Team "${teamName.trim()}" already has 2 members registered` },
          { status: 400 }
        );
      }
    }

    // Validate wing fields for meet/freestyle events
    if (eventType === "meet" || eventType === "freestyle") {
      if (!compClass) {
        return NextResponse.json(
          { error: "compClass is required for meet/freestyle events" },
          { status: 400 }
        );
      }
      if (!wingType || !wingSize || !wingLoading || !degreeOfTurn) {
        return NextResponse.json(
          {
            error:
              "wingType, wingSize, wingLoading, and degreeOfTurn are required for meet/freestyle events",
          },
          { status: 400 }
        );
      }
    }

    // Look up price
    let priceCents: number;
    if (eventType === "course" || eventType === "league" || eventType === "team") {
      // Flat-price events
      priceCents = event.flat_price_cents as number;
      if (!priceCents) {
        return NextResponse.json(
          { error: "No price configured for this event" },
          { status: 400 }
        );
      }
    } else {
      // Meets and freestyle: member vs non-member pricing, with late surcharge
      const isLate = event.late_registration_date
        ? new Date() >= new Date(event.late_registration_date as string)
        : false;

      if (isLate && event.late_price_cents) {
        priceCents = event.late_price_cents as number;
      } else if (membershipTier === "member" || membershipTier === "sport") {
        priceCents = (event.member_price_cents as number) || 7500;
      } else {
        priceCents = (event.non_member_price_cents as number) || 9500;
      }
    }

    // Upsert competitor
    db.prepare(
      `INSERT INTO competitor (email, name) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name`
    ).run(email, name);

    const competitor = db
      .prepare(`SELECT * FROM competitor WHERE email = ?`)
      .get(email) as Record<string, unknown>;

    // Check for duplicate registration
    const existingReg = db
      .prepare(
        `SELECT id FROM registration WHERE event_id = ? AND competitor_id = ?`
      )
      .get(eventId, competitor.id);

    if (existingReg) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }

    // Create registration
    const regResult = db
      .prepare(
        `INSERT INTO registration (event_id, competitor_id, membership_tier, comp_class, wing_type, wing_size, wing_loading, degree_of_turn, country, price_cents, payment_status, team_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
      )
      .run(
        eventId,
        competitor.id,
        membershipTier,
        compClass || null,
        wingType || null,
        wingSize || null,
        wingLoading || null,
        degreeOfTurn || null,
        country || null,
        priceCents,
        teamName?.trim() || null
      );

    const registrationId = regResult.lastInsertRowid;

    // Link waiver to registration if provided
    if (waiverId) {
      db.prepare(
        "UPDATE waiver SET registration_id = ? WHERE id = ?"
      ).run(registrationId, waiverId);
      db.prepare(
        "UPDATE registration SET waiver_signed = 1 WHERE id = ?"
      ).run(registrationId);
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await createPaymentIntent(priceCents, {
      registrationId: String(registrationId),
      eventId: String(eventId),
      competitorEmail: email,
    });

    // Create payment record
    db.prepare(
      `INSERT INTO payment (registration_id, provider, provider_payment_id, amount_cents, currency, status)
       VALUES (?, 'stripe', ?, ?, 'usd', 'pending')`
    ).run(registrationId, paymentIntent.id, priceCents);

    return NextResponse.json({
      registrationId: Number(registrationId),
      clientSecret: paymentIntent.client_secret,
      priceCents,
      priceFormatted: formatCents(priceCents),
    });
  } catch (error) {
    console.error("POST /api/register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
