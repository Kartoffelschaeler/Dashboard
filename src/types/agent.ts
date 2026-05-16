import type { CalendarEvent, CreateCalendarEventInput } from "@/types/calendar";
import type { Task } from "@/types/task";

export type AgentActionType =
  | "create_task"
  | "create_event"
  | "get_open_tasks"
  | "get_upcoming_events";

export type AgentActionStatus = "pending" | "success" | "error";

export type AgentAction = {
  id: string;
  type: AgentActionType;
  status: AgentActionStatus;
  createdAt: string;
  error?: string;
};

export type AgentToolResult<TData> = {
  ok: boolean;
  data?: TData;
  error?: string;
};

export type AgentToolMap = {
  createTask: (text: string) => Promise<AgentToolResult<Task>>;
  createEvent: (
    input: CreateCalendarEventInput,
  ) => Promise<AgentToolResult<CalendarEvent>>;
  getOpenTasks: () => Promise<AgentToolResult<Task[]>>;
  getUpcomingEvents: (
    from: Date,
    to: Date,
  ) => Promise<AgentToolResult<CalendarEvent[]>>;
};
