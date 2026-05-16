"use client";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createEvent,
  deleteEvent,
  getEvents,
} from "@/lib/services/calendar-service";
import type { CalendarDisplayEvent, CalendarEvent } from "@/types/calendar";
import type {
  GoogleCalendarEvent,
  GoogleCalendarWarning,
} from "@/types/google-calendar";
import {
  addMonths,
  buildMonthDays,
  createLocalDate,
  formatEventDate,
  formatEventTime,
  getCalendarRange,
  getDateKey,
  getEventsForDay,
  getInputDateValue,
  getMonthLabel,
  weekDayLabels,
} from "@/lib/utils/calendar-utils";
import { getCalendarColor } from "@/lib/utils/calendar-colors";

type CalendarModalProps = {
  onClose: () => void;
};

function sortEvents(events: CalendarDisplayEvent[]) {
  return [...events].sort(
    (first, second) =>
      new Date(first.start_date).getTime() -
      new Date(second.start_date).getTime(),
  );
}

function localEventToDisplayEvent(event: CalendarEvent): CalendarDisplayEvent {
  return {
    ...event,
    source: "local",
    calendarName: "Lokal",
    calendarColor: getCalendarColor(undefined, "Lokal", "local"),
    canEdit: true,
    canDelete: true,
  };
}

function googleDateToStartValue(event: GoogleCalendarEvent) {
  return event.start.dateTime ?? `${event.start.date ?? ""}T00:00:00`;
}

function googleDateToEndValue(event: GoogleCalendarEvent) {
  if (event.end.dateTime) {
    return event.end.dateTime;
  }

  if (event.end.date) {
    const exclusiveEnd = createLocalDate(event.end.date);
    exclusiveEnd.setMilliseconds(exclusiveEnd.getMilliseconds() - 1);

    return exclusiveEnd.toISOString();
  }

  return null;
}

function googleEventToDisplayEvent(
  event: GoogleCalendarEvent,
): CalendarDisplayEvent {
  const startDate = googleDateToStartValue(event);

  return {
    id: `google:${event.calendarId}:${event.id}`,
    externalEventId: event.id,
    title: event.summary,
    description: event.description ?? null,
    start_date: startDate,
    end_date: googleDateToEndValue(event),
    all_day: Boolean(event.start.date),
    created_at: startDate,
    source: "google",
    calendarId: event.calendarId,
    calendarName: event.calendarSummary,
    calendarColor: getCalendarColor(
      event.calendarId,
      event.calendarSummary,
      "google",
      event.isAgentCalendar === true,
    ),
    isAgentCalendar: event.isAgentCalendar === true,
    canEdit: event.isAgentCalendar === true,
    canDelete: event.isAgentCalendar === true,
  };
}

function getDayEventDots(events: CalendarDisplayEvent[]) {
  const dots = new Map<string, string>();

  events.forEach((event) => {
    const key = `${event.source}:${event.calendarId ?? event.calendarName ?? "local"}`;

    if (!dots.has(key)) {
      dots.set(key, event.calendarColor ?? getCalendarColor());
    }
  });

  return [...dots.values()].slice(0, 4);
}

export function CalendarModal({ onClose }: CalendarModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarDisplayEvent | null>(null);
  const [events, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => getInputDateValue(new Date()));
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleWarning, setGoogleWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    () => new Set(),
  );

  const monthDays = useMemo(
    () => buildMonthDays(visibleMonth),
    [visibleMonth],
  );
  const selectedDateEvents = useMemo(
    () => getEventsForDay(events, selectedDate),
    [events, selectedDate],
  );

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    const { gridStart, gridEnd } = getCalendarRange(visibleMonth);

    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);
        setGoogleWarning(null);
        const [loadedEvents, googleResult] = await Promise.all([
          getEvents(gridStart, gridEnd),
          fetch(
            `/api/calendar/events?${new URLSearchParams({
              from: gridStart.toISOString(),
              to: gridEnd.toISOString(),
            })}`,
          )
            .then(async (response) => {
              if (!response.ok) {
                return {
                  events: [],
                  warning: "Google-Termine konnten nicht geladen werden.",
                };
              }

              const data = (await response.json()) as {
                events?: GoogleCalendarEvent[];
                warnings?: GoogleCalendarWarning[];
              };

              return {
                events: data.events ?? [],
                warning: data.warnings?.length
                  ? "Einige Google-Kalender konnten nicht geladen werden."
                  : null,
              };
            })
            .catch(() => {
              return {
                events: [],
                warning: "Google-Termine konnten nicht geladen werden.",
              };
            }),
        ]);

        if (isMounted) {
          setGoogleWarning(googleResult.warning);
          setEvents(
            sortEvents([
              ...loadedEvents.map(localEventToDisplayEvent),
              ...googleResult.events.map(googleEventToDisplayEvent),
            ]),
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Termine konnten nicht geladen werden.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, [visibleMonth]);

  function openCreateForm() {
    setDate(getInputDateValue(selectedDate));
    setSelectedEvent(null);
    setIsCreateOpen(true);
  }

  function closeCreateForm() {
    setIsCreateOpen(false);
    setTitle("");
    setTime("");
    setDescription("");
  }

  function setEventDeleting(id: string, isDeleting: boolean) {
    setPendingDeleteIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isDeleting) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }

      return nextIds;
    });
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || isCreating) {
      return;
    }

    const startsAt = createLocalDate(date, time || undefined);

    try {
      setIsCreating(true);
      setError(null);
      const createdEvent = await createEvent({
        title: trimmedTitle,
        description,
        startDate: startsAt.toISOString(),
        allDay: !time,
      });

      setEvents((currentEvents) =>
        sortEvents([...currentEvents, localEventToDisplayEvent(createdEvent)]),
      );
      setSelectedDate(startsAt);
      setVisibleMonth(new Date(startsAt.getFullYear(), startsAt.getMonth(), 1));
      closeCreateForm();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Termin konnte nicht erstellt werden.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteEvent(event: CalendarDisplayEvent) {
    if (!event.canEdit || !event.canDelete || pendingDeleteIds.has(event.id)) {
      return;
    }

    setEventDeleting(event.id, true);
    setEvents((currentEvents) =>
      currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
    );

    try {
      setError(null);
      if (event.source === "google") {
        await fetch(
          `/api/calendar/events/${encodeURIComponent(
            event.externalEventId ?? event.id,
          )}`,
          { method: "DELETE" },
        ).then((response) => {
          if (!response.ok) {
            throw new Error("Termin konnte nicht gelöscht werden.");
          }
        });
      } else {
        await deleteEvent(event.id);
      }

      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
      }
    } catch (deleteError) {
      setEvents((currentEvents) => sortEvents([...currentEvents, event]));
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Termin konnte nicht gelöscht werden.",
      );
    } finally {
      setEventDeleting(event.id, false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-foreground/18 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="relative max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-panel p-5 shadow-[0_24px_80px_rgba(70,55,45,0.20)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25"
              aria-label="Vorheriger Monat"
              title="Vorheriger Monat"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25"
              aria-label="Nächster Monat"
              title="Nächster Monat"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <p className="text-base font-medium capitalize text-foreground">
            {getMonthLabel(visibleMonth)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              disabled={isLoading}
              className="grid size-10 place-items-center rounded-2xl bg-accent text-white shadow-[0_12px_24px_rgba(156,99,62,0.18)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55"
              aria-label="Termin hinzufügen"
              title="Termin hinzufügen"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-2xl text-muted transition hover:bg-panel-soft hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25"
              aria-label="Kalender schließen"
              title="Kalender schließen"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-panel-soft/70 px-4 py-3 text-sm leading-6 text-accent-strong">
            {error}
          </div>
        ) : null}

        {!error && googleWarning ? (
          <div className="mt-4 rounded-2xl bg-panel-soft/50 px-4 py-3 text-xs leading-5 text-muted">
            {googleWarning}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_17rem]">
          <div>
            <div className="grid grid-cols-7 border-b border-line/70 pb-2">
              {weekDayLabels.map((label) => (
                <div
                  key={label}
                  className="px-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted/80"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dayEvents = getEventsForDay(events, day.date);
                const eventDots = getDayEventDots(dayEvents);
                const isSelected = getDateKey(selectedDate) === day.key;

                return (
                  <button
                    type="button"
                    key={day.key}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedEvent(null);
                      setIsCreateOpen(false);
                    }}
                    className={`grid aspect-square min-h-16 place-items-center rounded-2xl px-1 py-2 transition focus:outline-none focus:ring-2 focus:ring-accent/25 ${
                      isSelected ? "bg-white/60" : "hover:bg-white/38"
                    } ${day.isCurrentWeek ? "bg-panel-soft/18" : ""}`}
                  >
                    <span
                      className={`grid size-8 place-items-center rounded-full text-sm ${
                        day.isToday
                          ? "bg-accent text-white shadow-[0_10px_24px_rgba(156,99,62,0.18)]"
                          : day.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted/35"
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                    <span className="mt-1 flex h-2 items-center justify-center gap-1">
                      {!isLoading
                        ? eventDots.map((color) => (
                          <span
                            key={color}
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))
                        : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl bg-white/28 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Tag</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedDate.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateForm}
                disabled={isLoading}
                className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-panel hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-55"
                aria-label="Termin an diesem Tag hinzufügen"
                title="Termin an diesem Tag hinzufügen"
              >
                <Plus size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {isLoading ? (
                <>
                  <div className="h-14 rounded-2xl bg-white/34" />
                  <div className="h-14 rounded-2xl bg-white/24" />
                </>
              ) : null}

              {!isLoading && selectedDateEvents.length === 0 ? (
                <div className="rounded-2xl bg-white/24 px-4 py-5 text-sm text-muted">
                  Keine Termine.
                </div>
              ) : null}

              {!isLoading
                ? selectedDateEvents.map((calendarEvent) => (
                  <button
                    type="button"
                    key={calendarEvent.id}
                    onClick={() => {
                      setSelectedEvent(calendarEvent);
                      setIsCreateOpen(false);
                    }}
                    className="w-full rounded-2xl bg-panel/68 px-3 py-3 text-left transition hover:bg-panel focus:outline-none focus:ring-2 focus:ring-accent/25"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: calendarEvent.calendarColor }}
                      />
                      <p className="truncate text-sm font-medium text-foreground">
                        {calendarEvent.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {formatEventTime(calendarEvent)}
                      {calendarEvent.calendarName
                        ? ` · ${calendarEvent.calendarName}`
                        : ""}
                    </p>
                  </button>
                ))
                : null}
            </div>
          </aside>
        </div>

        {isCreateOpen ? (
          <div
            className="absolute inset-0 z-10 grid place-items-center rounded-[2rem] bg-foreground/12 px-4 py-6 backdrop-blur-sm"
            onClick={closeCreateForm}
          >
            <form
              onSubmit={handleCreateEvent}
              className="w-full max-w-md rounded-[1.75rem] bg-panel p-5 shadow-[0_24px_70px_rgba(97,66,42,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">Termin</h3>
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="grid size-8 place-items-center rounded-xl text-muted transition hover:bg-panel-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
                  aria-label="Schließen"
                  title="Schließen"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Titel"
                  autoFocus
                  className="w-full rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72"
                />
                <div className="grid grid-cols-[1fr_7.5rem] gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    className="min-w-0 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:bg-white/72"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="min-w-0 rounded-2xl border border-line bg-white/50 px-3 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:bg-white/72"
                  />
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  placeholder="Beschreibung"
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72"
                />
              </div>

              <button
                type="submit"
                disabled={!title.trim() || isCreating}
                className="mt-3 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(156,99,62,0.18)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Speichern
              </button>
            </form>
          </div>
        ) : null}

        {selectedEvent ? (
          <div className="mt-5 rounded-2xl bg-white/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {formatEventDate(selectedEvent)} · {formatEventTime(selectedEvent)}
                  {selectedEvent.calendarName
                    ? ` · ${selectedEvent.calendarName}`
                    : ""}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: selectedEvent.calendarColor }}
                  />
                  <span>{selectedEvent.calendarName ?? "Kalender"}</span>
                </div>
                <h3 className="mt-2 break-words text-base font-medium text-foreground">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="grid size-8 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-panel-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {selectedEvent.description ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted">
                {selectedEvent.description}
              </p>
            ) : null}

            {selectedEvent.canEdit && selectedEvent.canDelete ? (
              <button
                type="button"
                disabled={pendingDeleteIds.has(selectedEvent.id)}
                onClick={() => void handleDeleteEvent(selectedEvent)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-panel-soft hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Trash2 size={16} aria-hidden="true" />
                Löschen
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
