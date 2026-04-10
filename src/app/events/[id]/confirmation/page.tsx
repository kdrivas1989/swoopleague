"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface ConfirmationData {
  registration: {
    id: number;
    eventName: string;
    name: string;
    email: string;
    compClass: string | null;
    wingType: string | null;
    wingSize: string | null;
    wingLoading: string | null;
    degreeOfTurn: string | null;
    country: string | null;
    pricePaid: string;
    paymentStatus: string;
  };
}

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const regId = searchParams.get("reg");
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regId) {
      setLoading(false);
      return;
    }
    fetch(`/api/registration/${regId}/confirmation`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [regId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-400">Loading confirmation...</div>
      </div>
    );
  }

  if (!data?.registration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-400">Registration not found</div>
      </div>
    );
  }

  const r = data.registration;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-accent-cyan">Registration Confirmed!</h1>
          <p className="text-gray-400 mt-2">You&apos;re registered for {r.eventName}</p>
        </div>

        <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Name</span>
            <span className="text-[var(--foreground)] font-medium">{r.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-[var(--foreground)]">{r.email}</span>
          </div>
          {r.compClass && (
            <div className="flex justify-between">
              <span className="text-gray-400">Class</span>
              <span className="text-[var(--foreground)] capitalize">{r.compClass}</span>
            </div>
          )}
          {r.wingType && (
            <div className="flex justify-between">
              <span className="text-gray-400">Wing</span>
              <span className="text-[var(--foreground)]">
                {r.wingType} {r.wingSize}sqft @ {r.wingLoading}
              </span>
            </div>
          )}
          {r.degreeOfTurn && (
            <div className="flex justify-between">
              <span className="text-gray-400">Turn</span>
              <span className="text-[var(--foreground)]">{r.degreeOfTurn}°</span>
            </div>
          )}
          {r.country && (
            <div className="flex justify-between">
              <span className="text-gray-400">Country</span>
              <span className="text-[var(--foreground)]">{r.country}</span>
            </div>
          )}
          <div className="border-t border-card-border pt-4 flex justify-between">
            <span className="text-gray-400">Amount Paid</span>
            <span className="text-accent-gold font-bold text-lg">{r.pricePaid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className={r.paymentStatus === "completed" ? "text-green-400" : "text-accent-gold"}>
              {r.paymentStatus === "completed" ? "Confirmed" : r.paymentStatus}
            </span>
          </div>
        </div>

        {/* Waiver link */}
        <div className="mt-8 bg-card-bg border border-card-border rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-accent-gold mb-2">Competition Waiver</h3>
          <p className="text-gray-400 text-sm mb-4">
            Please complete the USCPA participant waiver for this event.
          </p>
          <a
            href={`/events/${params.id}/waiver`}
            className="inline-block rounded-lg bg-accent-cyan px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
          >
            Sign Waiver
          </a>
        </div>

        <div className="text-center mt-6">
          <a href="/events" className="text-accent-cyan hover:underline">
            ← Back to Events
          </a>
        </div>
      </div>
    </div>
  );
}
