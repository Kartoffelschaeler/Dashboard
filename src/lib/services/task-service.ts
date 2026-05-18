import { createServiceError } from "@/lib/services/service-error";
import type { Task } from "@/types/task";

async function readJson<TData>(response: Response): Promise<TData> {
  const data = (await response.json()) as TData & { error?: string };

  if (!response.ok) {
    if (response.status === 401) {
      throw createServiceError(
        "Dashboard ist gesperrt. Prüfe LOCAL_AUTH_DISABLED=true oder entsperre das Dashboard.",
      );
    }

    throw createServiceError(data.error ?? "Aktion fehlgeschlagen.");
  }

  return data;
}

export async function getTasks(): Promise<Task[]> {
  const data = await readJson<{ tasks: Task[] }>(await fetch("/api/tasks"));

  return data.tasks;
}

export async function createTask(text: string): Promise<Task> {
  const data = await readJson<{ task: Task }>(
    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }),
  );

  return data.task;
}

export async function toggleTask(
  id: string,
  completed: boolean,
): Promise<Task> {
  const data = await readJson<{ task: Task }>(
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    }),
  );

  return data.task;
}

export async function deleteTask(id: string): Promise<void> {
  await readJson<{ deleted: true }>(
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}

export const getTodos = getTasks;
export const createTodo = createTask;
export const updateTodoCompleted = toggleTask;
export const removeTodo = deleteTask;
