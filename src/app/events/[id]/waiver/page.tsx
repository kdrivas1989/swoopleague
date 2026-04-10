"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";

const WAIVER_SECTIONS = [
  {
    num: 1,
    title: "REPRESENTATIONS, WARRANTIES & ASSUMPTIONS OF RISK",
    text: "Participant acknowledges that canopy piloting is an inherently dangerous activity involving significant risks of serious bodily injury and death. These risks include but are not limited to: equipment malfunction, operator error, weather conditions, structural failure, collision with objects or other participants, and landing hazards. Participant voluntarily assumes all risks associated with participation, whether known or unknown, including the risk of permanent disability or death.",
  },
  {
    num: 2,
    title: "EXEMPTION AND RELEASE FROM LIABILITY",
    text: "Participant hereby releases, discharges, and holds harmless the United States Canopy Piloting Association (USCPA), its officers, directors, agents, employees, volunteers, sponsors, equipment manufacturers, aircraft owners and operators, land owners, facility owners, skydiving referral services, and all other potentially liable parties (collectively \"Released Parties\") from any and all liability, claims, demands, actions, or causes of action for damage, loss, or injury (including death) to person or property arising out of or related to participation in canopy piloting activities.",
  },
  {
    num: 3,
    title: "COVENANT NOT TO SUE",
    text: "Participant agrees never to institute any suit or action at law or otherwise against the Released Parties, and further instructs his/her heirs, executors, administrators, and personal representatives not to institute any claim, demand, suit, or action at law or otherwise against the Released Parties arising out of or related to participation. Should any Released Party be required to defend against such claims, the participant or estate shall be responsible for all attorneys' fees and costs incurred.",
  },
  {
    num: 4,
    title: "INDEMNITY AGAINST CLAIMS",
    text: "Participant agrees to indemnify, defend, and hold harmless the Released Parties from any and all claims, demands, suits, judgments, losses, or expenses of any nature whatsoever arising out of or related to participation, including claims brought by third parties and claims for contribution or indemnity.",
  },
  {
    num: 5,
    title: "VALIDITY OF WAIVER",
    text: "Participant acknowledges and agrees that this waiver and release of liability is intended to be as broad and inclusive as permitted by the laws of the applicable jurisdiction, and that if any portion is held invalid, the remaining portions shall continue in full legal force and effect. Participant acknowledges understanding the legal consequences of signing this document.",
  },
  {
    num: 6,
    title: "MEDICAL REPRESENTATIONS",
    text: "Participant warrants and represents that he/she has no physical infirmity, chronic illness, or medical condition that would prevent safe participation in canopy piloting activities. Participant is not currently under medical treatment or taking any medication that could impair physical or mental function during participation. Participant agrees to immediately disclose any changes in health status prior to participation.",
  },
  {
    num: 7,
    title: "APPLICABLE LAW & VENUE",
    text: "This agreement shall be governed by and construed in accordance with the laws of the State of Florida. Any dispute arising out of or related to this agreement or participation shall be subject to the exclusive jurisdiction of the courts located in Volusia County, Florida. Participant hereby waives the right to a jury trial in any action, proceeding, or counterclaim.",
  },
  {
    num: 8,
    title: "SEVERABILITY / MULTIPLE WAIVERS",
    text: "If any provision of this agreement is found to be unenforceable or invalid, such finding shall not affect the enforceability of the remaining provisions. This waiver may be executed in multiple counterparts, each of which shall be deemed an original. Participant may be required to sign additional waivers for specific events or activities.",
  },
  {
    num: 9,
    title: "CONTINUATION OF OBLIGATIONS",
    text: "This agreement shall be binding upon the participant and his/her heirs, executors, administrators, personal representatives, and assigns. The obligations set forth herein shall continue in full force and effect beyond the term of participation and shall survive the termination of any relationship between the participant and the Released Parties.",
  },
  {
    num: 10,
    title: "INFORMATION ACCURACY",
    text: "Participant warrants and represents that all information provided in connection with this waiver and any associated registration is truthful, accurate, and complete. Participant acknowledges that the Released Parties are relying on the accuracy of this information and that any misrepresentation may result in disqualification, denial of participation, or additional liability.",
  },
];

const inputClasses =
  "w-full rounded-lg border border-[#3a3a5a] bg-[#16213e] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]";

function buildMonths() {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
}

function buildDays() {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}

function buildYears() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 100; y--) {
    years.push(y);
  }
  return years;
}

export default function WaiverPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  // Participant info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");
  const [totalJumps, setTotalJumps] = useState("");
  const [jumpsLast12, setJumpsLast12] = useState("");
  const [canopyTypeSize, setCanopyTypeSize] = useState("");
  const [jumpsOnCanopy, setJumpsOnCanopy] = useState("");

  // Initials checkboxes (one per section)
  const [sectionChecks, setSectionChecks] = useState<boolean[]>(
    new Array(WAIVER_SECTIONS.length).fill(false)
  );

  // Signatures
  const [signatureData, setSignatureData] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianSignatureData, setGuardianSignatureData] = useState("");

  // Consent
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [eSignConsent, setESignConsent] = useState(false);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [waiverComplete, setWaiverComplete] = useState(false);

  // Computed
  const isMinor = (() => {
    if (!dobMonth || !dobDay || !dobYear) return false;
    const monthIndex = buildMonths().indexOf(dobMonth);
    const dob = new Date(Number(dobYear), monthIndex, Number(dobDay));
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age < 18;
  })();

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.event) {
          setEventName(data.event.name);
        } else {
          setEventError("Event not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setEventError("Failed to load event");
        setLoading(false);
      });
  }, [eventId]);

  function toggleSection(index: number) {
    setSectionChecks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email address";
    if (!dobMonth || !dobDay || !dobYear) errs.dob = "Date of birth is required";
    if (!phone.trim()) errs.phone = "Phone is required";
    if (!totalJumps) errs.totalJumps = "Total jumps is required";
    if (!jumpsLast12) errs.jumpsLast12 = "Jumps in past 12 months is required";
    if (!canopyTypeSize.trim()) errs.canopyTypeSize = "Canopy type and size is required";
    if (!jumpsOnCanopy) errs.jumpsOnCanopy = "Jumps on canopy is required";
    if (!sectionChecks.every(Boolean)) errs.sections = "You must acknowledge all sections";
    if (!signatureData) errs.signature = "Signature is required";
    if (!eSignConsent) errs.eSign = "You must consent to electronic signature";
    if (isMinor && !guardianName.trim()) errs.guardianName = "Guardian name is required";
    if (isMinor && !guardianSignatureData) errs.guardianSignature = "Guardian signature is required";
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-error]");
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const monthIndex = buildMonths().indexOf(dobMonth);
      const dateOfBirth = `${dobYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;

      const body = {
        eventId: Number(eventId),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dateOfBirth,
        phone: phone.trim() || null,
        totalJumps: totalJumps ? Number(totalJumps) : null,
        jumpsLast12Months: jumpsLast12 ? Number(jumpsLast12) : null,
        canopyTypeAndSize: canopyTypeSize.trim() || null,
        jumpsOnCanopy: jumpsOnCanopy ? Number(jumpsOnCanopy) : null,
        initials: sectionChecks.map((_, i) => `S${i + 1}`).join(","),
        signatureData,
        guardianName: isMinor ? guardianName.trim() : null,
        guardianSignatureData: isMinor ? guardianSignatureData : null,
        isMinor,
        marketingConsent,
      };

      const res = await fetch("/api/waiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Waiver submission failed (${res.status})`);
      }

      await res.json();
      setWaiverComplete(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">{eventError}</div>
      </div>
    );
  }

  if (waiverComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">&#10003;</div>
          <h1 className="text-3xl font-bold text-[#00d4ff] mb-4">Waiver Signed</h1>
          <p className="text-gray-400 mb-8">
            Thank you for completing the USCPA participant waiver for {eventName}.
          </p>
          <a
            href="/events"
            className="inline-block rounded-lg bg-[#00d4ff] px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
          >
            Back to Events
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/events" className="text-[#00d4ff] hover:underline text-sm mb-6 inline-block">
          &larr; Back to Events
        </a>
        <h1 className="text-3xl font-bold text-[#00d4ff] mb-2">{eventName}</h1>
        <p className="text-gray-400 mb-8">
          Please read and sign the waiver below before proceeding to registration.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Waiver Legal Text with inline acknowledgments */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] p-6">
            <h2 className="text-xl font-bold text-[#ffc107] mb-6">
              USCPA Participant Waiver, Release & Assumption of Risk Agreement
            </h2>
            <div className="space-y-6">
              {WAIVER_SECTIONS.map((section, i) => (
                <div key={section.num}>
                  <h3 className="text-sm font-bold text-[#00d4ff] mb-1">
                    {section.num}. {section.title}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">{section.text}</p>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sectionChecks[i]}
                      onChange={() => toggleSection(i)}
                      className="mt-0.5 h-4 w-4 rounded border-[#3a3a5a] bg-[#16213e] text-[#00d4ff] focus:ring-[#00d4ff] focus:ring-offset-0 accent-[#00d4ff]"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      I have read and agree to Section {section.num}: {section.title}
                    </span>
                  </label>
                  {i < WAIVER_SECTIONS.length - 1 && (
                    <div className="border-b border-[#2a2a4a] mt-4" />
                  )}
                </div>
              ))}
            </div>
            {errors.sections && (
              <p data-error className="mt-4 text-xs text-red-400">
                {errors.sections}
              </p>
            )}
          </div>

          {/* Participant Information */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] p-6">
            <h2 className="text-lg font-bold text-[#ffc107] mb-4">Participant Information</h2>
            <div className="space-y-4">
              {/* First / Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={inputClasses}
                  />
                  {errors.firstName && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={inputClasses}
                  />
                  {errors.lastName && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClasses}
                />
                {errors.email && (
                  <p data-error className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Month</option>
                    {buildMonths().map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Day</option>
                    {buildDays().map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Year</option>
                    {buildYears().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {errors.dob && (
                  <p data-error className="mt-1 text-xs text-red-400">{errors.dob}</p>
                )}
                {isMinor && (
                  <p className="mt-1 text-xs text-[#ffc107]">
                    Participant is under 18. A guardian signature will be required below.
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={inputClasses}
                />
                {errors.phone && (
                  <p data-error className="mt-1 text-xs text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Jump Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Total Jumps <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalJumps}
                    onChange={(e) => setTotalJumps(e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    className={inputClasses}
                  />
                  {errors.totalJumps && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.totalJumps}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Jumps in Past 12 Months <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={jumpsLast12}
                    onChange={(e) => setJumpsLast12(e.target.value)}
                    placeholder="e.g. 100"
                    min="0"
                    className={inputClasses}
                  />
                  {errors.jumpsLast12 && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.jumpsLast12}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Size and Type of Canopy <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={canopyTypeSize}
                    onChange={(e) => setCanopyTypeSize(e.target.value)}
                    placeholder="e.g. Valkyrie 67"
                    className={inputClasses}
                  />
                  {errors.canopyTypeSize && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.canopyTypeSize}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Jumps on This Canopy <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={jumpsOnCanopy}
                    onChange={(e) => setJumpsOnCanopy(e.target.value)}
                    placeholder="e.g. 200"
                    min="0"
                    className={inputClasses}
                  />
                  {errors.jumpsOnCanopy && (
                    <p data-error className="mt-1 text-xs text-red-400">{errors.jumpsOnCanopy}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] p-6">
            <h2 className="text-lg font-bold text-[#ffc107] mb-4">Signature</h2>
            <SignaturePad
              onChange={setSignatureData}
              label="Participant Signature *"
            />
            {errors.signature && (
              <p data-error className="mt-2 text-xs text-red-400">{errors.signature}</p>
            )}

            {/* Guardian Section (if minor) */}
            {isMinor && (
              <div className="mt-6 pt-6 border-t border-[#2a2a4a]">
                <h3 className="text-base font-bold text-[#ffc107] mb-3">
                  Parent/Guardian Information
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Because the participant is under 18, a parent or legal guardian must also sign.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">
                      Guardian Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Guardian full name"
                      className={inputClasses}
                    />
                    {errors.guardianName && (
                      <p data-error className="mt-1 text-xs text-red-400">{errors.guardianName}</p>
                    )}
                  </div>
                  <SignaturePad
                    onChange={setGuardianSignatureData}
                    label="Guardian Signature *"
                  />
                  {errors.guardianSignature && (
                    <p data-error className="mt-2 text-xs text-red-400">{errors.guardianSignature}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Consent Checkboxes */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={eSignConsent}
                onChange={(e) => setESignConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#3a3a5a] bg-[#16213e] text-[#00d4ff] focus:ring-[#00d4ff] focus:ring-offset-0 accent-[#00d4ff]"
              />
              <span className="text-sm text-gray-300">
                <span className="text-red-400">*</span> I consent to use an electronic signature and understand it has the same legal effect as a handwritten signature.
              </span>
            </label>
            {errors.eSign && (
              <p data-error className="text-xs text-red-400">{errors.eSign}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#3a3a5a] bg-[#16213e] text-[#00d4ff] focus:ring-[#00d4ff] focus:ring-offset-0 accent-[#00d4ff]"
              />
              <span className="text-sm text-gray-300">
                I would like to receive updates and marketing communications from USCPA.
              </span>
            </label>
          </div>

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
            className="w-full rounded-lg bg-[#00d4ff] px-6 py-3.5 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting Waiver..." : "Agree & Sign Waiver"}
          </button>
        </form>
      </div>
    </div>
  );
}
