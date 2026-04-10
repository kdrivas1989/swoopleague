"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import EventForm from "@/components/EventForm";

interface EventData {
  id: number;
  name: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  location_city: string | null;
  coach: string | null;
  instructor: string | null;
  course_name: string | null;
  course_color: string | null;
  facebook_event_url: string | null;
  flat_price_cents: number | null;
  member_price_cents: number | null;
  non_member_price_cents: number | null;
  late_price_cents: number | null;
  late_registration_date: string | null;
  description: string | null;
  banner_image_url: string | null;
  capacity: number | null;
  sort_order: number;
  registrationCount: number;
}

interface PricingTierRow {
  membership_tier: string;
  comp_class: string | null;
  price_cents: number;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Fetch event details from the public API which includes pricing tiers
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) {
          setError("Event not found");
          return;
        }
        const data = await res.json();
        const e = data.event;
        setEvent({
          id: e.id,
          name: e.name,
          type: e.type,
          status: e.status,
          start_date: e.startDate,
          end_date: e.endDate,
          location_name: e.locationName,
          location_city: e.locationCity,
          coach: e.coach,
          instructor: e.instructor,
          course_name: e.courseName,
          course_color: e.courseColor,
          facebook_event_url: e.facebookEventUrl,
          flat_price_cents: e.flatPriceCents,
          member_price_cents: e.memberPriceCents,
          non_member_price_cents: e.nonMemberPriceCents,
          late_price_cents: e.latePriceCents,
          late_registration_date: e.lateRegistrationDate,
          description: e.description,
          banner_image_url: e.bannerImageUrl,
          capacity: e.capacity,
          sort_order: e.sortOrder ?? 0,
          registrationCount: e.registrationCount,
        });
        setPricingTiers(
          (data.pricingTiers || []).map((t: { membershipTier: string; compClass: string | null; priceCents: number }) => ({
            membership_tier: t.membershipTier,
            comp_class: t.compClass,
            price_cents: t.priceCents,
          }))
        );
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSubmit = async (data: unknown) => {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update event");
    }

    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--accent-cyan)]">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-400">{error || "Event not found"}</div>
        <Link href="/admin" className="text-[var(--accent-cyan)] hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Edit Event</h1>
          <p className="text-gray-400 text-sm mt-1">{event.name}</p>
        </div>
        <Link
          href={`/admin/events/${id}/registrations`}
          className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          View Registrations ({event.registrationCount})
        </Link>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <EventForm
          initialData={{ ...event, pricingTiers }}
          onSubmit={handleSubmit}
          submitLabel="Update Event"
        />
      </div>

      {/* Registration summary */}
      <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--accent-cyan)] mb-2">
          Registration Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-[var(--foreground)] font-medium capitalize">{event.status}</p>
          </div>
          <div>
            <p className="text-gray-400">Registrations</p>
            <p className="text-[var(--foreground)] font-medium">{event.registrationCount}</p>
          </div>
          <div>
            <p className="text-gray-400">Capacity</p>
            <p className="text-[var(--foreground)] font-medium">
              {event.capacity ?? "Unlimited"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Type</p>
            <p className="text-[var(--foreground)] font-medium capitalize">{event.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
