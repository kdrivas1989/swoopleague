import Link from "next/link";
import Image from "next/image";
import { getCourseColorHex } from "@/data/course-colors";

export interface EventCardEvent {
  id: number;
  name: string;
  type: "meet" | "league" | "freestyle" | "team" | "course";
  instructor?: string | null;
  courseName?: string | null;
  courseColor?: string | null;
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  locationCity: string | null;
  coach: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  capacity: number | null;
  registrationCount: number;
  status: "draft" | "published" | "closed" | "archived";
  isFull: boolean;
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate) return null;

  const start = new Date(startDate + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };

  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  }

  const end = new Date(endDate + "T00:00:00");
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", opts)} - ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

interface EventCardProps {
  event: EventCardEvent;
  showSlots?: boolean;
}

export default function EventCard({ event, showSlots = false }: EventCardProps) {
  const isLeagueOrTeam = event.type === "league" || event.type === "team";
  const isCourse = event.type === "course";
  const dateStr = !isLeagueOrTeam ? formatDateRange(event.startDate, event.endDate) : null;
  const registrationClosed = event.isFull || event.status === "closed";

  const courseColorHex = isCourse ? getCourseColorHex(event.courseColor ?? null) : null;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden flex flex-col">
      {/* Course color stripe */}
      {isCourse && courseColorHex && (
        <div
          className="h-2 w-full"
          style={{ backgroundColor: courseColorHex }}
        />
      )}

      {event.bannerImageUrl && (
        <div className="relative aspect-video w-full">
          <Image
            src={event.bannerImageUrl}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Course color badge */}
        {isCourse && event.courseColor && (
          <span
            className="inline-block self-start px-3 py-0.5 rounded-full text-xs font-bold uppercase mb-2 text-black"
            style={{ backgroundColor: courseColorHex ?? undefined }}
          >
            {event.courseColor}
          </span>
        )}

        <h3
          className="font-bold text-xl mb-2"
          style={isCourse && courseColorHex ? { color: courseColorHex } : undefined}
        >
          {isCourse && event.courseName ? event.courseName : event.name}
        </h3>

        {dateStr && <p className="text-sm text-gray-400 mb-1">{dateStr}</p>}

        {!isLeagueOrTeam && event.locationName && (
          <p className="text-sm text-gray-400 mb-1">
            {event.locationName}
            {event.locationCity ? `, ${event.locationCity}` : ""}
          </p>
        )}

        {isCourse && event.instructor && (
          <p className="text-sm text-gray-400 mb-1">
            Instructor: <span className="text-accent-gold">{event.instructor}</span>
          </p>
        )}

        {showSlots && isCourse && event.capacity && (
          <p className="text-sm text-gray-400 mb-1">
            Slots: <span className="text-foreground">{event.registrationCount}/{event.capacity}</span>
          </p>
        )}

        {!isCourse && event.coach && (
          <p className="text-sm text-gray-400 mb-2">
            Coach: <span className="text-accent-gold">{event.coach}</span>
          </p>
        )}

        {event.description && (
          <p className={`text-sm text-gray-300 mb-4 flex-1 ${isCourse ? "" : "line-clamp-2"}`}>
            {event.description}
          </p>
        )}

        {!event.description && <div className="flex-1" />}

        <div className="mt-auto pt-2">
          {registrationClosed ? (
            <span className="inline-block rounded-full bg-gray-700 px-4 py-2 text-sm font-medium text-gray-400">
              Registration Closed
            </span>
          ) : (
            <Link
              href={`/events/${event.id}/register`}
              className="inline-block rounded-lg bg-accent-cyan px-6 py-2 text-sm font-bold text-black hover:opacity-90 transition-opacity"
            >
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
