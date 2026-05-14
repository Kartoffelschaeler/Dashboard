"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
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

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, monthIndex, 0).getDate();
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    days.push({
      date: new Date(year, monthIndex - 1, daysInPreviousMonth - index),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, monthIndex, day),
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      date: new Date(
        year,
        monthIndex + 1,
        days.length - firstWeekday - daysInMonth + 1,
      ),
      isCurrentMonth: false,
    });
  }

  return days;
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

type CalendarModalProps = {
  calendarDays: Array<{ date: Date; isCurrentMonth: boolean }>;
  now: Date;
  onClose: () => void;
  setVisibleMonth: React.Dispatch<React.SetStateAction<Date>>;
  visibleMonth: Date;
};

function CalendarModal({
  calendarDays,
  now,
  onClose,
  setVisibleMonth,
  visibleMonth,
}: CalendarModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-foreground/18 px-4 py-6 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[2rem] bg-panel p-5 shadow-[0_24px_80px_rgba(70,55,45,0.20)] transition sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong"
            aria-label="Vorheriger Monat"
            title="Vorheriger Monat"
            onClick={() =>
              setVisibleMonth(
                (month) =>
                  new Date(month.getFullYear(), month.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <p className="text-base font-semibold capitalize text-foreground">
            {getMonthLabel(visibleMonth)}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong"
              aria-label="Naechster Monat"
              title="Naechster Monat"
              onClick={() =>
                setVisibleMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong"
              aria-label="Kalender schliessen"
              title="Kalender schliessen"
              onClick={onClose}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isToday = isSameDay(day.date, now);

            return (
              <div
                key={day.date.toISOString()}
                className={`grid aspect-square place-items-center rounded-2xl text-sm transition ${
                  isToday
                    ? "bg-accent text-white shadow-[0_10px_24px_rgba(156,99,62,0.18)]"
                    : day.isCurrentMonth
                      ? "text-foreground hover:bg-panel-soft"
                      : "text-muted/35"
                }`}
              >
                {day.date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ClockCard() {
  const [now, setNow] = useState(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isCalendarOpen]);

  const dateLabel = useMemo(() => formatDate(now), [now]);
  const timeLabel = useMemo(() => formatTime(now), [now]);
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth],
  );

  return (
    <article className="relative min-h-72 rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <button
        type="button"
        className="absolute right-5 top-5 grid size-11 place-items-center rounded-2xl text-accent-strong transition hover:bg-panel-soft focus:outline-none focus:ring-2 focus:ring-accent-strong/25"
        aria-label="Kalender oeffnen"
        title="Kalender oeffnen"
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

      {isCalendarOpen ? (
        <CalendarModal
          calendarDays={calendarDays}
          now={now}
          onClose={() => setIsCalendarOpen(false)}
          setVisibleMonth={setVisibleMonth}
          visibleMonth={visibleMonth}
        />
      ) : null}
    </article>
  );
}
