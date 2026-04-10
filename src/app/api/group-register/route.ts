import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runSeed } from "@/lib/seed";
import { createPaymentIntent, formatCents } from "@/lib/stripe";

export const dynamic = "force-dynamic";

interface CompetitorInput {
  name: string;
  email: string;
  country: string;
  membershipTier: "member" | "non-member" | "sport";
  compClass?: string;
  wingType?: string;
  wingSize?: string;
  wingLoading?: string;
  degreeOfTurn?: string;
  teamName?: string;
  eventIds: number[];
}

interface LineItem {
  competitorName: string;
  competitorEmail: string;
  eventName: string;
  eventId: number;
  priceCents: number;
  priceFormatted: string;
  registrationId: number;
}

export async function POST(request: Request) {
  try {
    runSeed();
    const db = getDb();

    const body = await request.json();

    // Support both new per-competitor eventIds and legacy flat eventIds
    let competitors: CompetitorInput[];
    if (body.competitors && body.competitors.length > 0 && Array.isArray(body.competitors[0]?.eventIds)) {
      // New format: each competitor has their own eventIds
      competitors = body.competitors as CompetitorInput[];
    } else {
      // Legacy format: flat eventIds array shared by all competitors
      const legacyEventIds = body.eventIds as number[];
      competitors = (body.competitors as Omit<CompetitorInput, "eventIds">[]).map((c) => ({
        ...c,
        eventIds: legacyEventIds,
      }));
    }

    const { payerName, payerEmail } = body as {
      payerName: string;
      payerEmail: string;
    };

    // Validate required fields
    if (!payerName || !payerEmail) {
      return NextResponse.json(
        { error: "Payer name and email are required" },
        { status: 400 }
      );
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json(
        { error: "At least one competitor is required" },
        { status: 400 }
      );
    }

    // Collect all unique event IDs across all competitors
    const allEventIds = new Set<number>();
    for (const comp of competitors) {
      if (!comp.eventIds || comp.eventIds.length === 0) {
        return NextResponse.json(
          { error: `At least one event must be selected for competitor: ${comp.name || "unknown"}` },
          { status: 400 }
        );
      }
      for (const id of comp.eventIds) {
        allEventIds.add(id);
      }
    }

    // Fetch all referenced events
    const uniqueIds = Array.from(allEventIds);
    const placeholders = uniqueIds.map(() => "?").join(",");
    const events = db
      .prepare(
        `SELECT * FROM event WHERE id IN (${placeholders}) AND status = 'published'`
      )
      .all(...uniqueIds) as Array<Record<string, unknown>>;

    if (events.length !== uniqueIds.length) {
      return NextResponse.json(
        { error: "One or more selected events are not available" },
        { status: 400 }
      );
    }

    const eventsMap = new Map<number, Record<string, unknown>>();
    for (const ev of events) {
      eventsMap.set(ev.id as number, ev);
    }

    // Calculate price for a competitor + event combination
    function calcPrice(
      competitor: CompetitorInput,
      event: Record<string, unknown>
    ): number {
      const eventType = event.type as string;

      if (
        eventType === "course" ||
        eventType === "league" ||
        eventType === "team"
      ) {
        const flat = event.flat_price_cents as number | null;
        if (!flat) throw new Error(`No price configured for event: ${event.name}`);
        return flat;
      }

      // Meets and freestyle: member vs non-member pricing, with late surcharge
      const isLate = event.late_registration_date
        ? new Date() >= new Date(event.late_registration_date as string)
        : false;

      if (isLate && event.late_price_cents) {
        return event.late_price_cents as number;
      }

      if (
        competitor.membershipTier === "member" ||
        competitor.membershipTier === "sport"
      ) {
        return (event.member_price_cents as number) || 7500;
      }

      return (event.non_member_price_cents as number) || 9500;
    }

    // Validate wing fields for meet/freestyle events
    for (const comp of competitors) {
      if (!comp.name || !comp.email || !comp.membershipTier || !comp.country) {
        return NextResponse.json(
          { error: `Missing required fields for competitor: ${comp.name || "unknown"}` },
          { status: 400 }
        );
      }

      for (const eventId of comp.eventIds) {
        const event = eventsMap.get(eventId)!;
        const eventType = event.type as string;
        if (eventType === "meet" || eventType === "freestyle") {
          if (!comp.compClass || !comp.wingType || !comp.wingSize || !comp.wingLoading || !comp.degreeOfTurn) {
            return NextResponse.json(
              {
                error: `Wing details and comp class are required for ${comp.name} in meet/freestyle events`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Calculate all line items and grand total
    const lineItems: LineItem[] = [];
    let grandTotal = 0;

    for (const comp of competitors) {
      for (const eventId of comp.eventIds) {
        const event = eventsMap.get(eventId)!;
        const price = calcPrice(comp, event);
        grandTotal += price;
        lineItems.push({
          competitorName: comp.name,
          competitorEmail: comp.email,
          eventName: event.name as string,
          eventId,
          priceCents: price,
          priceFormatted: formatCents(price),
          registrationId: 0, // will be filled below
        });
      }
    }

    // Create group_registration record
    const groupResult = db
      .prepare(
        `INSERT INTO group_registration (payer_name, payer_email, total_cents, payment_status)
         VALUES (?, ?, ?, 'pending')`
      )
      .run(payerName, payerEmail, grandTotal);

    const groupId = Number(groupResult.lastInsertRowid);

    // Create Stripe PaymentIntent for the grand total
    const paymentIntent = await createPaymentIntent(grandTotal, {
      groupRegistrationId: String(groupId),
      payerEmail,
    });

    // Update group with stripe PI id
    db.prepare(
      `UPDATE group_registration SET stripe_payment_intent_id = ? WHERE id = ?`
    ).run(paymentIntent.id, groupId);

    // Create registrations and payment records
    let lineIdx = 0;
    for (const comp of competitors) {
      // Upsert competitor
      db.prepare(
        `INSERT INTO competitor (email, name) VALUES (?, ?)
         ON CONFLICT(email) DO UPDATE SET name = excluded.name`
      ).run(comp.email, comp.name);

      const competitor = db
        .prepare(`SELECT * FROM competitor WHERE email = ?`)
        .get(comp.email) as Record<string, unknown>;

      for (const eventId of comp.eventIds) {
        const event = eventsMap.get(eventId)!;
        const eventType = event.type as string;
        const price = lineItems[lineIdx].priceCents;

        // Check for duplicate registration
        const existingReg = db
          .prepare(
            `SELECT id FROM registration WHERE event_id = ? AND competitor_id = ?`
          )
          .get(eventId, competitor.id);

        if (existingReg) {
          // Skip duplicates silently for group registration
          lineItems[lineIdx].registrationId = (existingReg as { id: number }).id;
          lineIdx++;
          continue;
        }

        const isCompEvent = eventType === "meet" || eventType === "freestyle";

        const regResult = db
          .prepare(
            `INSERT INTO registration (event_id, competitor_id, membership_tier, comp_class, wing_type, wing_size, wing_loading, degree_of_turn, country, price_cents, payment_status, group_registration_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
          )
          .run(
            eventId,
            competitor.id,
            comp.membershipTier,
            isCompEvent ? (comp.compClass || null) : null,
            isCompEvent ? (comp.wingType || null) : null,
            isCompEvent ? (comp.wingSize || null) : null,
            isCompEvent ? (comp.wingLoading || null) : null,
            isCompEvent ? (comp.degreeOfTurn || null) : null,
            comp.country || null,
            price,
            groupId
          );

        const registrationId = Number(regResult.lastInsertRowid);
        lineItems[lineIdx].registrationId = registrationId;

        // Create payment record
        db.prepare(
          `INSERT INTO payment (registration_id, provider, provider_payment_id, amount_cents, currency, status)
           VALUES (?, 'stripe', ?, ?, 'usd', 'pending')`
        ).run(registrationId, paymentIntent.id, price);

        lineIdx++;
      }
    }

    return NextResponse.json({
      groupId,
      clientSecret: paymentIntent.client_secret,
      totalCents: grandTotal,
      totalFormatted: formatCents(grandTotal),
      lineItems: lineItems.map((li) => ({
        competitor: li.competitorName,
        event: li.eventName,
        price: li.priceFormatted,
        priceCents: li.priceCents,
        registrationId: li.registrationId,
      })),
    });
  } catch (error) {
    console.error("POST /api/group-register error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Group registration failed" },
      { status: 500 }
    );
  }
}
