"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type DashboardContextValue = {
  error: string | null;
  hasLoadedState: boolean;
  isChecking: boolean;
  isUnlocked: boolean;
  unlock: (password: string) => Promise<void>;
};

const storageKey = "dashboard-unlocked";
const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasLoadedState, setHasLoadedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(window.localStorage.getItem(storageKey) === "true");
      setHasLoadedState(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const unlock = useCallback(async (password: string) => {
    if (!password || isChecking) {
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const isValid = (await response.json()) === true;

      if (isValid) {
        window.localStorage.setItem(storageKey, "true");
        setIsUnlocked(true);
        return;
      }

      if (response.status === 503) {
        setError("Passwortschutz ist noch nicht konfiguriert.");
      } else {
        setError("Passwort falsch");
      }
    } catch {
      setError("Passwort falsch");
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  const value = useMemo(
    () => ({
      error,
      hasLoadedState,
      isChecking,
      isUnlocked,
      unlock,
    }),
    [error, hasLoadedState, isChecking, isUnlocked, unlock],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }

  return context;
}
