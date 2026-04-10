"use client";

import { useState } from "react";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import type { EventCardEvent } from "@/components/EventCard";
import AlterEgoTab from "@/components/AlterEgoTab";

type Tab = "competitions" | "courses" | "alterego" | "waiver";

interface EventsTabsProps {
  meets: EventCardEvent[];
  courses: EventCardEvent[];
  other: EventCardEvent[];
  eventIdForWaiver: number | null;
}

export default function EventsTabs({ meets, courses, other, eventIdForWaiver }: EventsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("competitions");

  const tabs: { key: Tab; label: string }[] = [
    { key: "competitions", label: "Competitions" },
    { key: "courses", label: "Canopy Courses" },
    { key: "alterego", label: "Alter Ego Project" },
    { key: "waiver", label: "Waiver" },
  ];

  return (
    <>
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-[var(--card-border)] mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-[var(--accent-cyan)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)]" />
            )}
          </button>
        ))}
      </div>

      {/* Competitions Tab */}
      {activeTab === "competitions" && (
        <div>
          {other.length > 0 && (
            <>
              <h2 className="text-2xl font-bold text-[var(--accent-cyan)] mb-6 uppercase tracking-wide">
                Season Registration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {other.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}

          <h2 className="text-2xl font-bold text-[var(--accent-gold)] mt-12 mb-6 uppercase tracking-wide">
            Meets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meets.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Canopy Courses Tab */}
      {activeTab === "courses" && (
        <div>
          <h2 className="text-2xl font-bold text-[var(--accent-gold)] mb-2 uppercase tracking-wide">
            Canopy Piloting Courses
          </h2>
          <p className="text-gray-400 mb-6">
            Powered by The Alter Ego Project
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {courses.length === 0 && (
            <p className="text-gray-500 text-center py-12">No courses currently scheduled.</p>
          )}
        </div>
      )}

      {/* Alter Ego Project Tab */}
      {activeTab === "alterego" && <AlterEgoTab />}

      {/* Waiver Tab */}
      {activeTab === "waiver" && (
        <div className="max-w-2xl mx-auto text-center py-8">
          <h2 className="text-2xl font-bold text-[var(--accent-gold)] mb-4">
            Competition Waiver
          </h2>
          <p className="text-gray-400 mb-6">
            All competitors must complete the USCPA participant waiver before competing.
            You can sign the waiver in advance below, or after completing registration.
          </p>
          {eventIdForWaiver ? (
            <Link
              href={`/events/${eventIdForWaiver}/waiver`}
              className="inline-block rounded-lg bg-[var(--accent-cyan)] px-8 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity"
            >
              Sign Waiver
            </Link>
          ) : (
            <p className="text-gray-500">No events available for waiver signing at this time.</p>
          )}
        </div>
      )}
    </>
  );
}
