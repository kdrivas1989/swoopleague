"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: number;
  competitorName: string;
  competitorEmail: string;
  compClass: string | null;
  paymentStatus: string;
  teamName: string | null;
}

interface Team {
  teamName: string | null;
  members: TeamMember[];
}

interface EventGroup {
  eventId: number;
  eventName: string;
  teams: Team[];
}

const PAYMENT_COLORS: Record<string, string> = {
  completed: "bg-green-700 text-green-100",
  pending: "bg-yellow-700 text-yellow-100",
  refunded: "bg-gray-600 text-gray-200",
  failed: "bg-red-700 text-red-100",
};

export default function AdminTeamsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditValue(member.teamName || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (registrationId: number) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          newTeamName: editValue.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setEditingId(null);
      setEditValue("");
      setLoading(true);
      await fetchTeams();
    } catch {
      setError("Failed to save team name");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--accent-cyan)]">Loading teams...</div>
      </div>
    );
  }

  const totalTeams = events.reduce((sum, ev) => sum + ev.teams.length, 0);
  const incompleteTeams = events.reduce(
    (sum, ev) => sum + ev.teams.filter((t) => t.members.length < 2).length,
    0
  );
  const unassigned = events.reduce(
    (sum, ev) =>
      sum + ev.teams.filter((t) => t.teamName === null).length,
    0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Team Management
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          View and fix team registrations across all team events
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Teams</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
            {totalTeams}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Incomplete (1 member)</p>
          <p className="text-2xl font-bold text-[var(--accent-gold)] mt-1">
            {incompleteTeams}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <p className="text-gray-400 text-sm">No Team Name</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{unassigned}</p>
        </div>
      </div>

      {events.length === 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-12 text-center text-gray-500">
          No team event registrations found.
        </div>
      )}

      {events.map((ev) => (
        <div key={ev.eventId} className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--accent-cyan)] mb-4">
            {ev.eventName}
          </h2>

          <div className="space-y-3">
            {ev.teams.map((team, idx) => {
              const isIncomplete = team.members.length < 2;
              const hasNoName = team.teamName === null;

              return (
                <div
                  key={`${team.teamName || "none"}-${idx}`}
                  className={`bg-[var(--card-bg)] border rounded-xl p-4 ${
                    isIncomplete || hasNoName
                      ? "border-[var(--accent-gold)]/60"
                      : "border-[var(--card-border)]"
                  }`}
                >
                  {/* Team header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-semibold text-[var(--foreground)]">
                      {team.teamName || (
                        <span className="italic text-gray-500">
                          No team name
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {team.members.length}/2 members
                    </span>
                    {isIncomplete && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] font-medium">
                        Incomplete
                      </span>
                    )}
                    {hasNoName && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-400 font-medium">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {/* Members table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--card-border)] text-left">
                          <th className="py-2 pr-4 text-gray-400 font-medium">
                            Name
                          </th>
                          <th className="py-2 pr-4 text-gray-400 font-medium">
                            Email
                          </th>
                          <th className="py-2 pr-4 text-gray-400 font-medium">
                            Class
                          </th>
                          <th className="py-2 pr-4 text-gray-400 font-medium">
                            Payment
                          </th>
                          <th className="py-2 pr-4 text-gray-400 font-medium">
                            Team Name
                          </th>
                          <th className="py-2 text-gray-400 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-[var(--card-border)]/30"
                          >
                            <td className="py-2 pr-4 text-[var(--foreground)]">
                              {member.competitorName}
                            </td>
                            <td className="py-2 pr-4 text-gray-400">
                              {member.competitorEmail}
                            </td>
                            <td className="py-2 pr-4 text-[var(--foreground)]">
                              {member.compClass || (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  PAYMENT_COLORS[member.paymentStatus] ||
                                  "bg-gray-600 text-gray-200"
                                }`}
                              >
                                {member.paymentStatus}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              {editingId === member.id ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(member.id);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  autoFocus
                                  className="w-full px-2 py-1 rounded bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                                  placeholder="Enter team name"
                                />
                              ) : (
                                <span className="text-[var(--foreground)]">
                                  {member.teamName || (
                                    <span className="italic text-gray-600">
                                      none
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              {editingId === member.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => saveEdit(member.id)}
                                    disabled={saving}
                                    className="px-2 py-1 rounded text-xs font-medium bg-green-800/50 text-green-300 border border-green-700 hover:bg-green-700/50 transition-colors disabled:opacity-50"
                                  >
                                    {saving ? "..." : "Save"}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    disabled={saving}
                                    className="px-2 py-1 rounded text-xs font-medium bg-[var(--input-bg)] text-gray-400 border border-[var(--input-border)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEdit(member)}
                                  className="px-2 py-1 rounded text-xs font-medium bg-[var(--input-bg)] text-[var(--accent-cyan)] border border-[var(--input-border)] hover:border-[var(--accent-cyan)] transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
