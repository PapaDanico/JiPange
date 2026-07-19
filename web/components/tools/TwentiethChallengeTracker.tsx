"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMonthKey,
  getWindowStatus,
  daysUntilWindow,
  calculateCurrentStreak,
  calculateBestStreak,
  totalSaved,
  MILESTONES,
  WINDOW_START_DAY,
  WINDOW_END_DAY,
  type CheckIn,
} from "@/lib/20th-challenge";
import { formatKES } from "@/lib/budget";
import { useStickyState } from "@/lib/hooks";
import NumberField from "./NumberField";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalendarReminderButton from "./CalendarReminderButton";
import ProductLinks from "./ProductLinks";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

const MONTH_DISPLAY: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

function parseCheckIns(json: string): CheckIn[] {
  try {
    const raw = JSON.parse(json);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_DISPLAY[m]} ${y}`;
}

export default function TwentiethChallengeTracker() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [savedCommitment, setSavedCommitment] = useStickyState(
    "jipange:20th-challenge",
    ""
  );
  const [checkInsJson, setCheckInsJson] = useStickyState(
    "jipange:20th-challenge:checkins",
    "[]"
  );
  // Draft state — only committed to localStorage when the user clicks Start
  const [draftCommitment, setDraftCommitment] = useState("");
  const [checkInAmount, setCheckInAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const checkIns = useMemo(() => parseCheckIns(checkInsJson), [checkInsJson]);
  const windowStatus = useMemo(
    () => getWindowStatus(today, checkIns),
    [today, checkIns]
  );
  const daysToWindow = useMemo(() => daysUntilWindow(today), [today]);
  const currentStreak = useMemo(
    () => calculateCurrentStreak(checkIns, today),
    [checkIns, today]
  );
  const bestStreak = useMemo(() => calculateBestStreak(checkIns), [checkIns]);
  const saved = useMemo(() => totalSaved(checkIns), [checkIns]);

  const commitmentNum = Number(savedCommitment) || 0;
  const hasCommitment = commitmentNum > 0;
  const draftNum = Number(draftCommitment) || 0;

  function handleStart() {
    if (draftNum > 0) setSavedCommitment(draftCommitment);
  }

  function handleCheckIn() {
    const amount = Number(checkInAmount) || commitmentNum;
    if (!amount) return;
    const newCheckIn: CheckIn = {
      month: getMonthKey(today),
      date: today.toISOString(),
      amount,
    };
    const updated = [newCheckIn, ...checkIns];
    setCheckInsJson(JSON.stringify(updated));
    setCheckInAmount("");
  }

  function handleReset() {
    setSavedCommitment("");
    setCheckInsJson("[]");
    setShowReset(false);
    setShowHistory(false);
  }

  // Milestone progress
  const nextMilestone = MILESTONES.find((m) => m.months > bestStreak);

  if (!hasCommitment) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary">
            Set your monthly savings commitment
          </p>
          <p className="mt-1 text-xs text-[#4B4238]">
            Choose an amount you&apos;ll commit to saving each month —
            then check in between the {WINDOW_START_DAY}th and{" "}
            {WINDOW_END_DAY}th to log that you did it.
          </p>
          <div className="mt-4">
            <NumberField
              id="commitment"
              label="Monthly savings commitment (KES)"
              value={draftCommitment}
              onChange={setDraftCommitment}
              placeholder="e.g. 5000"
            />
          </div>
          {draftNum > 0 && (
            <button
              type="button"
              onClick={handleStart}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Start the challenge →
            </button>
          )}
        </div>

        <div className="rounded-2xl bg-[#F1ECE3] p-4 text-xs text-[#4B4238]">
          <p className="font-semibold text-primary">How it works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Pick a fixed amount to save each month — start small and stay consistent.</li>
            <li>Every month between the {WINDOW_START_DAY}th and {WINDOW_END_DAY}th, confirm you saved it by tapping &ldquo;I saved it ✓&rdquo;.</li>
            <li>Your streak grows with every check-in. Miss a month and it resets to zero.</li>
            <li>Your savings sit in your MMF earning interest — the challenge just keeps you honest.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak hero */}
      <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
        <p className="text-5xl font-bold text-primary">
          {currentStreak > 0 ? "🔥" : "💤"} {currentStreak}
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">
          {currentStreak === 1 ? "month" : "months"} streak
        </p>
        <div className="mt-4 flex justify-center gap-8 text-xs text-[#4B4238]">
          <div>
            <p className="text-lg font-semibold text-primary">{bestStreak}</p>
            <p>best</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-success">{formatKES(saved)}</p>
            <p>total saved</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-primary">{checkIns.length}</p>
            <p>check-ins</p>
          </div>
        </div>
      </div>

      <BehavioralInsightStrip
        insight="Present bias is why most savings resolutions fail: the same amount feels more valuable now than next month. The 20th Challenge neutralises this by turning saving into a pre-committed act on a fixed date — research on commitment devices shows that scheduling a transfer in advance more than doubles follow-through compared to an open-ended intention."
      />

      {/* Milestones */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MILESTONES.map((m) => {
          const unlocked = bestStreak >= m.months;
          return (
            <div
              key={m.months}
              className={`flex min-w-[80px] flex-col items-center rounded-2xl border p-3 text-center ${
                unlocked
                  ? "border-accent bg-[#FFF8EA]"
                  : "border-[#E5E0D8] bg-white opacity-50"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <p className="mt-1 text-[10px] font-semibold text-primary">
                {m.months} mo
              </p>
              <p className="text-[9px] text-[#4B4238]">{m.label}</p>
            </div>
          );
        })}
      </div>

      {nextMilestone && (
        <p className="text-xs text-[#4B4238]">
          {nextMilestone.months - bestStreak} more{" "}
          {nextMilestone.months - bestStreak === 1 ? "month" : "months"} to
          unlock {nextMilestone.emoji} {nextMilestone.label}.
        </p>
      )}

      {/* Window status */}
      {windowStatus === "waiting" && (
        <div className="rounded-2xl bg-[#F1ECE3] p-4 text-sm text-[#4B4238]">
          <p className="font-semibold text-primary">
            ⏳ Check-in window opens in {daysToWindow} day
            {daysToWindow !== 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs">
            Your window is the {WINDOW_START_DAY}th–{WINDOW_END_DAY}th of
            each month. Keep saving — check back soon.
          </p>
        </div>
      )}

      {windowStatus === "open" && (
        <div className="rounded-2xl border-2 border-primary bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-primary">
            🎯 Window open — check in now!
          </p>
          <p className="mt-1 text-xs text-[#4B4238]">
            Confirm you saved your {formatKES(commitmentNum)} commitment this
            month. The window closes on the {WINDOW_END_DAY}th.
          </p>
          <div className="mt-3">
            <NumberField
              id="checkin-amount"
              label={`Amount saved this cycle (KES) — default ${formatKES(commitmentNum)}`}
              value={checkInAmount}
              onChange={setCheckInAmount}
              placeholder={String(commitmentNum)}
            />
          </div>
          <button
            type="button"
            onClick={handleCheckIn}
            className="mt-3 w-full rounded-2xl bg-success py-3 text-sm font-semibold text-white transition-colors hover:bg-success/90"
          >
            ✓ I saved it!
          </button>
        </div>
      )}

      {windowStatus === "done" && (
        <div className="rounded-2xl bg-[#E9F5EC] p-4 text-sm text-[#2b4a2b]">
          <p className="font-semibold">
            ✅ Cycle complete for {formatMonthLabel(getMonthKey(today))}!
          </p>
          <p className="mt-1 text-xs">
            You&apos;re on a {currentStreak}-month streak. Next window opens
            on the {WINDOW_START_DAY}th.
          </p>
        </div>
      )}

      {windowStatus === "closed" && (
        <div className="rounded-2xl border border-[#F0C06A] bg-[#FFF4DC] p-4 text-sm">
          <p className="font-semibold text-warning">
            ⚠️ Window closed for this month.
          </p>
          <p className="mt-1 text-xs text-[#4B4238]">
            The check-in window (
            {WINDOW_START_DAY}th–{WINDOW_END_DAY}th) passed without a
            check-in. Your streak resets — a new cycle starts next month.
          </p>
        </div>
      )}

      {/* Commitment display */}
      <div className="flex items-center justify-between rounded-2xl bg-[#F1ECE3] px-4 py-3 text-sm">
        <span className="text-[#4B4238]">Monthly commitment</span>
        <span className="font-semibold text-primary">
          {formatKES(commitmentNum)}/month
        </span>
      </div>

      {/* MMF links — keep the commitment earning interest */}
      <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Keep your savings in an MMF" />

      {/* Share */}
      {currentStreak > 0 && (
        <ShareResultButton
          message={`🔥 *My 20th-to-20th Challenge*\n\nCurrent streak: ${currentStreak} month${currentStreak !== 1 ? "s" : ""}\nBest streak: ${bestStreak} months\nTotal saved: ${formatKES(saved)}\n\nJoin the challenge → jipangefinance.netlify.app/tools/20th-challenge`}
        />
      )}

      {/* Calendar reminder */}
      <CalendarReminderButton />

      {/* History toggle */}
      {checkIns.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((p) => !p)}
            aria-expanded={showHistory}
            className="text-sm font-medium text-primary underline"
          >
            {showHistory ? "− Hide history" : `+ Show history (${checkIns.length} check-ins)`}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {checkIns.map((ci, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm"
                >
                  <span className="text-[#4B4238]">
                    {formatMonthLabel(ci.month)}
                  </span>
                  <span className="font-medium text-success">
                    {formatKES(ci.amount)} ✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      <div className="pt-2">
        {!showReset ? (
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-xs text-[#9A8B80] underline underline-offset-2 hover:text-primary"
          >
            Change commitment / reset challenge
          </button>
        ) : (
          <div className="rounded-2xl border border-danger bg-[#FBEAEA] p-4 text-sm">
            <p className="font-semibold text-danger">
              This will clear your streak and history.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-white"
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-xs font-medium text-[#4B4238]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
