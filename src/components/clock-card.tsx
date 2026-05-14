"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateLabel = useMemo(() => formatDate(now), [now]);
  const timeLabel = useMemo(() => formatTime(now), [now]);

  return (
    <article className="rounded-[2rem] border border-white/60 bg-panel/82 p-5 shadow-[0_18px_60px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Heute</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Zeit & Datum
          </h2>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-panel-soft text-accent-strong">
          <Clock3 size={22} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-9">
        <p
          className="font-mono text-5xl font-semibold leading-none text-foreground sm:text-6xl"
          suppressHydrationWarning
        >
          {timeLabel}
        </p>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line/80 bg-white/36 px-4 py-3 text-muted">
          <CalendarDays size={18} aria-hidden="true" />
          <p className="text-sm font-medium capitalize" suppressHydrationWarning>
            {dateLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
