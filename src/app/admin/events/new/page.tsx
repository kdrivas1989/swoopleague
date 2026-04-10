"use client";

import { useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create event");
    }

    router.push("/admin");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create New Event</h1>
        <p className="text-gray-400 text-sm mt-1">
          Set up a new competition event with pricing tiers
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <EventForm onSubmit={handleSubmit} submitLabel="Create Event" />
      </div>
    </div>
  );
}
