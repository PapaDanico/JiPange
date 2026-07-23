import type { ActionPlan, Calculations, Profile } from "./types";
import type { JourneyAnswers } from "./journey";

const PROFILE_KEY = "jipange:profile";
const CALCULATIONS_KEY = "jipange:calculations";
const PLAN_KEY = "jipange:plan";
const PROFILE_DRAFT_KEY = "jipange:profile-draft";
const GOALS_KEY = "jipange:goals";
const JOURNEY_KEY = "jipange:journey";
const WHATSAPP_NUMBER_KEY = "jipange:whatsapp-number";

/** Raw, not-yet-validated field values from an in-progress /profile form. */
export interface ProfileDraft {
  /** Wizard step (1-based) the user was on, so a refresh resumes in place. */
  currentStep?: number;
  fullName: string;
  whatsappNumber: string;
  age: string;
  county: string;
  grossMonthlySalary: string;
  dependants: string;
  chamaMember: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ── Change notification ──
//
// Components read this module's data via useSyncExternalStore (see
// lib/hooks.ts's useStorageValue/useStickyState). The native `storage` event
// only fires in *other* tabs, never the tab that made the change, so writes
// here also dispatch a same-tab custom event — that's how a write in one
// component is reflected immediately in another subscribed to the same data.

const STORAGE_CHANGE_EVENT = "jipange:storage-change";

function notifyChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
}

/**
 * Subscribes to both same-tab writes (via this module's helpers) and
 * cross-tab writes (the native `storage` event). Pass directly as
 * useSyncExternalStore's `subscribe` argument.
 */
export function subscribeToStorage(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
  };
}

// ── Cached read/write ──
//
// useSyncExternalStore requires getSnapshot() to return a referentially
// stable value when nothing has changed (required for object/array values —
// primitives compare by value regardless). Caching the parsed result against
// the raw stored string means repeated reads between writes return the same
// reference instead of a fresh JSON.parse() each time.

interface CacheEntry {
  raw: string | null;
  parsed: unknown;
}

const readCache = new Map<string, CacheEntry>();

/** Generic cached, JSON-parsed localStorage read. Exported for callers with
 *  their own dynamic keys (e.g. useStickyState's per-field tool inputs). */
export function readAny<T>(key: string): T | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  const cached = readCache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T | null;
  let parsed: T | null = null;
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = null;
    }
  }
  readCache.set(key, { raw, parsed });
  return parsed;
}

/** Generic cached localStorage write — updates the read cache immediately
 *  (avoiding an unnecessary re-parse) and notifies subscribers. */
export function writeAny<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  const raw = JSON.stringify(value);
  window.localStorage.setItem(key, raw);
  readCache.set(key, { raw, parsed: value });
  notifyChange();
}

/** Removes a key, invalidates its cache entry, and notifies subscribers. */
export function removeAny(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
  readCache.delete(key);
  notifyChange();
}

const read = readAny;
const write = writeAny;

export const getStoredProfile = () => read<Profile>(PROFILE_KEY);
export const setStoredProfile = (profile: Profile) => write(PROFILE_KEY, profile);

export const getStoredCalculations = () => read<Calculations>(CALCULATIONS_KEY);
export const setStoredCalculations = (calculations: Calculations) =>
  write(CALCULATIONS_KEY, calculations);

export const getStoredPlan = () => read<ActionPlan>(PLAN_KEY);
export const setStoredPlan = (plan: ActionPlan) => write(PLAN_KEY, plan);

export const getProfileDraft = () => read<ProfileDraft>(PROFILE_DRAFT_KEY);
export const setProfileDraft = (draft: ProfileDraft) => write(PROFILE_DRAFT_KEY, draft);
export function clearProfileDraft(): void {
  removeAny(PROFILE_DRAFT_KEY);
}

export const getStoredWhatsAppNumber = () => read<string>(WHATSAPP_NUMBER_KEY);
export const setStoredWhatsAppNumber = (number: string) => write(WHATSAPP_NUMBER_KEY, number);

/** A goal the user committed to from a planner — one per goal type. */
export interface SavedGoal {
  goalType: string;
  title: string;
  emoji: string;
  /** The amount the user entered (today's prices for inflating goals). */
  amountToday: number;
  /** The inflation-adjusted target actually planned against. */
  nominalTarget: number;
  years: number;
  requiredMonthly: number;
  savedAt: string;
}

const EMPTY_GOALS: SavedGoal[] = [];
export const getStoredGoals = () => read<SavedGoal[]>(GOALS_KEY) ?? EMPTY_GOALS;

/** Saves a goal, replacing any existing goal of the same type. */
export function saveStoredGoal(goal: SavedGoal): void {
  const others = getStoredGoals().filter((g) => g.goalType !== goal.goalType);
  write(GOALS_KEY, [...others, goal]);
}

export function removeStoredGoal(goalType: string): void {
  const remaining = getStoredGoals().filter((g) => g.goalType !== goalType);
  write(GOALS_KEY, remaining);
}

/** Answers from the 5-question journey funnel. */
export const getStoredJourneyAnswers = () => read<JourneyAnswers>(JOURNEY_KEY);
export const setStoredJourneyAnswers = (answers: JourneyAnswers) => write(JOURNEY_KEY, answers);

/** Partial progress through the journey funnel — cleared on completion. */
const JOURNEY_DRAFT_KEY = "jipange:journey-draft";

export interface JourneyDraft {
  step: number;
  answers: Partial<Record<string, unknown>>;
}

export const getJourneyDraft = () => read<JourneyDraft>(JOURNEY_DRAFT_KEY);
export const setJourneyDraft = (draft: JourneyDraft) => write(JOURNEY_DRAFT_KEY, draft);
export function clearJourneyDraft(): void {
  removeAny(JOURNEY_DRAFT_KEY);
}

export function clearStoredJourney(): void {
  removeAny(PROFILE_KEY);
  removeAny(CALCULATIONS_KEY);
  removeAny(PLAN_KEY);
  removeAny(PROFILE_DRAFT_KEY);
  removeAny(WHATSAPP_NUMBER_KEY);
}
