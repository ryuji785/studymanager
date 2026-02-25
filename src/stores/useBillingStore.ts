import { create } from 'zustand';

// --- Types ---
export type PlanType = 'free' | 'pro';

export type FeatureKey =
  | 'unlimited_books'
  | 'multiple_goals'
  | 'full_history'
  | 'auto_plan_generation'
  | 'detailed_reports'
  | 'data_export'
  | 'ad_free';

interface BillingState {
  plan: PlanType;
  trialEndsAt: string | null;

  // Computed helpers
  isTrialActive: () => boolean;
  getTrialDaysRemaining: () => number;
  canUseFeature: (feature: FeatureKey) => boolean;
  getBookLimit: () => number;
  getGoalLimit: () => number;
  getHistoryDaysLimit: () => number;

  // Actions
  setPlan: (plan: PlanType) => void;
  initTrial: () => void;
}

const TRIAL_STORAGE_KEY = 'sm_trial_ends_at';

function loadTrialEndsAt(): string | null {
  try {
    return localStorage.getItem(TRIAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveTrialEndsAt(date: string) {
  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, date);
  } catch {
    // ignore
  }
}

// --- Free plan feature limits ---
const FREE_BOOK_LIMIT = 3;
const FREE_GOAL_LIMIT = 1;
const FREE_HISTORY_DAYS = 7;

export const useBillingStore = create<BillingState>((set, get) => ({
  // Phase 1: always free (Stripe not yet connected)
  plan: 'free' as PlanType,
  trialEndsAt: loadTrialEndsAt(),

  isTrialActive: () => {
    const { trialEndsAt } = get();
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt).getTime() > Date.now();
  },

  getTrialDaysRemaining: () => {
    const { trialEndsAt } = get();
    if (!trialEndsAt) return 0;
    const remaining = Math.ceil(
      (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, remaining);
  },

  canUseFeature: (feature: FeatureKey) => {
    const { plan, isTrialActive } = get();
    // Pro plan or active trial → all features unlocked
    if (plan === 'pro' || isTrialActive()) return true;
    // Free plan: only limited features available
    return false;
  },

  getBookLimit: () => {
    const { plan, isTrialActive } = get();
    if (plan === 'pro' || isTrialActive()) return Infinity;
    return FREE_BOOK_LIMIT;
  },

  getGoalLimit: () => {
    const { plan, isTrialActive } = get();
    if (plan === 'pro' || isTrialActive()) return Infinity;
    return FREE_GOAL_LIMIT;
  },

  getHistoryDaysLimit: () => {
    const { plan, isTrialActive } = get();
    if (plan === 'pro' || isTrialActive()) return Infinity;
    return FREE_HISTORY_DAYS;
  },

  setPlan: (plan) => set({ plan }),

  initTrial: () => {
    const existing = loadTrialEndsAt();
    if (existing) return; // Don't overwrite existing trial
    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    saveTrialEndsAt(endsAt);
    set({ trialEndsAt: endsAt });
  },
}));
