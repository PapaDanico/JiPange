import type { ActionPlan, Calculations, Profile } from "./types";

const PROFILE_KEY = "jipange:profile";
const CALCULATIONS_KEY = "jipange:calculations";
const PLAN_KEY = "jipange:plan";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string): T | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const getStoredProfile = () => read<Profile>(PROFILE_KEY);
export const setStoredProfile = (profile: Profile) => write(PROFILE_KEY, profile);

export const getStoredCalculations = () => read<Calculations>(CALCULATIONS_KEY);
export const setStoredCalculations = (calculations: Calculations) =>
  write(CALCULATIONS_KEY, calculations);

export const getStoredPlan = () => read<ActionPlan>(PLAN_KEY);
export const setStoredPlan = (plan: ActionPlan) => write(PLAN_KEY, plan);

export function clearStoredJourney(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(CALCULATIONS_KEY);
  window.localStorage.removeItem(PLAN_KEY);
}
