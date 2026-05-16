"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CalendarModal } from "@/components/calendar/calendar-modal";
import { useDashboard } from "@/components/dashboard/dashboard-context";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function ClockCard() {
  const { isUnlocked } = useDashboard();
  const [now, setNow] = useState(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateLabel = useMemo(() => formatDate(now), [now]);
  const timeLabel = useMemo(() => formatTime(now), [now]);

  return (
    <article className="relative min-h-72 rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <button
        type="button"
        className="absolute right-5 top-5 grid size-11 place-items-center rounded-2xl text-accent-strong transition hover:bg-panel-soft focus:outline-none focus:ring-2 focus:ring-accent-strong/25 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
        aria-label="Kalender öffnen"
        title={isUnlocked ? "Kalender öffnen" : "Erst entsperren"}
        disabled={!isUnlocked}
        onClick={() => setIsCalendarOpen(true)}
      >
        <CalendarDays size={20} aria-hidden="true" />
      </button>

      <div className="flex min-h-60 flex-col justify-center pr-12">
        <p
          className="font-mono text-5xl font-semibold leading-none text-foreground sm:text-6xl"
          suppressHydrationWarning
        >
          {timeLabel}
        </p>
        <p
          className="mt-4 text-sm font-medium capitalize text-muted"
          suppressHydrationWarning
        >
          {dateLabel}
        </p>
      </div>

      {isCalendarOpen && isUnlocked ? (
        <CalendarModal onClose={() => setIsCalendarOpen(false)} />
      ) : null}
    </article>
  );
}
