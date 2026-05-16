import type { CalendarDay, CalendarEvent } from "@/lib/calendar-types";

const dayFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
});

export const weekDayLabels = Array.from({ length: 7 }, (_, index) =>
  weekdayFormatter.format(addDays(startOfWeek(new Date(2026, 0, 5)), index)),
);

export function getMonthLabel(date: Date) {
  return monthFormatter.format(date);
}

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getInputDateValue(date: Date) {
  return getDateKey(date);
}

export function createLocalDate(dateValue: string, timeValue?: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours = 0, minutes = 0] = timeValue?.split(":").map(Number) ?? [];

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);

  return nextDate;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

export function startOfWeek(date: Date) {
  const startDate = startOfDay(date);
  const weekday = (startDate.getDay() + 6) % 7;

  return addDays(startDate, -weekday);
}

export function endOfWeek(date: Date) {
  const endDate = startOfWeek(date);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return endDate;
}

export function getCalendarRange(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  return {
    monthStart,
    monthEnd,
    gridStart: startOfWeek(monthStart),
    gridEnd: endOfWeek(monthEnd),
  };
}

export function buildMonthDays(monthDate: Date): CalendarDay[] {
  const todayKey = getDateKey(new Date());
  const currentWeekStart = startOfWeek(new Date()).getTime();
  const { gridStart, gridEnd } = getCalendarRange(monthDate);
  const days: CalendarDay[] = [];

  for (
    let date = gridStart;
    date.getTime() <= gridEnd.getTime();
    date = addDays(date, 1)
  ) {
    const dayDate = new Date(date);

    days.push({
      date: dayDate,
      key: getDateKey(dayDate),
      dayOfMonth: dayDate.getDate(),
      isCurrentMonth: dayDate.getMonth() === monthDate.getMonth(),
      isToday: getDateKey(dayDate) === todayKey,
      isCurrentWeek: startOfWeek(dayDate).getTime() === currentWeekStart,
    });
  }

  return days;
}

export function eventTouchesDay(event: CalendarEvent, date: Date) {
  const dayStart = startOfDay(date).getTime();
  const dayEnd = endOfDay(date).getTime();
  const eventStart = new Date(event.start_date).getTime();
  const eventEnd = event.end_date ? new Date(event.end_date).getTime() : eventStart;

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

export function getEventsForDay(events: CalendarEvent[], date: Date) {
  return events
    .filter((event) => eventTouchesDay(event, date))
    .sort(
      (first, second) =>
        new Date(first.start_date).getTime() -
        new Date(second.start_date).getTime(),
    );
}

export function formatEventTime(event: CalendarEvent) {
  if (event.all_day) {
    return "Ganztags";
  }

  const start = new Date(event.start_date);
  const startLabel = timeFormatter.format(start);

  if (!event.end_date) {
    return startLabel;
  }

  return `${startLabel} - ${timeFormatter.format(new Date(event.end_date))}`;
}

export function formatEventDate(event: CalendarEvent) {
  const start = new Date(event.start_date);

  if (!event.end_date || getDateKey(start) === getDateKey(new Date(event.end_date))) {
    return dayFormatter.format(start);
  }

  return `${dayFormatter.format(start)} - ${dayFormatter.format(
    new Date(event.end_date),
  )}`;
}
