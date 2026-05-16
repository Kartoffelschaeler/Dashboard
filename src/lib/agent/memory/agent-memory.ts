import type { CalendarEvent } from "@/types/calendar";
import type { Task } from "@/types/task";

export type AgentMemorySnapshot = {
  openTasks: Task[];
  upcomingEvents: CalendarEvent[];
  updatedAt: string;
};

export function createEmptyAgentMemory(): AgentMemorySnapshot {
  return {
    openTasks: [],
    upcomingEvents: [],
    updatedAt: new Date(0).toISOString(),
  };
}

// Future agent memory belongs here: user preferences, recurring routines,
// school/exam context, and summaries of previous assistant decisions.
