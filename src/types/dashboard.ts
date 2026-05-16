export type DashboardItemType =
  | "task"
  | "homework"
  | "deadline"
  | "reminder"
  | "note"
  | "event";

export type DashboardItemSource = "manual" | "agent";

export type DashboardItem = {
  id: string;
  title: string;
  type: DashboardItemType;
  completed: boolean;
  due_date: string | null;
  source: DashboardItemSource;
  created_at: string;
};
