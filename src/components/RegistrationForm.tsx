"use client";

import { useState, useMemo, type FormEvent } from "react";
import { COUNTRIES } from "@/data/countries";
import { getWingTypesForClass } from "@/data/wing-types";

export interface PricingTier {
  membershipTier: string;
  compClass: string | null;
  priceCents: number;
}

export interface RegistrationEvent {
  id: number;
  name: string;
  type: "meet" | "league" | "freestyle" | "team" | "course";
  pricingTiers: PricingTier[];
  flatPriceCents?: number | null;
  memberPriceCents?: number | null;
  nonMemberPriceCents?: number | null;
  latePriceCents?: number | null;
  lateRegistrationDate?: string | null;
}

interface RegistrationFormProps {
  event: RegistrationEvent;
  wingTypes: string[];
  degreeOfTurnOptions: string[];
  onPaymentReady: (clientSecret: string, registrationId: number, priceCents: number) => void;
  waiverId?: string | null;
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
  for (let s = 57; s <= 130; s++) {
    sizes.push(String(s));
  }
  sizes.push("Larger...");
  return sizes;
}

function buildWingLoadings(): string[] {
  const loadings: string[] = ["Lower than 1.5"];
  for (let wl = 15; wl <= 40; wl++) {
    loadings.push((wl / 10).toFixed(1));
  }
  return loadings;
}

const WING_SIZES = buildWingSizes();
const WING_LOADINGS = buildWingLoadings();

const inputClasses =
  "w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan";

export default function RegistrationForm({
  event,
  wingTypes,
  degreeOfTurnOptions,
  onPaymentReady,
  waiverId,
}: RegistrationFormProps) {
  const isSimpleEvent = event.type === "league" || event.type === "course" || event.type === "team";
  const isTeamEvent = event.type === "team";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [membershipTier, setMembershipTier] = useState("");
  const [compClass, setCompClass] = useState("");
  const [wingType, setWingType] = useState("");
  const [wingSize, setWingSize] = useState("");
  const [wingLoading, setWingLoading] = useState("");
  const [degreeOfTurn, setDegreeOfTurn] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const filteredWingTypes = useMemo(() => {
    if (!compClass) return wingTypes;
    return getWingTypesForClass(compClass);
  }, [compClass, wingTypes]);

  const isLate = event.lateRegistrationDate
    ? new Date() >= new Date(event.lateRegistrationDate)
    : false;

  const matchedPrice = useMemo(() => {
    // Courses, league, team use flat price
    if ((event.type === "course" || event.type === "league" || event.type === "team") && event.flatPriceCents) {
      return event.flatPriceCents;
    }

    // Meets and freestyle: member/non-member/late pricing
    if (event.type === "meet" || event.type === "freestyle") {
      if (isLate && event.latePriceCents) return event.latePriceCents;
      if (!membershipTier) return null;
      if (membershipTier === "member" || membershipTier === "sport") {
        return event.memberPriceCents ?? null;
      }
      return event.nonMemberPriceCents ?? null;
    }

    return null;
  }, [membershipTier, event, isLate]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email address";
    if (!isTeamEvent && !membershipTier) errs.membershipTier = "Membership tier is required";
    if (isTeamEvent) {
      if (!teamName.trim()) errs.teamName = "Team name is required";
      if (!compClass) errs.compClass = "Comp class is required";
    }
    if (!isSimpleEvent && !isTeamEvent) {
      if (!compClass) errs.compClass = "Comp class is required";
      if (!wingType) errs.wingType = "Wing type is required";
      if (!wingSize) errs.wingSize = "Wing size is required";
      if (!wingLoading) errs.wingLoading = "Wing loading is required";
      if (!degreeOfTurn) errs.degreeOfTurn = "Degree of turn is required";
    }
    if (!isTeamEvent && !country) errs.country = "Country is required";
    if (matchedPrice === null && membershipTier && (isSimpleEvent || compClass)) {
      errs.membershipTier = "No pricing available for this combination";
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        eventId: event.id,
        name: name.trim(),
        email: email.trim(),
        membershipTier: isTeamEvent ? "member" : membershipTier,
        country: isTeamEvent ? null : country,
      };

      if (isTeamEvent) {
        body.teamName = teamName.trim();
        body.compClass = compClass;
      } else if (!isSimpleEvent) {
        body.compClass = compClass;
        body.wingType = wingType;
        body.wingSize = wingSize;
        body.wingLoading = wingLoading;
        body.degreeOfTurn = degreeOfTurn;
      }

      if (waiverId) {
        body.waiverId = Number(waiverId);
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Registration failed (${res.status})`);
      }

      const { clientSecret, registrationId, priceCents } = await res.json();
      onPaymentReady(clientSecret, registrationId, priceCents);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={inputClasses}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClasses}
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* Team Name — only for team events */}
      {isTeamEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter your team name (both teammates must use the same name)"
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-gray-500">
            Both teammates register separately and pay individually. Use the exact same team name to be linked.
          </p>
          {errors.teamName && <p className="mt-1 text-xs text-red-400">{errors.teamName}</p>}
        </div>
      )}

      {/* Comp Class — for team events */}
      {isTeamEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Comp Class</label>
          <select
            value={compClass}
            onChange={(e) => { setCompClass(e.target.value); setWingType(""); }}
            className={inputClasses}
          >
            <option value="">Select class...</option>
            {COMP_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.compClass && <p className="mt-1 text-xs text-red-400">{errors.compClass}</p>}
        </div>
      )}

      {/* Membership Tier — hidden for team events */}
      {!isTeamEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Membership Tier</label>
          <select
            value={membershipTier}
            onChange={(e) => setMembershipTier(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select tier...</option>
            {MEMBERSHIP_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.membershipTier && (
            <p className="mt-1 text-xs text-red-400">{errors.membershipTier}</p>
          )}
        </div>
      )}

      {/* Comp Class — hidden for league/team */}
      {!isSimpleEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Comp Class</label>
          <select
            value={compClass}
            onChange={(e) => { setCompClass(e.target.value); setWingType(""); }}
            className={inputClasses}
          >
            <option value="">Select class...</option>
            {COMP_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.compClass && <p className="mt-1 text-xs text-red-400">{errors.compClass}</p>}
        </div>
      )}

      {/* Wing Type — hidden for league/team */}
      {!isSimpleEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Type</label>
          <select
            value={wingType}
            onChange={(e) => setWingType(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select wing type...</option>
            {filteredWingTypes.map((wt) => (
              <option key={wt} value={wt}>
                {wt}
              </option>
            ))}
          </select>
          {errors.wingType && <p className="mt-1 text-xs text-red-400">{errors.wingType}</p>}
        </div>
      )}

      {/* Wing Size — hidden for league/team */}
      {!isSimpleEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Size</label>
          <select
            value={wingSize}
            onChange={(e) => setWingSize(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select size...</option>
            {WING_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.wingSize && <p className="mt-1 text-xs text-red-400">{errors.wingSize}</p>}
        </div>
      )}

      {/* Wing Loading — hidden for league/team */}
      {!isSimpleEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Wing Loading</label>
          <select
            value={wingLoading}
            onChange={(e) => setWingLoading(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select loading...</option>
            {WING_LOADINGS.map((wl) => (
              <option key={wl} value={wl}>
                {wl}
              </option>
            ))}
          </select>
          {errors.wingLoading && (
            <p className="mt-1 text-xs text-red-400">{errors.wingLoading}</p>
          )}
        </div>
      )}

      {/* Degree of Turn — hidden for league/team */}
      {!isSimpleEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Degree of Turn</label>
          <select
            value={degreeOfTurn}
            onChange={(e) => setDegreeOfTurn(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select degree...</option>
            {degreeOfTurnOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.degreeOfTurn && (
            <p className="mt-1 text-xs text-red-400">{errors.degreeOfTurn}</p>
          )}
        </div>
      )}

      {/* Country — hidden for team events */}
      {!isTeamEvent && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country}</p>}
        </div>
      )}

      {/* Dynamic Price Display */}
      {matchedPrice !== null && (
        <div className="rounded-lg border border-card-border bg-card-bg p-4 text-center">
          <p className="text-sm text-gray-400">Registration Fee</p>
          <p className="text-2xl font-bold text-accent-gold">
            ${(matchedPrice / 100).toFixed(2)}
          </p>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent-cyan px-6 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Continue to Payment"}
      </button>
    </form>
  );
}
