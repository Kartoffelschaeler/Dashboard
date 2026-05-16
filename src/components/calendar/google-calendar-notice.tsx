"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import type { GoogleCalendarWarning } from "@/types/google-calendar";

type CalendarStatus = {
  connected: boolean;
  agentCalendarName: string | null;
  agentCalendar: {
    id: string;
    summary: string;
  } | null;
  warnings?: GoogleCalendarWarning[];
};

export function GoogleCalendarNotice() {
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
          throw new Error("Google Kalender braucht Aufmerksamkeit.");
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
              : "Google Kalender braucht Aufmerksamkeit.",
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

  if (isLoading) {
    return null;
  }

  const warning = error ?? status?.warnings?.[0]?.message ?? null;

  if (status?.connected && !warning) {
    return null;
  }

  return (
    <article className="rounded-[1.75rem] bg-panel/72 p-4 shadow-[0_16px_40px_rgba(97,66,42,0.07)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Google Kalender
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            {warning ?? "Noch nicht verbunden."}
          </p>
        </div>

        {!status?.connected ? (
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
    </article>
  );
}
