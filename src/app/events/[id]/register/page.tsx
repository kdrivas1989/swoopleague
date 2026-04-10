"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RegistrationForm from "@/components/RegistrationForm";
import PaymentForm from "@/components/PaymentForm";

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  }
  const end = new Date(endDate + "T00:00:00");
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", opts)} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

interface EventData {
  event: {
    id: number;
    name: string;
    type: "meet" | "league" | "freestyle" | "team" | "course";
    startDate: string | null;
    endDate: string | null;
    locationName: string | null;
    locationCity: string | null;
    coach: string | null;
    description: string | null;
    bannerImageUrl: string | null;
    instructor: string | null;
    courseName: string | null;
    facebookEventUrl: string | null;
    status: string;
    isFull: boolean;
  };
  pricingTiers: { membershipTier: string; compClass: string | null; priceCents: number }[];
  wingTypes: string[];
  turnDegrees: string[];
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [priceCents, setPriceCents] = useState<number>(0);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEventData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!eventData || !eventData.event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-400">Event not found</div>
      </div>
    );
  }

  const { event } = eventData;

  if (event.isFull || event.status === "closed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-accent-gold mb-4">Registration Closed</h1>
          <p className="text-gray-400">This event is no longer accepting registrations.</p>
          <a href="/events" className="text-accent-cyan hover:underline mt-4 inline-block">
            ← Back to Events
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <a href="/events" className="text-accent-cyan hover:underline text-sm mb-6 inline-block">
          ← Back to Events
        </a>

        {/* Event Banner / Info */}
        {event.bannerImageUrl && (
          <div className="rounded-xl overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.bannerImageUrl}
              alt={event.name}
              className="w-full object-cover"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold text-accent-cyan mb-2">{event.name}</h1>

        {event.locationName && (
          <p className="text-gray-400 mb-1">
            {event.locationName} — {event.locationCity}
          </p>
        )}

        {event.startDate && (
          <p className="text-gray-400 mb-1">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
        )}

        {event.instructor && (
          <p className="text-gray-400 mb-1">
            Instructor: <span className="text-[var(--accent-gold)]">{event.instructor}</span>
          </p>
        )}

        {event.coach && !event.instructor && (
          <p className="text-gray-400 mb-1">
            Coach: <span className="text-[var(--accent-gold)]">{event.coach}</span>
          </p>
        )}

        {event.description && (
          <p className="text-gray-300 text-sm mt-3 mb-2">{event.description}</p>
        )}

        {event.facebookEventUrl && (
          <a
            href={event.facebookEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] hover:underline text-sm"
          >
            View Facebook Event →
          </a>
        )}

        <div className="mb-8" />

        {!clientSecret ? (
          <RegistrationForm
            event={{ ...eventData.event, pricingTiers: eventData.pricingTiers }}
            wingTypes={eventData.wingTypes}
            degreeOfTurnOptions={eventData.turnDegrees}
            onPaymentReady={(secret, regId, price) => {
              setClientSecret(secret);
              setRegistrationId(regId);
              setPriceCents(price);
            }}
          />
        ) : (
          <div>
            <div className="bg-card-bg border border-card-border rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Amount to pay</p>
              <p className="text-2xl font-bold text-accent-gold">
                ${(priceCents / 100).toFixed(2)}
              </p>
            </div>
            <PaymentForm
              clientSecret={clientSecret}
              registrationId={registrationId!}
              onSuccess={() => {
                router.push(`/events/${params.id}/confirmation?reg=${registrationId}`);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
