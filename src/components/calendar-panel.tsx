"use client";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createCalendarEvent,
  getCalendarEvents,
  removeCalendarEvent,
} from "@/lib/calendar-service";
import type { CalendarDay, CalendarEvent } from "@/lib/calendar-types";
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
} from "@/lib/calendar-utils";
import { isSupabaseConfigured } from "@/lib/supabase";

const maxVisibleEvents = 3;

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort(
    (first, second) =>
      new Date(first.start_date).getTime() -
      new Date(second.start_date).getTime(),
  );
}

function CalendarEventPill({
  event,
  onOpen,
}: {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(event);
      }}
      className="w-full truncate rounded-lg bg-panel-soft/65 px-2 py-1 text-left text-[11px] leading-4 text-foreground transition hover:bg-panel-soft focus:outline-none focus:ring-2 focus:ring-accent/25"
      title={event.title}
    >
      {event.all_day ? null : (
        <span className="mr-1 text-muted">{formatEventTime(event)}</span>
      )}
      {event.title}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white/24 px-4 py-5 text-sm text-muted">
      Noch nichts an diesem Tag.
    </div>
  );
}

export function CalendarPanel() {
  const hasSupabaseConfig = isSupabaseConfigured();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => getInputDateValue(new Date()));
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    let isMounted = true;
    const { gridStart, gridEnd } = getCalendarRange(visibleMonth);

    async function loadEvents() {
      if (!hasSupabaseConfig) {
        setError(
          "Supabase ist noch nicht verbunden. Bitte URL und Anon Key konfigurieren.",
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const loadedEvents = await getCalendarEvents(gridStart, gridEnd);

        if (isMounted) {
          setEvents(sortEvents(loadedEvents));
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
  }, [hasSupabaseConfig, visibleMonth]);

  function openCreateModal(day?: CalendarDay) {
    const nextDate = day?.date ?? selectedDate;
    setDate(getInputDateValue(nextDate));
    setSelectedDate(nextDate);
    setSelectedEvent(null);
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
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

    if (!trimmedTitle || isCreating || !hasSupabaseConfig) {
      return;
    }

    const startsAt = createLocalDate(date, time || undefined);

    try {
      setIsCreating(true);
      setError(null);
      const createdEvent = await createCalendarEvent({
        title: trimmedTitle,
        description,
        startDate: startsAt.toISOString(),
        allDay: !time,
      });

      setEvents((currentEvents) => sortEvents([...currentEvents, createdEvent]));
      setSelectedDate(startsAt);
      closeCreateModal();
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

  async function handleDeleteEvent(event: CalendarEvent) {
    if (pendingDeleteIds.has(event.id)) {
      return;
    }

    setEventDeleting(event.id, true);
    setEvents((currentEvents) =>
      currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
    );

    try {
      setError(null);
      await removeCalendarEvent(event.id);

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

  function selectDay(day: CalendarDay) {
    setSelectedDate(day.date);
    setSelectedEvent(null);
  }

  return (
    <article className="rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted/80">
            Kalender
          </p>
          <h2 className="mt-1 text-xl font-medium capitalize text-foreground">
            {getMonthLabel(visibleMonth)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-white/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
            aria-label="Vorheriger Monat"
            title="Vorheriger Monat"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-white/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
            aria-label="Nächster Monat"
            title="Nächster Monat"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => openCreateModal()}
            disabled={isLoading || !hasSupabaseConfig}
            className="grid size-10 place-items-center rounded-xl bg-accent text-white shadow-[0_12px_24px_rgba(156,99,62,0.18)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55"
            aria-label="Termin hinzufügen"
            title="Termin hinzufügen"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-panel-soft/70 px-4 py-3 text-sm leading-6 text-accent-strong">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_16rem]">
        <div>
          <div className="grid grid-cols-7 border-b border-line/70 pb-2">
            {weekDayLabels.map((label) => (
              <div
                key={label}
                className="px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted/80"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 overflow-hidden rounded-b-2xl border-x border-b border-line/60">
            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(events, day.date);
              const isSelected = getDateKey(selectedDate) === day.key;

              return (
                <div
                  key={day.key}
                  onClick={() => selectDay(day)}
                  className={`group min-h-28 min-w-0 border-r border-t border-line/55 p-2 text-left transition first:border-l-0 hover:bg-white/34 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/25 ${
                    day.isCurrentWeek ? "bg-panel-soft/20" : "bg-white/18"
                  } ${isSelected ? "bg-white/42" : ""} ${
                    day.isCurrentMonth ? "" : "text-muted/45"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className={`grid size-7 place-items-center rounded-full text-xs ${
                        day.isToday
                          ? "bg-accent text-white"
                          : "text-muted group-hover:text-foreground"
                      }`}
                      aria-label={`${day.dayOfMonth}. auswählen`}
                    >
                      {day.dayOfMonth}
                    </button>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        dayEvents.length > 0 ? "bg-success/80" : "bg-transparent"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="h-5 rounded-lg bg-white/32" />
                    ) : null}

                    {!isLoading
                      ? dayEvents.slice(0, maxVisibleEvents).map((calendarEvent) => (
                        <CalendarEventPill
                          key={calendarEvent.id}
                          event={calendarEvent}
                          onOpen={setSelectedEvent}
                        />
                      ))
                      : null}

                    {!isLoading && dayEvents.length > maxVisibleEvents ? (
                      <div className="px-2 text-[11px] leading-4 text-muted">
                        +{dayEvents.length - maxVisibleEvents}
                      </div>
                    ) : null}
                  </div>
                </div>
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
              onClick={() => openCreateModal()}
              disabled={isLoading || !hasSupabaseConfig}
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
                <div className="h-16 rounded-2xl bg-white/34" />
                <div className="h-16 rounded-2xl bg-white/24" />
              </>
            ) : null}

            {!isLoading && selectedDateEvents.length === 0 ? <EmptyState /> : null}

            {!isLoading
              ? selectedDateEvents.map((calendarEvent) => (
                <div
                  key={calendarEvent.id}
                  className="group rounded-2xl bg-panel/68 px-3 py-3 transition hover:bg-panel"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedEvent(calendarEvent)}
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {calendarEvent.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatEventTime(calendarEvent)}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="grid size-8 shrink-0 place-items-center rounded-xl text-muted opacity-0 transition hover:bg-panel-soft hover:text-accent-strong focus:opacity-100 group-hover:opacity-100"
                      aria-label="Termin löschen"
                      title="Termin löschen"
                      disabled={pendingDeleteIds.has(calendarEvent.id)}
                      onClick={() => void handleDeleteEvent(calendarEvent)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
              : null}
          </div>
        </aside>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-foreground/18 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-sm rounded-[1.75rem] bg-panel p-5 shadow-[0_24px_70px_rgba(97,66,42,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-foreground">Termin</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-panel-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
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
                rows={3}
                className="w-full resize-none rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || isCreating || !hasSupabaseConfig}
              className="mt-4 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(156,99,62,0.18)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Speichern
            </button>
          </form>
        </div>
      ) : null}

      {selectedEvent ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-foreground/18 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.75rem] bg-panel p-5 shadow-[0_24px_70px_rgba(97,66,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {formatEventDate(selectedEvent)} · {formatEventTime(selectedEvent)}
                </p>
                <h3 className="mt-2 break-words text-lg font-medium text-foreground">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-panel-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            {selectedEvent.description ? (
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted">
                {selectedEvent.description}
              </p>
            ) : null}

            <button
              type="button"
              disabled={pendingDeleteIds.has(selectedEvent.id)}
              onClick={() => void handleDeleteEvent(selectedEvent)}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-panel-soft hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Trash2 size={16} aria-hidden="true" />
              Löschen
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
