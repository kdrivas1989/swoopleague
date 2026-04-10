"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Registration {
  id: number;
  competitor_name: string;
  competitor_email: string;
  membership_tier: string;
  comp_class: string | null;
  wing_type: string | null;
  wing_size: string | null;
  wing_loading: string | null;
  degree_of_turn: string | null;
  country: string | null;
  payment_status: string;
  price_cents: number;
  created_at: string;
  waiver_signed: number | null;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-700 text-yellow-100",
  completed: "bg-green-700 text-green-100",
  refunded: "bg-gray-600 text-gray-200",
  failed: "bg-red-700 text-red-100",
};

export default function EventRegistrationsPage() {
  const params = useParams();
  const id = params.id as string;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refunding, setRefunding] = useState<number | null>(null);

  // Filters
  const [classFilter, setClassFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const fetchRegistrations = async () => {
    try {
      const searchParams = new URLSearchParams();
      if (classFilter) searchParams.set("class", classFilter);
      if (tierFilter) searchParams.set("tier", tierFilter);
      if (countryFilter) searchParams.set("country", countryFilter);

      const queryStr = searchParams.toString();
      const res = await fetch(
        `/api/admin/events/${id}/registrations${queryStr ? `?${queryStr}` : ""}`
      );
      if (!res.ok) {
        setError("Failed to load registrations");
        return;
      }
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      setError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [id, classFilter, tierFilter, countryFilter]);

  const handleRefund = async (regId: number) => {
    if (!confirm("Are you sure you want to refund this registration?")) return;
    setRefunding(regId);
    try {
      const res = await fetch(`/api/admin/registrations/${regId}/refund`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Refund failed");
        return;
      }
      fetchRegistrations();
    } catch {
      alert("Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/admin/events/${id}/registrations/export/csv`;
  };

  const handleExportInTime = () => {
    window.location.href = `/api/admin/events/${id}/registrations/export/intime`;
  };

  const handleExportWaivers = () => {
    window.location.href = `/api/admin/events/${id}/waivers?format=csv`;
  };

  // Get unique values for filter dropdowns
  const uniqueClasses = [...new Set(registrations.map((r) => r.comp_class).filter(Boolean))] as string[];
  const uniqueTiers = [...new Set(registrations.map((r) => r.membership_tier))] as string[];
  const uniqueCountries = [...new Set(registrations.map((r) => r.country).filter(Boolean))] as string[];

  const selectClass =
    "px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent-cyan)]";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--accent-cyan)]">Loading registrations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-gray-400 hover:text-[var(--accent-cyan)] text-sm">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-[var(--accent-cyan)] text-sm">
              Event
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 text-sm">Registrations</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Registrations</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalCount} total registration{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Export All (CSV)
          </button>
          <button
            onClick={handleExportInTime}
            className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Export InTime
          </button>
          <button
            onClick={handleExportWaivers}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Export Waivers
          </button>
          <Link
            href={`/admin/events/${id}/waivers`}
            className="px-4 py-2 rounded-lg border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-semibold hover:bg-[var(--accent-cyan)] hover:text-black transition-colors text-sm"
          >
            View Waivers
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All Tiers</option>
          {uniqueTiers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All Countries</option>
          {uniqueCountries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {(tierFilter || classFilter || countryFilter) && (
          <button
            onClick={() => {
              setTierFilter("");
              setClassFilter("");
              setCountryFilter("");
            }}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-[var(--foreground)] border border-[var(--input-border)] hover:border-[var(--card-border)] transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Registrations table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Tier</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Class</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Wing</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Country</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Waiver</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Payment</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="border-b border-[var(--card-border)]/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 text-[var(--foreground)]">
                    {reg.competitor_name}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{reg.competitor_email}</td>
                  <td className="py-3 px-4 text-[var(--foreground)] capitalize">
                    {reg.membership_tier}
                  </td>
                  <td className="py-3 px-4 text-[var(--foreground)] capitalize">
                    {reg.comp_class || "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {reg.wing_type && (
                      <div>
                        {reg.wing_type} {reg.wing_size}
                        {reg.wing_loading && (
                          <span className="text-gray-500"> ({reg.wing_loading} WL)</span>
                        )}
                      </div>
                    )}
                    {reg.degree_of_turn && (
                      <div className="text-gray-500">{reg.degree_of_turn}</div>
                    )}
                    {!reg.wing_type && "-"}
                  </td>
                  <td className="py-3 px-4 text-[var(--foreground)]">
                    {reg.country || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {reg.waiver_signed ? (
                      <span className="text-green-400 text-lg" title="Waiver signed">&#10003;</span>
                    ) : (
                      <span className="text-red-400 text-lg" title="No waiver">&#10007;</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        PAYMENT_STATUS_COLORS[reg.payment_status] || "bg-gray-600 text-gray-200"
                      }`}
                    >
                      {reg.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--foreground)]">
                    ${(reg.price_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {reg.payment_status === "completed" && (
                      <button
                        onClick={() => handleRefund(reg.id)}
                        disabled={refunding === reg.id}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-red-800/50 text-red-300 border border-red-700 hover:bg-red-700/50 transition-colors disabled:opacity-50"
                      >
                        {refunding === reg.id ? "..." : "Refund"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    No registrations found.
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
