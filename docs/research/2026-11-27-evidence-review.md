# Evidence review: what the research says, and what to build from it

27 November 2026. Desk research (search-based; primary PDFs at CBK, KNBS, SASRA, RBA and CMA cannot be fetched from a session). Every figure is tagged with how far it can be trusted and whether it may appear in-product under the sourcing rules (`web/lib/sources.ts`; Mwangaza's `licences.ts`).

**Tiers.** **P** = primary document of a registered publisher, safe for product with a date. **P?** = primary publisher, read via press or search summary only; confirm against the document before shipping. **S** = secondary (press, industry, commercial), context only, never a product figure. **A** = peer-reviewed or working-paper academic evidence, cite as research, not as a current Kenyan statistic.

---

## 1. Bottom line

1. **Kenya's problem is no longer access, it is financial health.** Formal inclusion is 84.8% (2024), but only 18.3% of adults are financially healthy, against 39% in 2016. Saving fell from 74% (2021) to 68.1% (2024) and complete loan default rose from 10.7% to about 16.7%. A tool that helps someone *open* an account is solving yesterday's problem; one that helps them survive a shock, stop rolling debt, and build a buffer is solving today's.
2. **Small, fast, digital credit is where the damage concentrates.** CBK's March 2026 consumer-protection draft reports default above 80% on digital loans under Ksh 1,000 and about 69% for Ksh 1,000 to 5,000. Research shows the same mechanism elsewhere: borrowers do not know the terms and pay late fees (Malawi, *Economic Journal* 2024). Yet the same loans measurably help households absorb shocks when used as intended (Kenya, M-Shwari, *JDE* 2021). The honest product is neither "avoid all digital credit" nor "compare APRs", it is **"what will this cost you over the time you will really need it, and what is the cheaper bridge?"**
3. **A safe place to save beats a locked one.** In western Kenya, a simple safe box raised health savings by 66%; a locked box with no key had no effect (*AER* 2013). Soft earmarking (labelled pots, visible goals) works for most people; hard locks help only a present-biased minority. This favours JiPange's planners and goal pots over "lock your money" features.
4. **Teach, but do not over-claim.** The best meta-analysis of 76 randomised financial-education trials finds behaviour moves about 0.06 to 0.10 standard deviations (*JFE* 2022): real, small. JiPange's value has to come from decision tools at the moment of choice, not from content volume, and its own metrics should measure behaviour (the `act:` counters), not page views.
5. **Kenyan savers are leaving plain MMFs, and retail is now a major T-bill holder.** MMFs fell from about 90% of collective-investment assets (2020) to about 49% (June 2026) as "special" and fixed-income funds grew; individuals reportedly hold the majority of T-bills on DhowCSD. That shifts risk onto households who may not see that a special fund is not a money market fund. This is Mwangaza's core territory and a JiPange comparison gap.

---

## 2. The evidence, by theme

### 2.1 Financial health and household stress

| Figure | Value | Date | Source | Tier |
|---|---|---|---|---|
| Formal inclusion | 84.8% (83.7% in 2021) | 2024 | FinAccess 2024 (CBK/KNBS/FSD) | P (held: `finaccessFormalInclusionPct`) |
| Fully excluded | 9.9% (11.6% in 2021) | 2024 | FinAccess 2024 | P? |
| Financially healthy adults | 18.3% (17.1% 2021; 39% 2016) | 2024 | FinAccess 2024, FSD Kenya | P? |
| Adults saving | 68.1% (74% in 2021) | 2024 | FinAccess 2024 | P? |
| Borrowers fully defaulting | ~16.7% (10.7% in 2021) | 2024 | FinAccess 2024 (infographic gives 16.6%) | P? |
| Daily mobile-money users | 52.6% (23.6% in 2021) | 2024 | FinAccess 2024 | P? |
| Informal-group users | 8.7m (7.8m in 2021) | 2024 | FinAccess 2024 | P? |
| Chamas as a source of advice | 0.1% | 2024 | FinAccess via press | S |
| Borrowing for everyday expenses | ~40% | 2025 | Old Mutual Financial Wellness Monitor | S |
| Same or higher debt than a year ago | 54% | 2025 | Old Mutual | S |

**Reading.** Inclusion rose 1.1 points in three years while health fell by half over eight. The binding constraint is resilience: the ability to absorb a shock and plan ahead. The savings drop and default jump in the same survey are the signature of households using credit to smooth consumption. Informal groups are growing in users but collapsing as a source of advice, which leaves a guidance vacuum JiPange can fill without competing with the chama itself.

### 2.2 Digital credit

| Figure | Value | Date | Source | Tier |
|---|---|---|---|---|
| Default, digital loans < Ksh 1,000 | > 80% | 2026 | CBK Consumer Protection Framework draft (March 2026), via TechCabal | P? |
| Default, Ksh 1,000 to 5,000 | ~69% | 2026 | same | P? |
| Digital lender default overall | up to ~40% (banks ~16%) | 2025-26 | press | S |
| Digital lending book | Ksh 154bn (doubling from Ksh 110bn) | 2026 | Business Daily / Citizen, citing CBK | P? |
| Complaints against digital lenders | up about 5x | 2025 | Business Daily | S |
| Fuliza users / volume | 17.7m / Ksh 1.46tn | FY2026 | Safaricom | P (held) |
| Hustler Fund default | 15% (state, March 2026) vs 68% (KHRC, Dec 2022) | 2022-26 | The Star; KHRC | S, contested |
| New rules | Non-Deposit-Taking Credit Provider Regulations replace the 2022 digital rules; affordability checks proposed | 2025-26 | CBK RIA; law-firm alerts | P? |

**Academic evidence (A).**
- **Bharadwaj, Jack and Suri (JDE 2021), M-Shwari, Kenya.** A regression discontinuity on the credit-score cutoff. Eligible households were **6.3 percentage points less likely to forgo expenses after a shock**; 34% of eligible households borrowed; the loans did not displace other credit. Digital credit can be a genuine insurance substitute.
- **Brailovskaya, Dupas and Robinson (Economic Journal 2024), Malawi.** A digital loan at 10% for 15 days drew substantial demand, but **most borrowers did not know the terms, repaid late and paid large late fees**. A cheap literacy message about fees was tested at scale (n = 26,467).
- **CEGA/Berkeley Mobile Instant Credit synthesis.** Overlapping and cross-provider borrowing is associated with higher default.

**Reading.** The two Kenya-adjacent studies are not in conflict. The product helps when it bridges a one-off shock and hurts when it becomes a rolling habit with fees the borrower does not see. Default concentrated in the smallest tickets is consistent with consumption smoothing by the most fragile borrowers. A universal APR comparison misleads here: a 15-day loan's annualised rate is enormous even when the shilling cost is small (the UK FCA and World Bank make the same point). This is the same finding as JiPange audit items JP-01 and JP-06.

### 2.3 Saving behaviour: what actually works

- **Dupas and Robinson (AER 2013), western Kenya, 113 ROSCAs, 771 people.** Safe box: **+66% health savings**. Lock box (no key): **no effect**. Health pot with social commitment: **+128%** on preventive health spending. Health savings account: lower vulnerability to emergencies. Three years later, 39% still used their box. The authors' conclusion: the main barrier is **the lack of a safe place to save**; a present-biased minority needs stronger commitment.
- **Suri and Jack (Science 2016).** Mobile money lifted about **194,000 households (2%) out of extreme poverty**, with larger effects for female-headed households, and moved about 185,000 women from farming into business. Payment rails matter for resilience as much as credit does.
- **Kaiser, Lusardi, Menkhoff and Urban (JFE 2022), 76 RCTs, over 160,000 people.** Financial education raises knowledge by about 0.2 SD and behaviour by about 0.1 SD; after correcting for publication bias, about 0.15 and 0.06.

**Reading.** For product design this argues for four things. Make the safe place visible and frictionless: named goal pots, which JiPange's planners already approximate. Offer soft commitment by default and hard commitment only on request. Use the group and its social pressure as a feature, not a rival. Expect information alone to move behaviour a little, so deliver it inside the decision.

### 2.4 Where the money goes: SACCOs, MMFs, T-bills, pensions

| Figure | Value | Date | Source | Tier |
|---|---|---|---|---|
| SACCO deposits | Ksh 832.74bn (+11.12%) | 2025 | SASRA Supervision Report 2025 | P? |
| SACCO gross loans | Ksh 948.67bn | 2025 | SASRA | P? |
| SACCO deposit accounts | 18.95m; ~92% hold ≤ Ksh 100,000 | 2025 | SASRA via press | P? |
| SACCO deductions not remitted | Ksh 3.92bn, ~104,000 members affected | 2025 | SASRA via press | P? |
| SACCO lending by purpose | land/housing Ksh 157.2bn, education 125.5bn, agriculture 108.8bn | 2025 | SASRA via press | P? |
| CIS assets | Ksh 851.7bn (Mar 2026); ~948.7bn (Jun 2026) | 2026 | CMA via press | P? (held: MMF 442.2bn, Mar 2026) |
| MMF share of CIS | ~90% (2020) to ~49% (Jun 2026) | 2026 | CMA | P? |
| Special funds | Ksh 203.6bn, 23.9% of CIS | Mar 2026 | CMA via press | P? |
| Individuals' share of T-bills | 56.2% vs banks 33.8%; 79.4% of DhowCSD accounts | undated | LinkedIn post | S, verify |
| Pension coverage | ~26% of the labour force; 7.5m members | 2024-25 | RBA / FinAccess pension sub-report | P (held: 26.5%) |
| Informal-sector pension coverage | < 2% | 2025 | RBA via press | P? |
| Pension assets | Ksh 3.16tn | Jun 2026 | RBA via press | P? |

**Reading.** Three things stand out. SACCOs are the mass-market lender for land, housing and school fees, and remittance failures are a live, measurable harm. MMF money is migrating into special funds whose risk is not that of a money market fund, which is exactly the label confusion JiPange's comparison tools exist to prevent. Retirement saving is essentially absent for the 18 million informal workers, the majority of JiPange's audience.

### 2.5 Macro context (already on Mwangaza, primary)

USD/KES 130.06 (26 Nov). Reserves USD 13,949m, or 5.6 months of import cover (19 Nov), down USD 656m in a week. CBR 8.75%; CPI 7.3% (core 4.3, non-core 15.1). After tax the 91-day bill (7.65%) now pays slightly more than the 364-day (7.64%). Real after-tax T-bill returns are about +0.35pp against headline CPI.

---

## 3. What to build, ranked by impact against effort

| # | Proposal | Platform | Evidence it rests on | Effort | Notes |
|---|---|---|---|---|---|
| 1 | **"What will this loan really cost?"**: shilling cost over the time you will need it, plus the cheaper bridge (SACCO, chama, emergency pot), replacing cross-product APR tiers | JiPange | 2.2 (CBK default by ticket size; Malawi terms-unawareness; M-Shwari resilience benefit); audit JP-01 and JP-06 | M | Needs owner approval (methodology change). Reference cases first. |
| 2 | **Emergency buffer planner as the front door**: months of essential costs covered, a target, and a weekly amount, framed as a named safe pot, not a lock | JiPange | 2.1 (health 18.3%, saving down); 2.3 (safe box +66%, lock box 0) | S | Reuses the household-resilience engine; mostly framing and ordering. |
| 3 | **"Is my SACCO remitting my deductions?"** checklist: payslip vs statement, what to do, where to complain | JiPange | 2.4 (Ksh 3.92bn, ~104,000 members) | S | Pure guidance, no data feed. Confirm SASRA figure before publishing it. |
| 4 | **Special fund vs MMF vs T-bill, side by side**: what can go down, how fast you can get out, and after-tax yield from Mwangaza's feed | Both | 2.4 (MMF share 90 to 49%; special funds 23.9%) | M | Mwangaza supplies dated bill yields; fund yields must be the reader's own input, never scraped. |
| 5 | **Informal-worker retirement plan** with irregular contributions ("put in what you can, when you can") | JiPange | 2.4 (coverage < 2% informal); RBA's flexible-contribution push | M | Planner exists; add irregular-income mode. No provider endorsement. |
| 6 | **Rolling-debt warning in the loan tools**: if repayments are funded by new loans, say so and show the 3-month cost | JiPange | 2.2 (overlapping loans and default; small-ticket default) | S | Triggered by the reader's own inputs only; nothing stored on a server. |
| 7 | **Measure behaviour, not reach.** Report `act:` counters per tool monthly and judge features by them | Both | 2.3 (education moves behaviour ~0.06-0.10 SD) | XS | The Mwangaza gate was fixed on 21 Nov; mirror the design in JiPange. |
| 8 | **Update held figures**: MMF AUM to June 2026, RBA coverage, SASRA 2025 | JiPange | 2.4 | XS | Only after reading the primary documents (tier P? to P). |

**Deliberately not proposed.** A betting-cost calculator: the evidence is thin and inconsistent (1.9% to 84% depending on survey) and the framing risks moralising. A Hustler Fund comparison: the default figures are contested (15% vs 68%) and politically charged. Any feature that ranks named lenders or funds: that implies endorsement, and under LN 197's "holdout" wording it is the closest thing to advice.

---

## 4. Rules for using this material

- Only tier-P figures go into `sources.ts` or the UI, each with its publisher, date and the document checked. P? figures need the primary PDF first, which the owner can open or `cbk-gaps` can fetch if the host is CBK.
- Academic results are described as research findings with their setting ("in a study in western Kenya…"), never as current national statistics.
- FinAccess is co-published by CBK, KNBS and FSD Kenya. Cite it as a CBK publication (CBK is a registered, permitted source); KNBS on its own is `refused` in Mwangaza's registry.
- Press and industry figures (Old Mutual, Tala, LinkedIn, loan blogs) stay out of the product.

## 5. Gaps and next reads

FinAccess 2024 main report tables (reasons for borrowing, chama membership share, digital-credit use) · CBK Consumer Protection Framework March 2026, Disclosure section (APR or total-cost rule) · SASRA Supervision Report 2025 · CMA Capital Markets Soundness Report Q4 FY2025/26 · RBA 2025 sub-sector report (informal coverage) · CBK data on the retail share of T-bill holdings.

## Sources

- [2024 FinAccess Household Survey (CBK)](https://www.centralbank.go.ke/2024/12/13/10960/) · [main report PDF](https://www.centralbank.go.ke/wp-content/uploads/2024/12/2024-FINACCESS-HOUSEHOLD-SURVEY-MAIN-REPORT.pdf) · [FSD Kenya key insights](https://www.fsdkenya.org/blogs-publications/2024-finaccess-household-survey-key-insights-into-kenyas-financial-landscape/) · [FSD Kenya: reaching its limits?](https://www.fsdkenya.org/blogs-publications/the-2024-finaccess-household-survey-is-kenyas-financial-sector-reaching-its-limits/) · [infographic](https://www.fsdkenya.org/wp-content/uploads/2024/12/2024-FinAccess-household-survey-infographic.pdf)
- [CBK Consumer Protection Framework, March 2026](https://www.centralbank.go.ke/wp-content/uploads/2026/04/Consumer-Protection-Framework-March-2026.pdf) · [TechCabal on affordability rules](https://techcabal.com/2026/04/21/kenya-wants-lenders-to-prove-borrowers-can-repay-before-approving-loans/) · [CBK NDTCP Regulations RIA](https://www.centralbank.go.ke/wp-content/uploads/2026/06/Regulatory-Impact-Assessment-Central-Bank-of-Kenya-Non-Deposit-Taking-Credit-Providers-Regulations-2025.pdf) · [Digital loans hit Sh154bn](https://www.businessdailyafrica.com/bd/economy/digital-loans-hit-sh154-billion-amid-borrowing-frenzy-5661740) · [CEGA Mobile Instant Credit](https://cega.berkeley.edu/wp-content/uploads/2023/09/FSP_Digital_Credit_Research_test.pdf)
- [Bharadwaj, Jack and Suri, NBER w25604](https://www.nber.org/papers/w25604) · [Brailovskaya, Dupas and Robinson, Economic Journal 2024](https://ideas.repec.org/a/oup/econjl/v134y2024i658p457-484..html) · [Dupas and Robinson, J-PAL summary](https://www.povertyactionlab.org/evaluation/constraints-saving-health-expenditures-kenya) · [Suri and Jack, MIT News](https://news.mit.edu/2016/mobile-money-kenyans-out-poverty-1208) · [Kaiser et al., VoxEU](https://cepr.org/voxeu/columns/financial-education-effective-and-efficient)
- [SASRA figures, Capital FM](https://capitalfm.africa/saccos-deposits-rise-11-12pc-to-sh832-74bn-as-assets-hit-sh1-21tn/) · [unremitted deductions](https://kenyans.co.ke/news/127404-104331-sacco-members-affected-ksh392-billion-unremitted-deductions-report) · [lending mix, The Star](https://www.the-star.co.ke/business/2025-12-12-land-housing-fees-agriculture-loans-dominate-sacco-lending)
- [CMA CIS assets, Dealroom](https://dealroom.co/news/144830-kenyas-cma-clears-eight-new-funds-as-industry-assets-hit-ksh-851-7b/) · [MMFs lose dominance](https://standardmedia.co.ke/business/amp/enterprise/article/2001532355/mmfs-lose-dominance-as-more-investors-seek-higher-returns) · [CMA soundness report Q4 FY2025/26](https://www.cma.or.ke/download/9/cm-soundness-report/6399/capital-markets-soundness-report-cmsr-quarter-4-fy-2025-2026-2.pdf)
- [RBA key findings](https://www.rba.go.ke/securing-tomorrow-key-findings-on-the-state-of-kenyas-retirement-benefits-sector/) · [FinAccess pension sub-sector report](https://www.fsdkenya.org/wp-content/uploads/2026/01/Pension-Sub-Sector-Report-Lessons-from-FinAccess-Surveys.pdf) · [informal workers and pensions](https://standardmedia.co.ke/business/amp/opinion/article/2001548953/kenyas-181-million-informal-workers-hold-the-future-of-pensions)
- [Hustler Fund default 15%](https://www.the-star.co.ke/business/2026-03-06-hustler-fund-default-rate-drops-to-15-on-recovery-drive) · [KHRC report](https://khrc.or.ke/wp-content/uploads/2025/08/FAILING-THE-HUSTLERS-3-5.pdf) · [Old Mutual monitor via AllAfrica](https://allafrica.com/stories/202603250163.html)
