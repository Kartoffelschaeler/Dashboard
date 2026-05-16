"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

type CalendarStatus = {
  connected: boolean;
  calendars: Array<{
    id: string;
    summary: string;
    primary: boolean;
  }>;
  agentCalendarName: string | null;
  agentCalendar: {
    id: string;
    summary: string;
  } | null;
};

export function GoogleCalendarCard() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/calendar/status");

        if (!response.ok) {
          throw new Error("Status nicht verfügbar.");
        }

        const data = (await response.json()) as CalendarStatus;

        if (isMounted) {
          setStatus(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Google Kalender konnte nicht geladen werden.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <article className="rounded-[1.75rem] bg-panel/76 p-4 shadow-[0_16px_40px_rgba(97,66,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Google Kalender
            </p>
          </div>
          <p className="mt-1 text-xs text-muted">
            {isLoading
              ? "lädt"
              : status?.connected
                ? "verbunden"
                : "nicht verbunden"}
          </p>
        </div>

        {!status?.connected && !isLoading ? (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/google/start";
            }}
            className="shrink-0 rounded-2xl bg-accent px-3 py-2 text-xs font-medium text-white shadow-[0_10px_20px_rgba(156,99,62,0.14)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/30"
          >
            Verbinden
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl bg-panel-soft/65 px-3 py-2 text-xs leading-5 text-accent-strong">
          {error}
        </p>
      ) : null}

      {status?.connected ? (
        <div className="mt-3 space-y-1.5">
          {status.calendars.slice(0, 3).map((calendar) => (
            <p
              key={calendar.id}
              className="truncate rounded-xl bg-white/26 px-3 py-2 text-xs text-muted"
            >
              {calendar.summary}
            </p>
          ))}
          {status.agentCalendarName ? (
            <p className="pt-1 text-xs text-muted/80">
              Agent: {status.agentCalendar?.summary ?? status.agentCalendarName}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
