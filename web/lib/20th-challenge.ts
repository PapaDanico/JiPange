/**
 * 20th-to-20th savings challenge: commit to saving a fixed amount every month,
 * check in between the 15th and 25th, and build a streak.
 */

export interface CheckIn {
  month: string; // YYYY-MM
  date: string; // ISO date string of the check-in
  amount: number; // amount saved this cycle
}

export const CHALLENGE_KEY = "jipange:20th-challenge";
export const CHECKINS_KEY = "jipange:20th-challenge:checkins";

/** Check-in window: 15th–25th of each month */
export const WINDOW_START_DAY = 15;
export const WINDOW_END_DAY = 25;

export type WindowStatus = "waiting" | "open" | "done" | "closed";

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function getWindowStatus(date: Date, checkIns: CheckIn[]): WindowStatus {
  const day = date.getDate();
  const month = getMonthKey(date);
  if (checkIns.some((c) => c.month === month)) return "done";
  if (day < WINDOW_START_DAY) return "waiting";
  if (day <= WINDOW_END_DAY) return "open";
  return "closed";
}

export function daysUntilWindow(date: Date): number {
  const day = date.getDate();
  if (day < WINDOW_START_DAY) return WINDOW_START_DAY - day;
  return 0;
}

export function calculateCurrentStreak(checkIns: CheckIn[], today: Date): number {
  if (checkIns.length === 0) return 0;

  const months = new Set(checkIns.map((c) => c.month));
  const sorted = [...months].sort((a, b) => b.localeCompare(a));
  const mostRecent = sorted[0];
  const todayMonth = getMonthKey(today);
  const todayDay = today.getDate();

  // Streak is dead if:
  // (a) the next expected month has been fully passed without a check-in
  const expectedNext = nextMonthKey(mostRecent);
  if (expectedNext < todayMonth) return 0;
  // (b) we're in expectedNext, the window closed, and no check-in yet
  if (
    expectedNext === todayMonth &&
    todayDay > WINDOW_END_DAY &&
    !months.has(todayMonth)
  )
    return 0;

  // Count consecutive months backwards from mostRecent
  let streak = 0;
  let cursor = mostRecent;
  while (months.has(cursor)) {
    streak++;
    cursor = prevMonthKey(cursor);
  }
  return streak;
}

export function calculateBestStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const months = [...new Set(checkIns.map((c) => c.month))].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < months.length; i++) {
    if (months[i] === nextMonthKey(months[i - 1])) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export function totalSaved(checkIns: CheckIn[]): number {
  return checkIns.reduce((s, c) => s + c.amount, 0);
}

export interface Milestone {
  months: number;
  label: string;
  emoji: string;
}

export const MILESTONES: Milestone[] = [
  { months: 1, label: "First step", emoji: "🌱" },
  { months: 3, label: "Discipline starter", emoji: "💪" },
  { months: 6, label: "Habit formed", emoji: "⭐" },
  { months: 12, label: "Master saver", emoji: "🏆" },
];
