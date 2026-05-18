"use client";

import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { CalendarDisplayEvent } from "@/types/calendar";

type CalendarCache = {
  rangeKey: string | null;
  events: CalendarDisplayEvent[];
  lastFetchedAt: number | null;
  error: string | null;
  googleWarning: string | null;
};

type DashboardContextValue = {
  calendarCache: CalendarCache;
  error: string | null;
  hasLoadedState: boolean;
  isChecking: boolean;
  isLocalMode: boolean;
  isUnlocked: boolean;
  calendarRefreshKey: number;
  refreshCalendar: () => void;
  refreshTasks: () => void;
  setCalendarCache: Dispatch<SetStateAction<CalendarCache>>;
  taskRefreshKey: number;
  lock: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
};

const storageKey = "dashboard-unlocked";
const emptyCalendarCache: CalendarCache = {
  rangeKey: null,
  events: [],
  lastFetchedAt: null,
  error: null,
  googleWarning: null,
};
const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasLoadedState, setHasLoadedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [calendarCache, setCalendarCache] =
    useState<CalendarCache>(emptyCalendarCache);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/auth/status");
        const data = (await response.json()) as {
          localAuthDisabled?: boolean;
          unlocked?: boolean;
        };
        const isSessionUnlocked = response.ok && data.unlocked === true;

        if (isMounted) {
          setIsUnlocked(isSessionUnlocked);
          setIsLocalMode(data.localAuthDisabled === true);
          window.localStorage.setItem(
            storageKey,
            isSessionUnlocked ? "true" : "false",
          );
        }
      } catch {
        if (isMounted) {
          setIsUnlocked(false);
          setIsLocalMode(false);
          window.localStorage.setItem(storageKey, "false");
        }
      } finally {
        if (isMounted) {
          setHasLoadedState(true);
        }
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const unlock = useCallback(async (password: string) => {
    if (!password || isChecking) {
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch("/api/auth/unlock", {
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

  const lock = useCallback(async () => {
    await fetch("/api/auth/lock", { method: "POST" });
    window.localStorage.setItem(storageKey, "false");
    setIsUnlocked(false);
    setCalendarCache(emptyCalendarCache);
  }, []);

  const refreshTasks = useCallback(() => {
    setTaskRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const refreshCalendar = useCallback(() => {
    setCalendarCache((currentCache) => ({
      ...currentCache,
      lastFetchedAt: null,
    }));
    setCalendarRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const value = useMemo(
    () => ({
      calendarCache,
      calendarRefreshKey,
      error,
      hasLoadedState,
      isChecking,
      isLocalMode,
      isUnlocked,
      lock,
      refreshCalendar,
      refreshTasks,
      setCalendarCache,
      taskRefreshKey,
      unlock,
    }),
    [
      calendarCache,
      calendarRefreshKey,
      error,
      hasLoadedState,
      isChecking,
      isLocalMode,
      isUnlocked,
      lock,
      refreshCalendar,
      refreshTasks,
      setCalendarCache,
      taskRefreshKey,
      unlock,
    ],
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
