"use client";

import { useMemo } from "react";
import {
  calculateChamaInvestment,
  calculateMerryGoRound,
  MAX_CHAMA_MEMBERS,
} from "@/lib/chama";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import QuickFillChips from "./QuickFillChips";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

const MEMBER_CHIPS = [
  { label: "5", value: "5" },
  { label: "10", value: "10" },
  { label: "12", value: "12" },
  { label: "20", value: "20" },
  { label: "30", value: "30" },
];

const CONTRIB_CHIPS = [
  { label: "500", value: "500" },
  { label: "1K", value: "1000" },
  { label: "2K", value: "2000" },
  { label: "5K", value: "5000" },
  { label: "10K", value: "10000" },
];

const RETURN_CHIPS = [
  { label: "11% MMF", value: "11" },
  { label: "13% SACCO", value: "13" },
  { label: "16% IFB", value: "16" },
];

type Mode = "merry-go-round" | "investment";

export default function ChamaGroupCalculator() {
  const [mode, setMode] = useStickyState<Mode>("jipange:tool:chama:mode", "merry-go-round");
  const [members, setMembers] = useStickyState("jipange:tool:chama:members", "12");
  const [contribution, setContribution] = useStickyState(
    "jipange:tool:chama:contribution",
    "2000"
  );
  const [bufferPercent, setBufferPercent] = useStickyState(
    "jipange:tool:chama:bufferPercent",
    "5"
  );
  const [annualReturn, setAnnualReturn] = useStickyState(
    "jipange:tool:chama:annualReturn",
    "11"
  );

  const mgr = useMemo(() => {
    const m = Number(members);
    const c = Number(contribution);
    // Clamp matches the slider's 0-20 range below — the slider is the only
    // way to set this value, so the two must agree.
    const b = Math.min(20, Math.max(0, Number(bufferPercent) || 0));
    if (!m || m < 2 || m > MAX_CHAMA_MEMBERS || !c || c <= 0) return null;
    return calculateMerryGoRound(m, c, b);
  }, [members, contribution, bufferPercent]);

  const inv = useMemo(() => {
    const m = Number(members);
    const c = Number(contribution);
    const r = Math.max(0, Number(annualReturn) || 0);
    if (!m || m < 2 || m > MAX_CHAMA_MEMBERS || !c || c <= 0) return null;
    return calculateChamaInvestment(m, c, r);
  }, [members, contribution, annualReturn]);

  const result = mode === "merry-go-round" ? mgr : inv;

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty =
    mode !== "merry-go-round" ||
    members !== "12" ||
    contribution !== "2000" ||
    bufferPercent !== "5" ||
    annualReturn !== "11";

  function handleReset() {
    setMode("merry-go-round");
    setMembers("12");
    setContribution("2000");
    setBufferPercent("5");
    setAnnualReturn("11");
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border bg-white p-1">
        <button
          type="button"
          onClick={() => setMode("merry-go-round")}
          aria-pressed={mode === "merry-go-round"}
          className={`min-h-11 flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "merry-go-round"
              ? "bg-primary text-white"
              : "text-ink-soft hover:bg-canvas"
          }`}
        >
          Merry-go-round
        </button>
        <button
          type="button"
          onClick={() => setMode("investment")}
          aria-pressed={mode === "investment"}
          className={`min-h-11 flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "investment"
              ? "bg-primary text-white"
              : "text-ink-soft hover:bg-canvas"
          }`}
        >
          Investment pool
        </button>
      </div>

      <div>
        <NumberField
          id="members"
          max={MAX_CHAMA_MEMBERS}
          label="Number of chama members"
          value={members}
          onChange={setMembers}
          placeholder="e.g. 12"
        />
        <QuickFillChips
          label="Common sizes:"
          options={MEMBER_CHIPS}
          onSelect={setMembers}
          current={members}
        />
      </div>

      <div>
        <NumberField
          id="contribution"
          label="Monthly contribution per member (Ksh)"
          value={contribution}
          onChange={setContribution}
          placeholder="e.g. 2000"
        />
        <QuickFillChips
          label="Quick fill:"
          options={CONTRIB_CHIPS}
          onSelect={setContribution}
          current={contribution}
        />
      </div>

      {mode === "merry-go-round" && (
        <div>
          <label htmlFor="bufferPercent" className="text-sm font-medium text-ink-soft">
            Emergency/welfare buffer (% of monthly pool)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="bufferPercent"
              type="range"
              min={0}
              max={20}
              step={1}
              value={bufferPercent}
              onChange={(e) => setBufferPercent(e.target.value)}
              className="h-11 flex-1 cursor-pointer accent-primary"
            />
            <span className="w-10 text-right text-sm font-semibold text-primary">
              {bufferPercent}%
            </span>
          </div>
        </div>
      )}

      {mode === "investment" && (
        <div>
          <NumberField
            id="annualReturn"
            label="Expected annual return (%)"
            value={annualReturn}
            onChange={setAnnualReturn}
            suffix="%"
          />
          <QuickFillChips
            label="Common rates:"
            options={RETURN_CHIPS}
            onSelect={setAnnualReturn}
            current={annualReturn}
          />
        </div>
      )}

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && mode === "merry-go-round" && mgr && (
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <ResultCard
            label={`Monthly pool (${members} × ${formatKES(Number(contribution))})`}
            value={formatKES(mgr.monthlyPool)}
            tone="primary"
          />
          <ResultCard
            label="Your rotation payout (when it's your turn)"
            value={formatKES(mgr.rotationPayout)}
            tone="success"
            sublabel={`After the ${bufferPercent}% welfare buffer — paid in full, one month per cycle.`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="Cycle length"
              value={`${mgr.cycleMonths} months`}
              sublabel="Each member gets one turn"
            />
            <ResultCard
              label="Group welfare fund per cycle"
              value={formatKES(mgr.emergencyFundPerCycle)}
              sublabel="Accumulated from monthly buffer"
            />
          </div>

          <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
            <p className="font-semibold text-primary">How the math works</p>
            {/*
              This used to print the same number twice under two labels — one
              green, one red — because in nominal cash terms every slot IS the
              same: everybody pays the contribution for all N months and
              receives the payout once. The difference is timing, and the tool
              said nothing about what timing is worth.
            */}
            <p className="mt-1">
              In pure cash, every member ends the cycle identically: each pays{" "}
              {formatKES(Number(contribution) * mgr.cycleMonths)} across the{" "}
              {mgr.cycleMonths} months and receives {formatKES(mgr.rotationPayout)} once, so
              the cash result is {formatKES(mgr.netGainFirstReceiver)} for everybody —
              the welfare buffer the group holds back. Going first is not a bigger payout.
            </p>
            <p className="mt-1">
              <strong>What going first is actually worth</strong> is the time. Receiving in
              month 1 is an interest-free loan from the group; receiving in month{" "}
              {mgr.cycleMonths} is an interest-free loan <em>to</em> it. Measured against the{" "}
              {mgr.discountRateSource}, slot 1 is worth{" "}
              <span className="font-medium text-success">
                {formatKES(Math.round(mgr.firstVersusLastKES))}
              </span>{" "}
              more than the last slot.
            </p>
            <p className="mt-2 text-xs text-faint">
              That gap is what the group is really allocating when it picks the order — and
              why rotating who goes first between cycles, or drawing lots each cycle, is the
              fairness mechanism rather than a formality. Group savings discipline is still
              the larger return.
            </p>
          </div>

          <ShareResultButton
            message={`🤝 *Our Chama Rotation*\n\nMembers: ${members}\nMonthly contribution: ${formatKES(Number(contribution))} each\nMonthly pool: ${formatKES(mgr.monthlyPool)}\nRotation payout: ${formatKES(mgr.rotationPayout)}\nCycle: ${mgr.cycleMonths} months\n\nSimulate yours → jipangefinance.org/tools/chama`}
          />
        </div>
      )}

      {result && mode === "investment" && inv && (
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <ResultCard
            label={`Monthly pool invested (${members} × ${formatKES(Number(contribution))})`}
            value={formatKES(inv.monthlyPool)}
            tone="primary"
          />
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-primary">Group pool value over time</p>
            <div className="mt-3 space-y-3">
              {[
                { label: "After 1 year", total: inv.value1Yr, perMember: inv.perMemberShare1Yr },
                { label: "After 3 years", total: inv.value3Yr, perMember: inv.perMemberShare3Yr },
                { label: "After 5 years", total: inv.value5Yr, perMember: inv.perMemberShare5Yr },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-soft">{row.label}</span>
                  <div className="text-right">
                    <span className="font-semibold text-primary">{formatKES(row.total)}</span>
                    <span className="block text-xs text-ink-soft">
                      {formatKES(row.perMember)}/member
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-soft">
            Returns assume regular monthly deposits compounding at{" "}
            {annualReturn}% p.a. — achievable today via regulated MMFs (e.g. Cytonn, CIC, ICEA
            Lion) or SACCO dividend accounts. Actual returns vary.
          </p>

          <ShareResultButton
            message={`📈 *Our Chama Investment Pool*\n\n${members} members × ${formatKES(Number(contribution))}/month at ${annualReturn}% return:\n1 year: ${formatKES(inv.value1Yr)} (${formatKES(inv.perMemberShare1Yr)}/member)\n3 years: ${formatKES(inv.value3Yr)} (${formatKES(inv.perMemberShare3Yr)}/member)\n5 years: ${formatKES(inv.value5Yr)} (${formatKES(inv.perMemberShare5Yr)}/member)\n\nSimulate yours → jipangefinance.org/tools/chama`}
          />
        </div>
      )}

      {result && (
        <>
          <ExportCardButton containerRef={resultsRef} filename="chama-calculator" />
          <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Where to invest your chama savings" />
          <CalculatorDisclaimer
            extraNotes={[
              "Chama governance, rotation order, and emergency fund rules vary by group constitution.",
              "Investment returns shown are estimates using a constant compounding rate — actual group MMF or SACCO returns fluctuate.",
            ]}
          />
        </>
      )}
    </div>
  );
}
