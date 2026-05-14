"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createTodo,
  getTodos,
  removeTodo,
  updateTodoCompleted,
} from "@/lib/todos";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Todo } from "@/lib/types";

function sortTodos(todos: Todo[]) {
  return [...todos].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime(),
  );
}

export function TodoPanel() {
  const hasSupabaseConfig = isSupabaseConfigured();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTodos() {
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
        const loadedTodos = await getTodos();

        if (isMounted) {
          setTodos(sortTodos(loadedTodos));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Todos konnten nicht geladen werden.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTodos();

    return () => {
      isMounted = false;
    };
  }, [hasSupabaseConfig]);

  function setTodoPending(id: string, isPending: boolean) {
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

  async function handleCreateTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = newTodo.trim();

    if (!text || isCreating || !hasSupabaseConfig) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const createdTodo = await createTodo(text);
      setTodos((currentTodos) => sortTodos([createdTodo, ...currentTodos]));
      setNewTodo("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Todo konnte nicht erstellt werden.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleTodo(todo: Todo) {
    if (pendingIds.has(todo.id)) {
      return;
    }

    const nextCompleted = !todo.completed;

    setTodoPending(todo.id, true);
    setTodos((currentTodos) =>
      currentTodos.map((currentTodo) =>
        currentTodo.id === todo.id
          ? { ...currentTodo, completed: nextCompleted }
          : currentTodo,
      ),
    );

    try {
      setError(null);
      const updatedTodo = await updateTodoCompleted(todo.id, nextCompleted);
      setTodos((currentTodos) =>
        sortTodos(
          currentTodos.map((currentTodo) =>
            currentTodo.id === todo.id ? updatedTodo : currentTodo,
          ),
        ),
      );
    } catch (updateError) {
      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? todo : currentTodo,
        ),
      );
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Todo konnte nicht aktualisiert werden.",
      );
    } finally {
      setTodoPending(todo.id, false);
    }
  }

  async function handleDeleteTodo(todo: Todo) {
    if (pendingIds.has(todo.id)) {
      return;
    }

    setTodoPending(todo.id, true);
    setTodos((currentTodos) =>
      currentTodos.filter((currentTodo) => currentTodo.id !== todo.id),
    );

    try {
      setError(null);
      await removeTodo(todo.id);
    } catch (deleteError) {
      setTodos((currentTodos) => sortTodos([todo, ...currentTodos]));
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Todo konnte nicht geloescht werden.",
      );
    } finally {
      setTodoPending(todo.id, false);
    }
  }

  return (
    <article className="rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <form
        onSubmit={handleCreateTodo}
        className="flex gap-2"
      >
        <input
          value={newTodo}
          onChange={(event) => setNewTodo(event.target.value)}
          maxLength={160}
          placeholder="Neue Aufgabe"
          disabled={isCreating || isLoading || !hasSupabaseConfig}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={
            isCreating || isLoading || !hasSupabaseConfig || !newTodo.trim()
          }
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-[0_12px_24px_rgba(156,99,62,0.20)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-accent"
          aria-label="Aufgabe hinzufuegen"
          title="Aufgabe hinzufuegen"
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
          ? todos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 rounded-2xl bg-white/34 px-3 py-3 transition hover:bg-white/52 ${
                todo.completed ? "opacity-60" : ""
              }`}
            >
              <button
                type="button"
                className={`grid size-9 shrink-0 place-items-center rounded-xl border transition ${
                  todo.completed
                    ? "border-success bg-success text-white"
                    : "border-line bg-panel text-muted hover:border-accent"
                }`}
                aria-label={
                  todo.completed
                    ? "Aufgabe als offen markieren"
                    : "Aufgabe abschliessen"
                }
                title={
                  todo.completed
                    ? "Aufgabe als offen markieren"
                    : "Aufgabe abschliessen"
                }
                disabled={pendingIds.has(todo.id)}
                onClick={() => void handleToggleTodo(todo)}
              >
                {todo.completed ? (
                  <Check size={17} aria-hidden="true" />
                ) : null}
              </button>
              <p
                className={`min-w-0 flex-1 text-sm leading-6 ${
                  todo.completed
                    ? "text-muted line-through decoration-accent-strong/45"
                    : "text-foreground"
                }`}
              >
                {todo.text}
              </p>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted opacity-0 transition hover:bg-panel-soft hover:text-accent-strong focus:opacity-100 group-hover:opacity-100"
                aria-label="Aufgabe loeschen"
                title="Aufgabe loeschen"
                disabled={pendingIds.has(todo.id)}
                onClick={() => void handleDeleteTodo(todo)}
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
