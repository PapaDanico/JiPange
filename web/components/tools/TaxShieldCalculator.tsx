"use client";

import { useMemo } from "react";
import {
  MAX_MONTHLY_MORTGAGE_EXEMPTION,
  MAX_MONTHLY_PENSION_EXEMPTION,
  taxShield,
} from "@/lib/tax-shield";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

const PROVIDERS = [
  { name: "Britam", href: "https://britam.com" },
  { name: "ICEA Lion", href: "https://icealion.co.ke" },
  { name: "Sanlam", href: "https://www.sanlam.co.ke" },
];

/**
 * The KRA tax shield: unused pension/mortgage/insurance relief headroom is
 * PAYE the user pays every month that could be building their own wealth.
 */
export default function TaxShieldCalculator() {
  const [gross, setGross] = useStickyState("jipange:tool:tax-shield:gross", "");
  const [pension, setPension] = useStickyState("jipange:tool:tax-shield:pension", "0");
  const [mortgage, setMortgage] = useStickyState("jipange:tool:tax-shield:mortgage", "0");
  const [insurance, setInsurance] = useStickyState("jipange:tool:tax-shield:insurance", "0");

  const parsedGross = Number(gross) || 0;
  const shield = useMemo(() => {
    if (parsedGross <= 0) return null;
    return taxShield({
      grossMonthly: parsedGross,
      pensionContribution: Number(pension) || 0,
      mortgageInterestMonthly: Number(mortgage) || 0,
      insurancePremiumMonthly: Number(insurance) || 0,
    });
  }, [parsedGross, pension, mortgage, insurance]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(shield !== null);

  const maxed = shield !== null && shield.totalMonthlyRecoverable < 1;

  const isDirty = gross !== "" || pension !== "0" || mortgage !== "0" || insurance !== "0";

  function handleReset() {
    setGross("");
    setPension("0");
    setMortgage("0");
    setInsurance("0");
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="shieldGross"
        label="Gross monthly salary (Ksh)"
        value={gross}
        onChange={setGross}
        placeholder="e.g. 150000"
      />

      {/* Interactive relief sliders — drag toward the caps and watch the leak close. */}
      {(
        [
          ["shieldPension", "Current pension contribution", pension, setPension, MAX_MONTHLY_PENSION_EXEMPTION],
          ["shieldMortgage", "Current mortgage interest", mortgage, setMortgage, MAX_MONTHLY_MORTGAGE_EXEMPTION],
          ["shieldInsurance", "Life / education insurance premium", insurance, setInsurance, 10_000],
        ] as const
      ).map(([id, label, value, setter, max]) => (
        <div key={id}>
          <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm font-medium text-ink-soft">
              {label}
            </label>
            <span className="text-sm font-semibold text-primary">
              {formatKES(Number(value) || 0)}/mo
            </span>
          </div>
          <input
            id={id}
            type="range"
            min={0}
            max={max}
            step={500}
            value={Number(value) || 0}
            onChange={(event) => setter(event.target.value)}
            className="mt-2 h-11 w-full cursor-pointer accent-primary"
          />
        </div>
      ))}

      <ResetLink show={isDirty} onReset={handleReset} />

      {shield && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          {/* The leak gauge */}
          <div className="rounded-2xl border-2 border-danger bg-danger-soft p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
              Your Monthly KRA Tax Leak
            </h2>
            <p className="mt-2 text-3xl font-semibold text-danger" data-testid="tax-leak">
              {formatKES(shield.totalMonthlyRecoverable)}
              <span className="text-base font-normal text-ink-soft"> / month</span>
            </p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-danger transition-all duration-500"
                style={{
                  width: `${Math.min(100, (shield.totalMonthlyRecoverable / 20000) * 100)}%`,
                }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              <li>
                Pension headroom {formatKES(shield.pensionHeadroom)} →{" "}
                <strong>{formatKES(shield.pensionTaxSavings)}</strong> PAYE recoverable
              </li>
              <li>
                Mortgage headroom {formatKES(shield.mortgageHeadroom)} →{" "}
                <strong>{formatKES(shield.mortgageTaxSavings)}</strong> PAYE recoverable
              </li>
              <li>
                Insurance relief claimable →{" "}
                <strong>{formatKES(shield.insuranceReliefClaimable)}</strong> (15%, capped)
              </li>
            </ul>
            <p className="mt-2 text-xs text-faint">
              At your marginal PAYE band of {(shield.marginalRate * 100).toFixed(1)}%.
            </p>
          </div>

          {maxed ? (
            <p className="rounded-2xl bg-success-soft p-4 text-sm text-success-deep">
              🛡️ Fully shielded — your statutory reliefs are maximised. Every allowable shilling
              is already working for you, not PAYE.
            </p>
          ) : (
            <p className="rounded-2xl bg-accent-soft p-4 text-sm text-ink-soft">
              💡 <em>The Optimization Shield:</em> By adjusting your payroll allocations to
              maximize your pension and insurance lines, you legally stop{" "}
              <strong className="text-danger">
                {formatKES(shield.totalMonthlyRecoverable)}
              </strong>{" "}
              from going to PAYE every month. This money is instead directed into growing{" "}
              <em>your</em> private wealth infrastructure.
            </p>
          )}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">
              Registered IRPS / HOSP providers to activate the shield
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {p.name} →
                </a>
              ))}
            </div>
            <p className="mt-2 text-xs text-faint">
              Confirm the scheme is RBA-registered and the exact relief treatment with the
              provider and your payroll.
            </p>
          </div>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`🧾 *My KRA Tax Shield*\n\nI'm leaking ${formatKES(shield.totalMonthlyRecoverable)}/month to PAYE that I could legally redirect into my own pension and reliefs.\n\nCheck your leak → jipangefinance.org/tools/tax-shield`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="tax-shield" />
        <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Put your recovered tax saving to work" />
        </>
      )}
    </div>
  );
}
