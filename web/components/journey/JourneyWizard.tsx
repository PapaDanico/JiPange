"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  JOURNEY_QUESTIONS,
  type AssetLocation,
  type JourneyAnswers,
} from "@/lib/journey";
import { setStoredJourneyAnswers } from "@/lib/storage";

const TOTAL_STEPS = JOURNEY_QUESTIONS.length;

/**
 * The 90-second funnel: five tap-only questions. No typing anywhere —
 * every answer is one large touch target — and no account is asked for
 * before the dashboard is ready.
 */
export default function JourneyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<keyof JourneyAnswers, unknown>>>({});
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const question = JOURNEY_QUESTIONS[step];

  function finish(finalAnswers: JourneyAnswers) {
    setSubmitting(true);
    setStoredJourneyAnswers(finalAnswers);
    // Fire-and-forget: the dashboard recomputes from stored answers with the
    // identical pure engine, so the reveal moment never waits on the network.
    fetch("/api/journey-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalAnswers),
    }).catch(() => {});
    router.push("/dashboard");
  }

  function advance(patch: Partial<Record<keyof JourneyAnswers, unknown>>) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      finish(next as JourneyAnswers);
    }
  }

  function handleSingleSelect(value: string) {
    advance({ [question.key]: value });
  }

  function toggleMulti(value: string) {
    setMultiSelection((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function confirmMulti() {
    if (multiSelection.length === 0) return;
    advance({ current_vehicle: multiSelection as AssetLocation[] });
  }

  return (
    <div className="w-full max-w-md">
      {/* Privacy guard — prominent, at the very top of the funnel. */}
      <div className="rounded-xl border border-[#CFE3CF] bg-[#f0f7f0] px-4 py-3 text-[13px] leading-relaxed text-[#2b4a2b]">
        <span aria-hidden="true">🔒 </span>
        <strong>Privacy-First:</strong> JiPange is completely anonymous. We do not link your
        financial metrics to your legal identity, phone number, or bank accounts. Your data is
        yours.
      </div>

      {/* Progress indicator: [ 1 - 2 - 3 - 4 - 5 ] */}
      <div className="mt-6" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step
                    ? "bg-success text-white"
                    : i === step
                      ? "bg-accent text-[#171717]"
                      : "border border-[#C9BFB2] text-[#6f6e69]"
                }`}
              >
                {i + 1}
              </span>
              {i < TOTAL_STEPS - 1 && <span className="h-px w-3 bg-[#C9BFB2]" aria-hidden="true" />}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-[#4B4238]">
          Question {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      <h2 className="mt-6 text-xl font-semibold text-primary">{question.title}</h2>
      {question.multi && (
        <p className="mt-1 text-sm text-[#4B4238]">Tap all that apply, then continue.</p>
      )}

      <div className="mt-4 space-y-3">
        {question.options.map((option) => {
          const selected = question.multi
            ? multiSelection.includes(option.value)
            : answers[question.key] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                question.multi ? toggleMulti(option.value) : handleSingleSelect(option.value)
              }
              aria-pressed={selected}
              className={`flex min-h-[60px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition-colors ${
                selected
                  ? "border-accent bg-[#FFF8EA] text-primary"
                  : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="flex-1">{option.label}</span>
              {selected && (
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={`mt-6 ${step > 0 ? "flex gap-3" : ""}`}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="h-[52px] rounded-lg border border-[#E5E0D8] bg-white px-6 text-base font-medium text-[#4B4238] transition-colors hover:bg-[#F1ECE3]"
          >
            ← Back
          </button>
        )}
        {question.multi && (
          <button
            type="button"
            onClick={confirmMulti}
            disabled={multiSelection.length === 0 || submitting}
            className="min-h-[52px] flex-1 rounded-lg bg-primary text-base font-semibold text-white transition-colors hover:bg-[#584a3e] disabled:opacity-50"
          >
            {submitting ? "Building your dashboard..." : "Continue →"}
          </button>
        )}
      </div>

      {submitting && !question.multi && (
        <p className="mt-4 text-center text-sm text-[#4B4238]">Building your dashboard...</p>
      )}

      <p className="mt-8 text-center text-xs text-[#6f6e69]">
        Just exploring?{" "}
        <Link href="/tools" className="font-medium text-primary underline">
          Try the free calculators
        </Link>{" "}
        or{" "}
        <Link href="/planners" className="font-medium text-primary underline">
          plan a specific goal
        </Link>
        {" "}— no questions asked.
      </p>
    </div>
  );
}
