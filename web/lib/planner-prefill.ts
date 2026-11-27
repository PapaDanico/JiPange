import { readShareParams } from "./share-link";

/**
 * A fee handed to the Education Planner in its link, as Njia's course cards
 * send it: `/planners/education?amount=160200&years=1&from=njia`.
 *
 * Only numbers travel, through the same reader every shared calculator link
 * uses, so a malformed, negative or absurd figure is dropped rather than
 * shown. `from=njia` is compared to one fixed string and never echoed, so the
 * link cannot put words on the page; it only makes the planner say where the
 * fee came from and that it should be checked against the fee letter.
 */
export interface EducationPrefill {
  amount: string;
  years: string;
  fromNjia: boolean;
}

export function educationPrefill(search: string, maxYears = 25): EducationPrefill | null {
  const read = readShareParams(search, ["amount", "years"]);
  if (!read.amount) return null;
  const years = read.years ? Math.min(maxYears, Math.max(1, Math.round(Number(read.years)))) : 1;
  return {
    amount: String(Math.round(Number(read.amount))),
    years: String(years),
    fromNjia: new URLSearchParams(search).get("from") === "njia",
  };
}
