"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EventRow {
  id: number;
  name: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  registrationCount: number;
  capacity: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-600 text-gray-200",
  published: "bg-green-700 text-green-100",
  closed: "bg-red-700 text-red-100",
  archived: "bg-gray-700 text-gray-300",
};

const TYPE_COLORS: Record<string, string> = {
  meet: "bg-blue-700 text-blue-100",
  league: "bg-purple-700 text-purple-100",
  freestyle: "bg-amber-700 text-amber-100",
  team: "bg-teal-700 text-teal-100",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusChange = async (eventId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch {
      setError("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--accent-cyan)]">Loading events...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your events and registrations</p>
        </div>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          + New Event
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Events</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{events.length}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {events.filter((e) => e.status === "published").length}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Registrations</p>
          <p className="text-2xl font-bold text-[var(--accent-gold)] mt-1">
            {events.reduce((sum, e) => sum + e.registrationCount, 0)}
          </p>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Event</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Registrations</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-[var(--card-border)]/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-[var(--foreground)]">{event.name}</div>
                    {event.start_date && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {event.start_date}
                        {event.end_date && event.end_date !== event.start_date
                          ? ` - ${event.end_date}`
                          : ""}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        TYPE_COLORS[event.type] || "bg-gray-600 text-gray-200"
                      }`}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[event.status] || "bg-gray-600 text-gray-200"
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--foreground)]">
                    {event.registrationCount}
                    {event.capacity != null && (
                      <span className="text-gray-500"> / {event.capacity}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--input-bg)] text-[var(--accent-cyan)] border border-[var(--input-border)] hover:border-[var(--accent-cyan)] transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/registrations`}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--input-bg)] text-[var(--accent-gold)] border border-[var(--input-border)] hover:border-[var(--accent-gold)] transition-colors"
                      >
                        Registrations
                      </Link>
                      {event.status === "draft" && (
                        <button
                          onClick={() => handleStatusChange(event.id, "published")}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-green-800/50 text-green-300 border border-green-700 hover:bg-green-700/50 transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      {event.status === "published" && (
                        <button
                          onClick={() => handleStatusChange(event.id, "closed")}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-red-800/50 text-red-300 border border-red-700 hover:bg-red-700/50 transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No events yet. Create your first event to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
