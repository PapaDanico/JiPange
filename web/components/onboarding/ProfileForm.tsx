"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES } from "@/lib/counties";
import { calculateNetPay } from "@/lib/tax";
import { formatKES } from "@/lib/budget";
import { profileSchema, type Profile } from "@/lib/types";
import {
  clearProfileDraft,
  getProfileDraft,
  setProfileDraft,
  setStoredProfile,
  setStoredWhatsAppNumber,
} from "@/lib/storage";
import { normalizeKenyanPhoneNumber } from "@/lib/whatsapp";

interface FormState {
  fullName: string;
  age: string;
  county: string;
  grossMonthlySalary: string;
  dependants: string;
  chamaMember: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  age: "29",
  county: "Nairobi",
  grossMonthlySalary: "",
  dependants: "0",
  chamaMember: false,
};

const TOTAL_STEPS = 6;
const WHATSAPP_ERROR = "Enter a valid Kenyan number, e.g. 07XX XXX XXX";

type SchemaFieldKey = "fullName" | "age" | "county" | "grossMonthlySalary" | "dependants";

export default function ProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [debouncedSalary, setDebouncedSalary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Restore an in-progress draft (e.g. after an accidental refresh or nav-away)
  // so filling in 6 fields doesn't have to survive in a single unbroken visit.
  // This is a one-time seed into the form's own editable state — every
  // keystroke after this point is a local edit, not a storage mirror, so it
  // doesn't fit useSyncExternalStore.
  useEffect(() => {
    const draft = getProfileDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time draft restore into independently-edited form state; see comment above
    setForm({
      fullName: draft.fullName,
      age: draft.age,
      county: draft.county,
      grossMonthlySalary: draft.grossMonthlySalary,
      dependants: draft.dependants,
      chamaMember: draft.chamaMember,
    });
    setWhatsappNumber(draft.whatsappNumber);
    if (
      typeof draft.currentStep === "number" &&
      Number.isInteger(draft.currentStep) &&
      draft.currentStep >= 1 &&
      draft.currentStep <= TOTAL_STEPS
    ) {
      setCurrentStep(draft.currentStep);
    }
  }, []);

  // Skip the very first run: it fires in the same commit as the restore effect
  // above, before that effect's setState has been applied, so writing here on
  // mount would immediately clobber the draft we just tried to restore with
  // the pre-hydration INITIAL_STATE.
  const isFirstDraftWrite = useRef(true);
  useEffect(() => {
    if (isFirstDraftWrite.current) {
      isFirstDraftWrite.current = false;
      return;
    }
    setProfileDraft({ ...form, whatsappNumber, currentStep });
  }, [form, whatsappNumber, currentStep]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSalary(form.grossMonthlySalary);
    }, 300);
    return () => clearTimeout(handle);
  }, [form.grossMonthlySalary]);

  const previewNet = useMemo(() => {
    const gross = Number(debouncedSalary);
    if (!gross || gross <= 0) return null;
    return calculateNetPay(gross);
  }, [debouncedSalary]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateField(key: SchemaFieldKey, rawValue: unknown) {
    const result = profileSchema.shape[key].safeParse(rawValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (result.success) {
        delete next[key];
      } else {
        next[key] = result.error.issues[0]?.message ?? "Required";
      }
      return next;
    });
  }

  function validateWhatsappNumber() {
    setErrors((prev) => {
      const next = { ...prev };
      if (!whatsappNumber.trim() || normalizeKenyanPhoneNumber(whatsappNumber)) {
        delete next.whatsappNumber;
      } else {
        next.whatsappNumber = WHATSAPP_ERROR;
      }
      return next;
    });
  }

  function getStepErrors(): Record<string, string> {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      const r = profileSchema.shape.fullName.safeParse(form.fullName.trim());
      if (!r.success) stepErrors.fullName = r.error.issues[0]?.message ?? "Required";
    }
    if (currentStep === 2 && whatsappNumber.trim()) {
      if (!normalizeKenyanPhoneNumber(whatsappNumber))
        stepErrors.whatsappNumber = WHATSAPP_ERROR;
    }
    if (currentStep === 3) {
      const r = profileSchema.shape.county.safeParse(form.county);
      if (!r.success) stepErrors.county = r.error.issues[0]?.message ?? "Required";
    }
    if (currentStep === 4) {
      const r = profileSchema.shape.age.safeParse(Number(form.age));
      if (!r.success) stepErrors.age = r.error.issues[0]?.message ?? "Required";
    }
    if (currentStep === 5) {
      const r = profileSchema.shape.dependants.safeParse(Number(form.dependants));
      if (!r.success) stepErrors.dependants = r.error.issues[0]?.message ?? "Required";
    }
    if (currentStep === 6) {
      const r = profileSchema.shape.grossMonthlySalary.safeParse(
        Number(form.grossMonthlySalary)
      );
      if (!r.success) stepErrors.grossMonthlySalary = r.error.issues[0]?.message ?? "Required";
    }

    return stepErrors;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const stepErrors = getStepErrors();
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setErrors({});
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // Final step — full schema validation before committing to storage.
    const candidate = {
      fullName: form.fullName.trim(),
      age: Number(form.age),
      county: form.county,
      grossMonthlySalary: Number(form.grossMonthlySalary),
      dependants: Number(form.dependants),
      chamaMember: form.chamaMember,
    };

    const result = profileSchema.safeParse(candidate);
    const normalizedWhatsapp = whatsappNumber.trim()
      ? normalizeKenyanPhoneNumber(whatsappNumber)
      : null;

    if (!result.success || (whatsappNumber.trim() && !normalizedWhatsapp)) {
      const fieldErrors: Record<string, string> = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      }
      if (whatsappNumber.trim() && !normalizedWhatsapp) {
        fieldErrors.whatsappNumber = WHATSAPP_ERROR;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setStoredProfile(result.data as Profile);
    if (normalizedWhatsapp) setStoredWhatsAppNumber(normalizedWhatsapp);
    clearProfileDraft();
    router.push("/picture");
  }

  return (
    <div className="w-full max-w-md">
      {/* Step progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={
                i < currentStep
                  ? "h-2 w-2 rounded-full bg-success"
                  : "h-2 w-2 rounded-full border border-success"
              }
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-[#4B4238]">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ── Step 1: Name ── */}
        {currentStep === 1 && (
          <>
            <div className="rounded-lg bg-[#f0f7f0] px-4 py-3">
              <p className="text-[13px] font-semibold leading-[1.7] text-primary">
                In 90 seconds you&apos;ll see:
              </p>
              <ul className="text-[13px] leading-[1.7] text-[#4B4238]">
                <li>
                  📊 <strong>Your Pesa Score</strong> — a single number rating your financial health
                </li>
                <li>
                  🔥 <strong>Your FIRE number</strong> — the exact amount you need to retire in
                  Kenya
                </li>
                <li>
                  💡 <strong>Your biggest money gap</strong> — and how to close it
                </li>
              </ul>
            </div>

            <p className="text-center text-xs text-[#4B4238]">
              Join 1,200+ Kenyans who&apos;ve already mapped their Pesa Picture this month.
            </p>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#4B4238]">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                onBlur={() => validateField("fullName", form.fullName.trim())}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                autoFocus
                className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Wanjiru Kamau"
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1 text-sm text-danger">
                  {errors.fullName}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: WhatsApp ── */}
        {currentStep === 2 && (
          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-[#4B4238]">
              WhatsApp number{" "}
              <span className="font-normal text-[#6f6e69]">(optional)</span>
            </label>
            <input
              id="whatsappNumber"
              type="tel"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              onBlur={validateWhatsappNumber}
              aria-invalid={Boolean(errors.whatsappNumber)}
              aria-describedby={errors.whatsappNumber ? "whatsappNumber-error" : undefined}
              autoFocus
              className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="07XX XXX XXX"
            />
            {errors.whatsappNumber && (
              <p id="whatsappNumber-error" className="mt-1 text-sm text-danger">
                {errors.whatsappNumber}
              </p>
            )}
            <p className="mt-1 text-xs text-[#6f6e69]">
              So you can share your Pesa Picture via WhatsApp
            </p>
          </div>
        )}

        {/* ── Step 3: County ── */}
        {currentStep === 3 && (
          <div>
            <label htmlFor="county" className="block text-sm font-medium text-[#4B4238]">
              County
            </label>
            <input
              id="county"
              type="text"
              list="county-options"
              value={form.county}
              onChange={(event) => updateField("county", event.target.value)}
              onBlur={() => validateField("county", form.county)}
              aria-invalid={Boolean(errors.county)}
              aria-describedby={errors.county ? "county-error" : undefined}
              autoFocus
              className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Start typing, e.g. Nai..."
            />
            <datalist id="county-options">
              {KENYA_COUNTIES.map((county) => (
                <option key={county} value={county} />
              ))}
            </datalist>
            {errors.county && (
              <p id="county-error" className="mt-1 text-sm text-danger">
                {errors.county}
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Age ── */}
        {currentStep === 4 && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="age" className="block text-sm font-medium text-[#4B4238]">
                Age
              </label>
              <span className="text-sm font-semibold text-primary">{form.age}</span>
            </div>
            <input
              id="age"
              type="range"
              min={18}
              max={80}
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              onBlur={() => validateField("age", Number(form.age))}
              aria-invalid={Boolean(errors.age)}
              aria-describedby={errors.age ? "age-error" : undefined}
              autoFocus
              className="mt-2 h-2 w-full accent-primary"
            />
            {errors.age && (
              <p id="age-error" className="mt-1 text-sm text-danger">
                {errors.age}
              </p>
            )}
          </div>
        )}

        {/* ── Step 5: Household ── */}
        {currentStep === 5 && (
          <>
            <div>
              <label htmlFor="dependants" className="block text-sm font-medium text-[#4B4238]">
                Number of dependants
              </label>
              <input
                id="dependants"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.dependants}
                onChange={(event) => updateField("dependants", event.target.value)}
                onBlur={() => validateField("dependants", Number(form.dependants))}
                aria-invalid={Boolean(errors.dependants)}
                aria-describedby={errors.dependants ? "dependants-error" : undefined}
                autoFocus
                className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.dependants && (
                <p id="dependants-error" className="mt-1 text-sm text-danger">
                  {errors.dependants}
                </p>
              )}
              <p className="mt-1 text-xs text-[#6f6e69]">
                Include children, spouse, parents and anyone who depends on your income.
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-[#4B4238]">
                Do you contribute to a Chama or SACCO?
              </span>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField("chamaMember", true)}
                  aria-pressed={form.chamaMember}
                  className={`h-12 flex-1 rounded-full border text-base font-medium transition-colors ${
                    form.chamaMember
                      ? "border-accent bg-accent text-[#171717]"
                      : "border-[#E5E0D8] bg-white text-[#4B4238]"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => updateField("chamaMember", false)}
                  aria-pressed={!form.chamaMember}
                  className={`h-12 flex-1 rounded-full border text-base font-medium transition-colors ${
                    !form.chamaMember
                      ? "border-accent bg-accent text-[#171717]"
                      : "border-[#E5E0D8] bg-white text-[#4B4238]"
                  }`}
                >
                  No
                </button>
              </div>
              <p className="mt-1 text-xs text-[#4B4238]">
                Helps us tailor your recommendations.
              </p>
            </div>
          </>
        )}

        {/* ── Step 6: Income ── */}
        {currentStep === 6 && (
          <>
            <div>
              <label
                htmlFor="grossMonthlySalary"
                className="block text-sm font-medium text-[#4B4238]"
              >
                Monthly gross salary (KES)
              </label>
              <input
                id="grossMonthlySalary"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.grossMonthlySalary}
                onChange={(event) => updateField("grossMonthlySalary", event.target.value)}
                onBlur={() =>
                  validateField("grossMonthlySalary", Number(form.grossMonthlySalary))
                }
                aria-invalid={Boolean(errors.grossMonthlySalary)}
                aria-describedby={
                  errors.grossMonthlySalary ? "grossMonthlySalary-error" : undefined
                }
                autoFocus
                className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 80000"
              />
              {errors.grossMonthlySalary && (
                <p id="grossMonthlySalary-error" className="mt-1 text-sm text-danger">
                  {errors.grossMonthlySalary}
                </p>
              )}
              <p className="mt-1 text-xs text-[#6f6e69]">
                Your total monthly pay before PAYE, NSSF and SHIF deductions — check your
                payslip.
              </p>
              {previewNet && (
                <p className="mt-2 rounded-lg bg-[#F1ECE3] px-4 py-3 text-sm text-primary">
                  Estimated take-home pay:{" "}
                  <span className="font-semibold">{formatKES(previewNet.netMonthly)}</span>{" "}
                  /month
                </p>
              )}
            </div>

            <p className="text-center text-xs text-[#5f5e5a]">
              <span aria-hidden="true">🔒 </span>
              Your data never leaves your device. All calculations run in your browser — nothing
              is stored or transmitted.
            </p>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setCurrentStep((prev) => prev - 1);
              }}
              className="h-[52px] rounded-lg border border-[#E5E0D8] bg-white px-6 text-base font-medium text-[#4B4238] transition-colors hover:bg-[#F1ECE3]"
            >
              ← Back
            </button>
          )}
          <button
            type="submit"
            className="min-h-[52px] flex-1 rounded-lg bg-primary text-base font-semibold text-white transition-colors hover:bg-[#584a3e]"
          >
            {currentStep < TOTAL_STEPS ? "Next →" : "Show me my numbers →"}
          </button>
        </div>
      </form>
    </div>
  );
}
