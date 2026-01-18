import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'alili_onboarding_complete',
  SHOW_TIPS: 'alili_show_tips',
  SESSIONS_COMPLETED: 'alili_sessions_completed',
} as const;

export interface OnboardingState {
  isFirstTime: boolean;
  showTips: boolean;
  sessionsCompleted: number;
}

export interface UseOnboardingReturn {
  state: OnboardingState;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  toggleTips: () => void;
  incrementSessions: () => void;
}

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
};

const getStoredNumber = (key: string, defaultValue: number): number => {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const useOnboarding = (): UseOnboardingReturn => {
  const [state, setState] = useState<OnboardingState>(() => ({
    isFirstTime: !getStoredBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE, false),
    showTips: getStoredBoolean(STORAGE_KEYS.SHOW_TIPS, true),
    sessionsCompleted: getStoredNumber(STORAGE_KEYS.SESSIONS_COMPLETED, 0),
  }));

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      String(!state.isFirstTime)
    );
    localStorage.setItem(STORAGE_KEYS.SHOW_TIPS, String(state.showTips));
    localStorage.setItem(
      STORAGE_KEYS.SESSIONS_COMPLETED,
      String(state.sessionsCompleted)
    );
  }, [state]);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, isFirstTime: false }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isFirstTime: true,
      sessionsCompleted: 0,
    }));
  }, []);

  const toggleTips = useCallback(() => {
    setState((prev) => ({ ...prev, showTips: !prev.showTips }));
  }, []);

  const incrementSessions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1,
    }));
  }, []);

  return {
    state,
    completeOnboarding,
    resetOnboarding,
    toggleTips,
    incrementSessions,
  };
};
