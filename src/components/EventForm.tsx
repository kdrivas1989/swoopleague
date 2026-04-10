"use client";

import { useState, useEffect } from "react";
import { COURSE_COLORS } from "@/data/course-colors";

interface PricingTier {
  membershipTier: string;
  compClass: string | null;
  priceCents: number;
}

interface EventData {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationCity: string;
  coach: string;
  instructor: string;
  courseName: string;
  description: string;
  bannerImageUrl: string;
  capacity: number | null;
  sortOrder: number;
  pricingTiers: PricingTier[];
}

interface EventFormProps {
  initialData?: {
    name: string;
    type: string;
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
    pricingTiers?: Array<{
      membership_tier: string;
      comp_class: string | null;
      price_cents: number;
    }>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
}

const MEMBERSHIP_TIERS = ["non-member", "member", "sport"];
const COMP_CLASSES = ["sport", "intermediate", "advanced", "pro"];

export default function EventForm({
  initialData,
  onSubmit,
  submitLabel = "Save Event",
}: EventFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState(initialData?.type ?? "meet");
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [locationName, setLocationName] = useState(initialData?.location_name ?? "");
  const [locationCity, setLocationCity] = useState(initialData?.location_city ?? "");
  const [coach, setCoach] = useState(initialData?.coach ?? "");
  const [instructor, setInstructor] = useState(initialData?.instructor ?? "");
  const [courseName, setCourseName] = useState(initialData?.course_name ?? "");
  const [courseColor, setCourseColor] = useState(initialData?.course_color ?? "");
  const [facebookEventUrl, setFacebookEventUrl] = useState(initialData?.facebook_event_url ?? "");
  const [flatPrice, setFlatPrice] = useState<string>(
    initialData?.flat_price_cents != null ? (initialData.flat_price_cents / 100).toFixed(2) : ""
  );
  const [memberPrice, setMemberPrice] = useState<string>(
    initialData?.member_price_cents != null ? (initialData.member_price_cents / 100).toFixed(2) : ""
  );
  const [nonMemberPrice, setNonMemberPrice] = useState<string>(
    initialData?.non_member_price_cents != null ? (initialData.non_member_price_cents / 100).toFixed(2) : ""
  );
  const [latePrice, setLatePrice] = useState<string>(
    initialData?.late_price_cents != null ? (initialData.late_price_cents / 100).toFixed(2) : ""
  );
  const [lateRegistrationDate, setLateRegistrationDate] = useState(initialData?.late_registration_date ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(initialData?.banner_image_url ?? "");
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity != null ? String(initialData.capacity) : ""
  );
  const [sortOrder, setSortOrder] = useState<string>(
    String(initialData?.sort_order ?? 0)
  );
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hideCompClass = type === "league" || type === "team" || type === "course";
  const isCourse = type === "course";

  useEffect(() => {
    if (initialData?.pricingTiers && initialData.pricingTiers.length > 0) {
      setPricingTiers(
        initialData.pricingTiers.map((t) => ({
          membershipTier: t.membership_tier,
          compClass: t.comp_class,
          priceCents: t.price_cents,
        }))
      );
    } else if (!initialData) {
      setPricingTiers([
        { membershipTier: "non-member", compClass: hideCompClass ? null : "sport", priceCents: 0 },
      ]);
    }
  }, [initialData]);

  const addTier = () => {
    setPricingTiers([
      ...pricingTiers,
      { membershipTier: "non-member", compClass: hideCompClass ? null : "sport", priceCents: 0 },
    ]);
  };

  const removeTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof PricingTier, value: string | number | null) => {
    const updated = [...pricingTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPricingTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await onSubmit({
        name,
        type,
        startDate,
        endDate,
        locationName,
        locationCity,
        coach: isCourse ? null : coach,
        instructor: isCourse ? instructor : null,
        courseName: isCourse ? courseName : null,
        courseColor: isCourse ? courseColor || null : null,
        facebookEventUrl: facebookEventUrl || null,
        flatPriceCents: (isCourse || type === "league" || type === "team") && flatPrice ? Math.round(parseFloat(flatPrice) * 100) : null,
        memberPriceCents: memberPrice ? Math.round(parseFloat(memberPrice) * 100) : null,
        nonMemberPriceCents: nonMemberPrice ? Math.round(parseFloat(nonMemberPrice) * 100) : null,
        latePriceCents: latePrice ? Math.round(parseFloat(latePrice) * 100) : null,
        lateRegistrationDate: lateRegistrationDate || null,
        description,
        bannerImageUrl,
        capacity: capacity ? parseInt(capacity) : null,
        sortOrder: parseInt(sortOrder) || 0,
        pricingTiers: pricingTiers.map((t) => ({
          ...t,
          compClass: hideCompClass ? null : t.compClass,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Event Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="meet">Meet</option>
            <option value="league">League</option>
            <option value="freestyle">Freestyle</option>
            <option value="team">Team</option>
            <option value="course">Course</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Location Name</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Location City</label>
          <input
            type="text"
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Coach (meets/freestyle) or Instructor+Course (courses) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCourse ? (
          <>
            <div>
              <label className={labelClass}>Course Color *</label>
              <select
                value={courseColor}
                onChange={(e) => {
                  setCourseColor(e.target.value);
                  const found = COURSE_COLORS.find((c) => c.value === e.target.value);
                  if (found && !courseName) setCourseName(found.subtitle);
                }}
                className={inputClass}
              >
                <option value="">Select a color...</option>
                {COURSE_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} — {c.subtitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Instructor *</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className={inputClass}
                placeholder="e.g. Curt Bartholomew"
              />
            </div>
          </>
        ) : (
          <div>
            <label className={labelClass}>Coach</label>
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        {!isCourse && (
          <div>
            <label className={labelClass}>Banner Image URL</label>
            <input
              type="url"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Facebook Event URL</label>
          <input
            type="url"
            value={facebookEventUrl}
            onChange={(e) => setFacebookEventUrl(e.target.value)}
            placeholder="https://www.facebook.com/events/..."
            className={inputClass}
          />
        </div>
        {(isCourse || type === "league" || type === "team") && (
          <div>
            <label className={labelClass}>Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={flatPrice}
              onChange={(e) => setFlatPrice(e.target.value)}
              placeholder="e.g. 200.00"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Capacity</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Unlimited"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Meet/Freestyle pricing: member, non-member, late */}
      {(type === "meet" || type === "freestyle") && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Member Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={memberPrice}
                onChange={(e) => setMemberPrice(e.target.value)}
                placeholder="e.g. 75.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Non-Member Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={nonMemberPrice}
                onChange={(e) => setNonMemberPrice(e.target.value)}
                placeholder="e.g. 95.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Late Registration Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={latePrice}
                onChange={(e) => setLatePrice(e.target.value)}
                placeholder="e.g. 115.00"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Late Registration Cutoff Date</label>
              <input
                type="date"
                value={lateRegistrationDate}
                onChange={(e) => setLateRegistrationDate(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">
                Registrations on or after this date will be charged the late price
              </p>
            </div>
          </div>
        </>
      )}

      {/* Old Pricing Tiers — hidden, kept for backwards compat */}
      {false && (<div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--accent-cyan)]">
            Pricing Tiers
          </h3>
          <button
            type="button"
            onClick={addTier}
            className="px-3 py-1 text-sm rounded-lg bg-[var(--accent-cyan)] text-black font-medium hover:opacity-90 transition-opacity"
          >
            + Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left py-2 px-2 text-gray-400">Membership Tier</th>
                {!hideCompClass && (
                  <th className="text-left py-2 px-2 text-gray-400">Comp Class</th>
                )}
                <th className="text-left py-2 px-2 text-gray-400">Price ($)</th>
                <th className="text-right py-2 px-2 text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers.map((tier, i) => (
                <tr key={i} className="border-b border-[var(--card-border)]/50">
                  <td className="py-2 px-2">
                    <select
                      value={tier.membershipTier}
                      onChange={(e) => updateTier(i, "membershipTier", e.target.value)}
                      className={inputClass}
                    >
                      {MEMBERSHIP_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  {!hideCompClass && (
                    <td className="py-2 px-2">
                      <select
                        value={tier.compClass ?? "sport"}
                        onChange={(e) => updateTier(i, "compClass", e.target.value)}
                        className={inputClass}
                      >
                        {COMP_CLASSES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(tier.priceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateTier(
                          i,
                          "priceCents",
                          Math.round(parseFloat(e.target.value || "0") * 100)
                        )
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pricingTiers.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No pricing tiers. Click &quot;+ Add Row&quot; to add one.
          </p>
        )}
      </div>)}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg bg-[var(--accent-cyan)] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
