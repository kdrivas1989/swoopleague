"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Registration {
  id: number;
  competitorName: string;
  competitorEmail: string;
  eventName: string;
  eventType: string;
  compClass: string | null;
  priceCents: number;
  priceFormatted: string;
  paymentStatus: string;
}

interface GroupData {
  group: {
    id: number;
    payerName: string;
    payerEmail: string;
    totalCents: number;
    totalFormatted: string;
    paymentStatus: string;
    createdAt: string;
  };
  registrations: Registration[];
}

export default function GroupConfirmationPage() {
  const searchParams = useSearchParams();
  const groupId = searchParams.get("group");
  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) {
      setError("No group registration ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/group-register/confirmation?groupId=${groupId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load group registration details");
        setLoading(false);
      });
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading confirmation...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Something went wrong"}</p>
          <Link
            href="/events"
            className="text-[var(--accent-cyan)] hover:underline text-sm"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const { group, registrations } = data;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="relative py-12 px-4 text-center bg-gradient-to-b from-[#0f1629] to-[var(--background)]">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-white uppercase">
          Registration Complete
        </h1>
        <p className="mt-3 text-gray-400">
          Your group registration has been submitted successfully.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Payer Info */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Payer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="text-white ml-2">{group.payerName}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="text-white ml-2">{group.payerEmail}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span
                className={`ml-2 font-medium ${
                  group.paymentStatus === "completed"
                    ? "text-green-400"
                    : group.paymentStatus === "pending"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {group.paymentStatus.charAt(0).toUpperCase() + group.paymentStatus.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Date:</span>
              <span className="text-white ml-2">
                {new Date(group.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-3 pr-4 text-gray-400 font-medium">Competitor</th>
                  <th className="text-left py-3 pr-4 text-gray-400 font-medium">Event</th>
                  <th className="text-left py-3 pr-4 text-gray-400 font-medium">Class</th>
                  <th className="text-right py-3 pr-4 text-gray-400 font-medium">Price</th>
                  <th className="text-right py-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-[var(--card-border)]/50"
                  >
                    <td className="py-2.5 pr-4 text-white">{reg.competitorName}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{reg.eventName}</td>
                    <td className="py-2.5 pr-4 text-gray-400 capitalize">
                      {reg.compClass || "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-white">{reg.priceFormatted}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          reg.paymentStatus === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : reg.paymentStatus === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {reg.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 pr-4 text-right text-white font-bold">
                    Grand Total
                  </td>
                  <td className="pt-4 pr-4 text-right text-[var(--accent-gold)] font-bold text-lg">
                    {group.totalFormatted}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Waiver Note */}
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 mb-6">
          <p className="text-yellow-400 text-sm font-medium mb-1">Waivers Required</p>
          <p className="text-gray-400 text-sm">
            Each competitor must sign an individual waiver before competing. Waivers can be signed
            from the event registration page.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/events"
            className="text-[var(--accent-cyan)] hover:underline text-sm"
          >
            Back to Events
          </Link>
        </div>
      </main>
    </div>
  );
}
