"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/data/countries";
import { WING_TYPES, getWingTypesForClass } from "@/data/wing-types";
import { TURN_DEGREES } from "@/data/turn-degrees";
import PaymentForm from "@/components/PaymentForm";

interface EventData {
  id: number;
  name: string;
  type: "meet" | "league" | "freestyle" | "team" | "course";
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  locationCity: string | null;
  flatPriceCents: number | null;
  memberPriceCents: number | null;
  nonMemberPriceCents: number | null;
  latePriceCents: number | null;
  lateRegistrationDate: string | null;
  capacity: number | null;
  registrationCount: number;
  isFull: boolean;
}

interface Competitor {
  id: string;
  name: string;
  email: string;
  country: string;
  membershipTier: "member" | "non-member" | "sport";
  compClass: string;
  wingType: string;
  wingSize: string;
  wingLoading: string;
  degreeOfTurn: string;
  leagueRegistration: boolean;
  teamRegistration: boolean;
  teamName: string;
}

const MEMBERSHIP_TIERS = [
  { value: "non-member", label: "Non-Member" },
  { value: "member", label: "Member" },
  { value: "sport", label: "Sport" },
] as const;

const COMP_CLASSES = [
  { value: "sport", label: "Sport" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "pro", label: "Pro" },
] as const;

function buildWingSizes(): string[] {
  const sizes: string[] = [];
  for (let s = 57; s <= 130; s++) sizes.push(String(s));
  sizes.push("Larger...");
  return sizes;
}

function buildWingLoadings(): string[] {
  const loadings: string[] = ["Lower than 1.5"];
  for (let wl = 15; wl <= 40; wl++) loadings.push((wl / 10).toFixed(1));
  return loadings;
}

const WING_SIZES = buildWingSizes();
const WING_LOADINGS = buildWingLoadings();

const inputClasses =
  "w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function GroupRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    groupId: number;
    totalCents: number;
  } | null>(null);

  // Competitor form fields
  const [compName, setCompName] = useState("");
  const [compEmail, setCompEmail] = useState("");
  const [compCountry, setCompCountry] = useState("");
  const [compMembershipTier, setCompMembershipTier] = useState("");
  const [compClass, setCompClass] = useState("");
  const [compWingType, setCompWingType] = useState("");
  const [compWingSize, setCompWingSize] = useState("");
  const [compWingLoading, setCompWingLoading] = useState("");
  const [compDegreeOfTurn, setCompDegreeOfTurn] = useState("");
  const [compLeagueRegistration, setCompLeagueRegistration] = useState(false);
  const [compTeamRegistration, setCompTeamRegistration] = useState(false);
  const [compTeamName, setCompTeamName] = useState("");
  const [compErrors, setCompErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Step 2 only shows meet and freestyle events
  const meetEvents = events.filter((e) => e.type === "meet");
  const freestyleEvents = events.filter((e) => e.type === "freestyle");
  const competitionEvents = [...meetEvents, ...freestyleEvents];

  // League and team events for per-competitor checkboxes in step 1
  const leagueEvent = events.find((e) => e.type === "league");
  const teamEvent = events.find((e) => e.type === "team");

  const allMeetIds = new Set(meetEvents.map((e) => e.id));
  const allMeetsSelected = meetEvents.length > 0 && meetEvents.every((e) => selectedEventIds.has(e.id));

  function toggleEvent(id: number) {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllMeets() {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (allMeetsSelected) {
        allMeetIds.forEach((id) => next.delete(id));
      } else {
        allMeetIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearCompForm() {
    setCompName("");
    setCompEmail("");
    setCompCountry("");
    setCompMembershipTier("");
    setCompClass("");
    setCompWingType("");
    setCompWingSize("");
    setCompWingLoading("");
    setCompDegreeOfTurn("");
    setCompLeagueRegistration(false);
    setCompTeamRegistration(false);
    setCompTeamName("");
    setCompErrors({});
  }

  function validateCompetitor(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!compName.trim()) errs.name = "Name is required";
    if (!compEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(compEmail)) errs.email = "Invalid email";
    if (!compCountry) errs.country = "Country is required";
    // Membership tier auto-set: league = member, no league = non-member
    // Comp fields always required since meets will be selected in step 2
    if (!compClass) errs.compClass = "Comp class is required";
    if (!compWingType) errs.wingType = "Wing type is required";
    if (!compWingSize) errs.wingSize = "Wing size is required";
    if (!compWingLoading) errs.wingLoading = "Wing loading is required";
    if (!compDegreeOfTurn) errs.degreeOfTurn = "Degree of turn is required";
    if (compTeamRegistration && !compTeamName.trim()) errs.teamName = "Team name is required";
    return errs;
  }

  function addCompetitor() {
    const errs = validateCompetitor();
    setCompErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newComp: Competitor = {
      id: `${Date.now()}-${Math.random()}`,
      name: compName.trim(),
      email: compEmail.trim(),
      country: compCountry,
      membershipTier: compLeagueRegistration ? "member" : "non-member",
      compClass: compClass,
      wingType: compWingType,
      wingSize: compWingSize,
      wingLoading: compWingLoading,
      degreeOfTurn: compDegreeOfTurn,
      leagueRegistration: compLeagueRegistration,
      teamRegistration: compTeamRegistration,
      teamName: compTeamName.trim(),
    };

    setCompetitors((prev) => [...prev, newComp]);
    clearCompForm();
  }

  function removeCompetitor(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  // Calculate line items for review — meet/freestyle events apply to all competitors,
  // league/team apply per-competitor based on their individual selections
  const lineItems = useMemo(() => {
    const items: Array<{
      competitorName: string;
      eventName: string;
      priceCents: number;
    }> = [];

    for (const comp of competitors) {
      // Meet/freestyle events (shared across all competitors)
      for (const eventId of selectedEventIds) {
        const event = events.find((e) => e.id === eventId);
        if (!event) continue;

        let price = 0;
        const isLate = event.lateRegistrationDate
          ? new Date() >= new Date(event.lateRegistrationDate)
          : false;

        if (isLate && event.latePriceCents) {
          price = event.latePriceCents;
        } else if (comp.membershipTier === "member" || comp.membershipTier === "sport") {
          price = event.memberPriceCents || 7500;
        } else {
          price = event.nonMemberPriceCents || 9500;
        }

        items.push({
          competitorName: comp.name,
          eventName: event.name,
          priceCents: price,
        });
      }

      // League registration (per-competitor)
      if (comp.leagueRegistration && leagueEvent) {
        items.push({
          competitorName: comp.name,
          eventName: leagueEvent.name,
          priceCents: leagueEvent.flatPriceCents || 0,
        });
      }

      // Team registration (per-competitor)
      if (comp.teamRegistration && teamEvent) {
        items.push({
          competitorName: comp.name,
          eventName: `${teamEvent.name} (${comp.teamName})`,
          priceCents: teamEvent.flatPriceCents || 0,
        });
      }
    }

    return items;
  }, [competitors, selectedEventIds, events, leagueEvent, teamEvent]);

  const grandTotal = lineItems.reduce((sum, li) => sum + li.priceCents, 0);

  // Subtotals per competitor
  const competitorSubtotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const li of lineItems) {
      map.set(li.competitorName, (map.get(li.competitorName) || 0) + li.priceCents);
    }
    return map;
  }, [lineItems]);

  async function handleSubmitGroup() {
    if (!payerName.trim() || !payerEmail.trim()) {
      setSubmitError("Payer name and email are required");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/group-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim(),
          competitors: competitors.map((c) => {
            // Build per-competitor eventIds: shared meet/freestyle + individual league/team
            const compEventIds = Array.from(selectedEventIds);
            if (c.leagueRegistration && leagueEvent) {
              compEventIds.push(leagueEvent.id);
            }
            if (c.teamRegistration && teamEvent) {
              compEventIds.push(teamEvent.id);
            }
            return {
              name: c.name,
              email: c.email,
              country: c.country,
              membershipTier: c.membershipTier,
              compClass: c.compClass || undefined,
              wingType: c.wingType || undefined,
              wingSize: c.wingSize || undefined,
              wingLoading: c.wingLoading || undefined,
              degreeOfTurn: c.degreeOfTurn || undefined,
              teamName: c.teamRegistration ? c.teamName : undefined,
              eventIds: compEventIds,
            };
          }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Registration failed (${res.status})`);
      }

      const data = await res.json();
      setPaymentData({
        clientSecret: data.clientSecret,
        groupId: data.groupId,
        totalCents: data.totalCents,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePaymentSuccess() {
    if (paymentData) {
      router.push(`/group-register/confirmation?group=${paymentData.groupId}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="relative py-12 px-4 text-center bg-gradient-to-b from-[#0f1629] to-[var(--background)]">
        <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-white uppercase">
          Group Registration
        </h1>
        <p className="mt-3 text-gray-400">
          Register multiple competitors for multiple events with a single payment
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  step === s
                    ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-black"
                    : step > s
                    ? "border-[var(--accent-cyan)] bg-transparent text-[var(--accent-cyan)]"
                    : "border-[var(--card-border)] bg-transparent text-gray-500"
                }`}
              >
                {step > s ? "\u2713" : s}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  step === s ? "text-white font-medium" : "text-gray-500"
                }`}
              >
                {s === 1 ? "Add Competitors" : s === 2 ? "Select Meets" : "Review & Pay"}
              </span>
              {s < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > s ? "bg-[var(--accent-cyan)]" : "bg-[var(--card-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Add Competitors */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Add competitor form */}
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add Competitor</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="Full name"
                    className={inputClasses}
                  />
                  {compErrors.name && <p className="mt-1 text-xs text-red-400">{compErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="competitor@example.com"
                    className={inputClasses}
                  />
                  {compErrors.email && <p className="mt-1 text-xs text-red-400">{compErrors.email}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Country</label>
                  <select
                    value={compCountry}
                    onChange={(e) => setCompCountry(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {compErrors.country && <p className="mt-1 text-xs text-red-400">{compErrors.country}</p>}
                </div>

                {/* Comp Class */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Comp Class</label>
                  <select
                    value={compClass}
                    onChange={(e) => { setCompClass(e.target.value); setCompWingType(""); }}
                    className={inputClasses}
                  >
                    <option value="">Select class...</option>
                    {COMP_CLASSES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {compErrors.compClass && (
                    <p className="mt-1 text-xs text-red-400">{compErrors.compClass}</p>
                  )}
                </div>

                {/* Wing Type */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Type</label>
                  <select
                    value={compWingType}
                    onChange={(e) => setCompWingType(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select wing type...</option>
                    {(compClass ? getWingTypesForClass(compClass) : [...WING_TYPES]).map((wt) => (
                      <option key={wt} value={wt}>
                        {wt}
                      </option>
                    ))}
                  </select>
                  {compErrors.wingType && (
                    <p className="mt-1 text-xs text-red-400">{compErrors.wingType}</p>
                  )}
                </div>

                {/* Wing Size */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Size</label>
                  <select
                    value={compWingSize}
                    onChange={(e) => setCompWingSize(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select size...</option>
                    {WING_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {compErrors.wingSize && (
                    <p className="mt-1 text-xs text-red-400">{compErrors.wingSize}</p>
                  )}
                </div>

                {/* Wing Loading */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Loading</label>
                  <select
                    value={compWingLoading}
                    onChange={(e) => setCompWingLoading(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select loading...</option>
                    {WING_LOADINGS.map((wl) => (
                      <option key={wl} value={wl}>
                        {wl}
                      </option>
                    ))}
                  </select>
                  {compErrors.wingLoading && (
                    <p className="mt-1 text-xs text-red-400">{compErrors.wingLoading}</p>
                  )}
                </div>

                {/* Degree of Turn */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Degree of Turn</label>
                  <select
                    value={compDegreeOfTurn}
                    onChange={(e) => setCompDegreeOfTurn(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select degree...</option>
                    {TURN_DEGREES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {compErrors.degreeOfTurn && (
                    <p className="mt-1 text-xs text-red-400">{compErrors.degreeOfTurn}</p>
                  )}
                </div>
              </div>

              {/* Season Registration checkboxes */}
              {(leagueEvent || teamEvent) && (
                <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Season Registration</h3>
                  <div className="space-y-3">
                    {leagueEvent && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compLeagueRegistration}
                          onChange={(e) => setCompLeagueRegistration(e.target.checked)}
                          className="w-5 h-5 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)] accent-[var(--accent-cyan)]"
                        />
                        <span className="text-white text-sm font-medium">
                          {leagueEvent.name}
                        </span>
                        {leagueEvent.flatPriceCents && (
                          <span className="text-gray-500 text-xs">
                            {formatCents(leagueEvent.flatPriceCents)}
                          </span>
                        )}
                      </label>
                    )}

                    {teamEvent && (
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={compTeamRegistration}
                            onChange={(e) => {
                              setCompTeamRegistration(e.target.checked);
                              if (!e.target.checked) setCompTeamName("");
                            }}
                            className="w-5 h-5 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)] accent-[var(--accent-cyan)]"
                          />
                          <span className="text-white text-sm font-medium">
                            {teamEvent.name}
                          </span>
                          {teamEvent.flatPriceCents && (
                            <span className="text-gray-500 text-xs">
                              {formatCents(teamEvent.flatPriceCents)}
                            </span>
                          )}
                        </label>
                        {compTeamRegistration && (
                          <div className="ml-8 mt-2">
                            <input
                              type="text"
                              value={compTeamName}
                              onChange={(e) => setCompTeamName(e.target.value)}
                              placeholder="Team name"
                              className={inputClasses}
                            />
                            {compErrors.teamName && (
                              <p className="mt-1 text-xs text-red-400">{compErrors.teamName}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={addCompetitor}
                className="mt-5 rounded-lg border border-[var(--accent-cyan)] px-6 py-2.5 text-sm font-bold text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors"
              >
                + Add Competitor
              </button>
            </div>

            {/* Competitor list */}
            {competitors.length > 0 && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Competitors ({competitors.length})
                </h2>
                <div className="space-y-3">
                  {competitors.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)]"
                    >
                      <div>
                        <span className="text-white text-sm font-medium">{comp.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{comp.email}</span>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {COUNTRIES.find((c) => c.code === comp.country)?.name}
                          {comp.compClass && (
                            <> &middot; {COMP_CLASSES.find((c) => c.value === comp.compClass)?.label}</>
                          )}
                          {comp.leagueRegistration && (
                            <> &middot; <span className="text-[var(--accent-cyan)]">League</span></>
                          )}
                          {comp.teamRegistration && (
                            <> &middot; <span className="text-[var(--accent-cyan)]">Team: {comp.teamName}</span></>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCompetitor(comp.id)}
                        className="text-red-400 hover:text-red-300 text-sm px-3 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={competitors.length === 0}
                className="rounded-lg bg-[var(--accent-cyan)] px-8 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Select Meets
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Meets */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select Meets</h2>

              {/* All Meets checkbox */}
              {meetEvents.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[var(--card-border)]">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allMeetsSelected}
                      onChange={toggleAllMeets}
                      className="w-5 h-5 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)] accent-[var(--accent-cyan)]"
                    />
                    <span className="text-[var(--accent-gold)] font-bold text-sm uppercase tracking-wide">
                      All Meets ({meetEvents.length})
                    </span>
                  </label>
                </div>
              )}

              {/* Competition events (meets + freestyle) */}
              {competitionEvents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Meets & Freestyle</h3>
                  {competitionEvents.map((event) => (
                    <label
                      key={event.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEventIds.has(event.id)
                          ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10"
                          : "border-[var(--card-border)] hover:border-gray-600"
                      } ${event.isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(event.id)}
                        onChange={() => !event.isFull && toggleEvent(event.id)}
                        disabled={event.isFull}
                        className="w-5 h-5 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)] accent-[var(--accent-cyan)]"
                      />
                      <div className="flex-1">
                        <span className="text-white text-sm font-medium">{event.name}</span>
                        {event.startDate && (
                          <span className="text-gray-500 text-xs ml-2">
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {event.locationCity && (
                          <span className="text-gray-500 text-xs ml-2">{event.locationCity}</span>
                        )}
                      </div>
                      {event.isFull && (
                        <span className="text-xs text-red-400 font-medium">FULL</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected count */}
            <div className="text-center text-sm text-gray-400">
              {selectedEventIds.size} event{selectedEventIds.size !== 1 ? "s" : ""} selected
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-[var(--card-border)] px-6 py-3 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedEventIds.size === 0}
                className="rounded-lg bg-[var(--accent-cyan)] px-8 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Review & Pay
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && !paymentData && (
          <div className="space-y-6">
            {/* Summary Table */}
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Registration Summary</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      <th className="text-left py-3 pr-4 text-gray-400 font-medium">Competitor</th>
                      <th className="text-left py-3 pr-4 text-gray-400 font-medium">Event</th>
                      <th className="text-right py-3 text-gray-400 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp) => {
                      const compItems = lineItems.filter(
                        (li) => li.competitorName === comp.name
                      );
                      return compItems.map((li, idx) => (
                        <tr
                          key={`${comp.id}-${idx}`}
                          className="border-b border-[var(--card-border)]/50"
                        >
                          <td className="py-2.5 pr-4 text-white">
                            {idx === 0 ? comp.name : ""}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-300">{li.eventName}</td>
                          <td className="py-2.5 text-right text-white">
                            {formatCents(li.priceCents)}
                          </td>
                        </tr>
                      ));
                    })}

                    {/* Subtotals per competitor */}
                    {competitors.length > 1 &&
                      competitors.map((comp) => (
                        <tr
                          key={`subtotal-${comp.id}`}
                          className="border-b border-[var(--card-border)]"
                        >
                          <td colSpan={2} className="py-2 pr-4 text-right text-gray-400 text-xs">
                            Subtotal for {comp.name}
                          </td>
                          <td className="py-2 text-right text-[var(--accent-gold)] text-sm font-medium">
                            {formatCents(competitorSubtotals.get(comp.name) || 0)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="pt-4 pr-4 text-right text-white font-bold text-base">
                        Grand Total
                      </td>
                      <td className="pt-4 text-right text-[var(--accent-gold)] font-bold text-xl">
                        {formatCents(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payer Information */}
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Payer Information</h2>
              <p className="text-xs text-gray-500 mb-4">
                The person paying may be different from the competitors.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {submitError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-[var(--card-border)] px-6 py-3 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmitGroup}
                disabled={submitting || !payerName.trim() || !payerEmail.trim()}
                className="rounded-lg bg-[var(--accent-cyan)] px-8 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {step === 3 && paymentData && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">Total Due</p>
                <p className="text-3xl font-bold text-[var(--accent-gold)]">
                  {formatCents(paymentData.totalCents)}
                </p>
              </div>

              <PaymentForm
                clientSecret={paymentData.clientSecret}
                registrationId={paymentData.groupId}
                onSuccess={handlePaymentSuccess}
              />
            </div>

            <div className="text-center">
              <button
                onClick={() => setPaymentData(null)}
                className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                Go back to review
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
