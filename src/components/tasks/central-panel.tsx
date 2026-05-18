"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTask,
} from "@/lib/services/task-service";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { Task } from "@/types/task";

function sortTasks(tasks: Task[]) {
  return [...tasks].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime(),
  );
}

export function CentralPanel() {
  // The Zentrale still uses the existing todos table. A future dashboard_items
  // service can replace this data layer without changing the panel behavior.
  const { taskRefreshKey } = useDashboard();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        setIsLoading(true);
        setError(null);
        const loadedTasks = await getTasks();

        if (isMounted) {
          setTasks(sortTasks(loadedTasks));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Einträge konnten nicht geladen werden.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [taskRefreshKey]);

  function setTaskPending(id: string, isPending: boolean) {
    setPendingIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isPending) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }

      return nextIds;
    });
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = newItem.trim();

    if (!text || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const createdTask = await createTask(text);
      setTasks((currentTasks) => sortTasks([createdTask, ...currentTasks]));
      setNewItem("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Eintrag konnte nicht erstellt werden.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleTask(task: Task) {
    if (pendingIds.has(task.id)) {
      return;
    }

    const nextCompleted = !task.completed;

    setTaskPending(task.id, true);
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? { ...currentTask, completed: nextCompleted }
          : currentTask,
      ),
    );

    try {
      setError(null);
      const updatedTask = await toggleTask(task.id, nextCompleted);
      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) =>
            currentTask.id === task.id ? updatedTask : currentTask,
          ),
        ),
      );
    } catch (updateError) {
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? task : currentTask,
        ),
      );
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Eintrag konnte nicht aktualisiert werden.",
      );
    } finally {
      setTaskPending(task.id, false);
    }
  }

  async function handleDeleteTask(task: Task) {
    if (pendingIds.has(task.id)) {
      return;
    }

    setTaskPending(task.id, true);
    setTasks((currentTasks) =>
      currentTasks.filter((currentTask) => currentTask.id !== task.id),
    );

    try {
      setError(null);
      await deleteTask(task.id);
    } catch (deleteError) {
      setTasks((currentTasks) => sortTasks([task, ...currentTasks]));
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Eintrag konnte nicht gelöscht werden.",
      );
    } finally {
      setTaskPending(task.id, false);
    }
  }

  return (
    <article className="min-h-72 rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <form onSubmit={handleCreateItem} className="flex gap-2">
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          maxLength={160}
          placeholder="Was steht an?"
          disabled={isCreating || isLoading}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={
            isCreating || isLoading || !newItem.trim()
          }
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-[0_12px_24px_rgba(156,99,62,0.20)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-accent"
          aria-label="Eintrag hinzufügen"
          title="Eintrag hinzufügen"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </form>

      <div className="mt-4 min-h-44 space-y-2">
        {error ? (
          <div className="rounded-2xl bg-panel-soft/70 px-4 py-3 text-sm leading-6 text-accent-strong">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-14 rounded-2xl bg-white/28" />
            <div className="h-14 rounded-2xl bg-white/22" />
          </div>
        ) : null}

        {!isLoading
          ? tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 rounded-2xl bg-white/34 px-3 py-3 transition hover:bg-white/52 ${
                task.completed ? "opacity-60" : ""
              }`}
            >
              <button
                type="button"
                className={`grid size-9 shrink-0 place-items-center rounded-xl border transition ${
                  task.completed
                    ? "border-success bg-success text-white"
                    : "border-line bg-panel text-muted hover:border-accent"
                }`}
                aria-label={
                  task.completed
                    ? "Eintrag als offen markieren"
                    : "Eintrag abschließen"
                }
                title={
                  task.completed
                    ? "Eintrag als offen markieren"
                    : "Eintrag abschließen"
                }
                disabled={pendingIds.has(task.id)}
                onClick={() => void handleToggleTask(task)}
              >
                {task.completed ? <Check size={17} aria-hidden="true" /> : null}
              </button>
              <p
                className={`min-w-0 flex-1 text-sm leading-6 ${
                  task.completed
                    ? "text-muted line-through decoration-accent-strong/45"
                    : "text-foreground"
                }`}
              >
                {task.text}
              </p>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted opacity-0 transition hover:bg-panel-soft hover:text-accent-strong focus:opacity-100 group-hover:opacity-100"
                aria-label="Eintrag löschen"
                title="Eintrag löschen"
                disabled={pendingIds.has(task.id)}
                onClick={() => void handleDeleteTask(task)}
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))
          : null}
      </div>
    </article>
  );
}
