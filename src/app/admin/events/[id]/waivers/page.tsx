"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Waiver {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone: string | null;
  total_jumps: number | null;
  jumps_last_12_months: number | null;
  canopy_type_and_size: string | null;
  jumps_on_canopy: number | null;
  is_minor: number;
  guardian_name: string | null;
  marketing_consent: number;
  signed_at: string;
  signature_data: string | null;
  ip_address: string | null;
  competitor_name: string | null;
}

export default function EventWaiversPage() {
  const params = useParams();
  const id = params.id as string;

  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchWaivers = async () => {
      try {
        const res = await fetch(`/api/admin/events/${id}/waivers`);
        if (!res.ok) {
          setError("Failed to load waivers");
          return;
        }
        const data = await res.json();
        setWaivers(data.waivers || []);
        setTotalCount(data.totalCount || 0);
      } catch {
        setError("Failed to load waivers");
      } finally {
        setLoading(false);
      }
    };

    fetchWaivers();
  }, [id]);

  const handleExportCSV = () => {
    window.location.href = `/api/admin/events/${id}/waivers?format=csv`;
  };

  const toggleExpand = (waiverId: number) => {
    setExpandedId(expandedId === waiverId ? null : waiverId);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--accent-cyan)]">Loading waivers...</div>
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
            <Link href={`/admin/events/${id}/registrations`} className="text-gray-400 hover:text-[var(--accent-cyan)] text-sm">
              Registrations
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 text-sm">Waivers</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Signed Waivers</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalCount} signed waiver{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${id}/registrations`}
            className="px-4 py-2 rounded-lg border border-[var(--card-border)] text-gray-300 hover:text-[var(--foreground)] hover:border-[var(--accent-cyan)] transition-colors text-sm"
          >
            Back to Registrations
          </Link>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium w-8"></th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">DOB</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Jumps</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Canopy</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Signed At</th>
              </tr>
            </thead>
            <tbody>
              {waivers.map((w) => (
                <>
                  <tr
                    key={w.id}
                    onClick={() => toggleExpand(w.id)}
                    className="border-b border-[var(--card-border)]/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-gray-500">
                      <span className={`inline-block transition-transform ${expandedId === w.id ? "rotate-90" : ""}`}>
                        &#9654;
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--foreground)]">
                      {w.first_name} {w.last_name}
                      {w.is_minor ? (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-700 text-yellow-100">
                          Minor
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-gray-400">{w.email}</td>
                    <td className="py-3 px-4 text-[var(--foreground)]">{formatDate(w.date_of_birth)}</td>
                    <td className="py-3 px-4 text-gray-400">{w.phone || "-"}</td>
                    <td className="py-3 px-4 text-[var(--foreground)]">{w.total_jumps ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-400">{w.canopy_type_and_size || "-"}</td>
                    <td className="py-3 px-4 text-gray-400">{formatDateTime(w.signed_at)}</td>
                  </tr>
                  {expandedId === w.id && (
                    <tr key={`${w.id}-details`} className="border-b border-[var(--card-border)]/50 bg-white/[0.01]">
                      <td colSpan={8} className="py-4 px-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 block">Jumps Last 12 Months</span>
                            <span className="text-[var(--foreground)]">{w.jumps_last_12_months ?? "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Jumps on Canopy</span>
                            <span className="text-[var(--foreground)]">{w.jumps_on_canopy ?? "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Marketing Consent</span>
                            <span className="text-[var(--foreground)]">{w.marketing_consent ? "Yes" : "No"}</span>
                          </div>
                          {w.is_minor ? (
                            <div>
                              <span className="text-gray-500 block">Guardian Name</span>
                              <span className="text-[var(--accent-gold)]">{w.guardian_name || "-"}</span>
                            </div>
                          ) : null}
                          {w.ip_address && (
                            <div>
                              <span className="text-gray-500 block">IP Address</span>
                              <span className="text-gray-400">{w.ip_address}</span>
                            </div>
                          )}
                        </div>
                        {w.signature_data && (
                          <div>
                            <span className="text-gray-500 block mb-2">Signature</span>
                            <div className="inline-block bg-white rounded-lg p-2">
                              <img
                                src={w.signature_data}
                                alt={`Signature of ${w.first_name} ${w.last_name}`}
                                className="max-h-24"
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {waivers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No signed waivers found.
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
