import Link from "next/link";
import EventsTabs from "@/components/EventsTabs";
import type { EventCardEvent } from "@/components/EventCard";
import { getDb } from "@/lib/db";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

function getEvents(): EventCardEvent[] {
  runSeed();
  const db = getDb();

  const events = db
    .prepare("SELECT * FROM event WHERE status = 'published' ORDER BY sort_order, start_date")
    .all() as Array<Record<string, unknown>>;

  const countStmt = db.prepare(
    "SELECT COUNT(*) as count FROM registration WHERE event_id = ? AND payment_status = 'completed'"
  );

  return events.map((e) => {
    const { count } = countStmt.get(e.id) as { count: number };
    return {
      id: e.id as number,
      name: e.name as string,
      type: e.type as EventCardEvent["type"],
      startDate: e.start_date as string | null,
      endDate: e.end_date as string | null,
      locationName: e.location_name as string | null,
      locationCity: e.location_city as string | null,
      coach: e.coach as string | null,
      description: e.description as string | null,
      bannerImageUrl: e.banner_image_url as string | null,
      capacity: e.capacity as number | null,
      status: e.status as EventCardEvent["status"],
      instructor: e.instructor as string | null,
      courseName: e.course_name as string | null,
      courseColor: e.course_color as string | null,
      registrationCount: count,
      isFull: e.capacity != null ? count >= (e.capacity as number) : false,
    };
  });
}

export default function EventsPage() {
  const events = getEvents();
  const meets = events.filter((e) => e.type === "meet" || e.type === "freestyle");
  const courses = events.filter((e) => e.type === "course");
  const other = events.filter((e) => e.type === "league" || e.type === "team");

  // Use the first published meet for the waiver link
  const firstMeet = meets[0] || events[0];
  const eventIdForWaiver = firstMeet?.id ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative py-16 px-4 text-center bg-gradient-to-b from-[#0f1629] to-background">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wider text-foreground uppercase">
          USCPA Competitions 2026
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          United States Canopy Piloting Association
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Registering a team?{" "}
          <Link
            href="/group-register"
            className="text-accent-cyan hover:underline font-medium"
          >
            Use Group Registration
          </Link>{" "}
          to register multiple people and pay with one card.
        </p>
      </header>

      {/* Content with Tabs */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <EventsTabs
          meets={meets}
          courses={courses}
          other={other}
          eventIdForWaiver={eventIdForWaiver}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} USCPA. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
