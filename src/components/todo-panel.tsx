"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useRef, useTransition } from "react";
import { addTodo, deleteTodo, toggleTodo } from "@/app/actions";
import type { Todo } from "@/lib/types";

type TodoPanelProps = {
  initialTodos: Todo[];
  isSupabaseConfigured: boolean;
};

type OptimisticAction =
  | { type: "add"; title: string }
  | { type: "toggle"; id: string; isComplete: boolean }
  | { type: "delete"; id: string };

export function TodoPanel({
  initialTodos,
  isSupabaseConfigured,
}: TodoPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [todos, applyOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, action: OptimisticAction) => {
      if (action.type === "add") {
        return [
          {
            id: `draft-${action.title}-${Date.now()}`,
            title: action.title,
            is_complete: false,
            created_at: new Date().toISOString(),
          },
          ...state,
        ];
      }

      if (action.type === "toggle") {
        return state.map((todo) =>
          todo.id === action.id
            ? { ...todo, is_complete: action.isComplete }
            : todo,
        );
      }

      return state.filter((todo) => todo.id !== action.id);
    },
  );

  const openTodos = todos.filter((todo) => !todo.is_complete).length;

  return (
    <article className="rounded-[2rem] border border-white/60 bg-panel/82 p-5 shadow-[0_18px_60px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-muted">Supabase Todos</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Aufgaben
          </h2>
        </div>
        <div className="rounded-2xl bg-panel-soft px-4 py-2 text-sm font-semibold text-accent-strong">
          {openTodos} offen
        </div>
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          const title = String(formData.get("title") ?? "").trim();

          if (!title) {
            return;
          }

          formRef.current?.reset();
          startTransition(() => {
            applyOptimisticTodo({ type: "add", title });
          });
          await addTodo(formData);
        }}
        className="mt-6 flex gap-2"
      >
        <input
          name="title"
          maxLength={160}
          placeholder="Neue Aufgabe"
          disabled={!isSupabaseConfigured}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!isSupabaseConfigured}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-[0_12px_24px_rgba(156,99,62,0.20)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-accent"
          aria-label="Aufgabe hinzufuegen"
          title="Aufgabe hinzufuegen"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-line bg-panel-soft/65 px-4 py-4 text-sm leading-6 text-accent-strong">
            Supabase ist noch nicht konfiguriert. Trage URL und Anon Key in
            `.env.local` ein, dann wird die Todo-Liste aktiv.
          </div>
        ) : null}
        {todos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/30 px-4 py-5 text-sm leading-6 text-muted">
            Noch keine Aufgaben. Sobald Supabase verbunden ist, erscheinen neue
            Eintraege hier dauerhaft.
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 rounded-2xl border border-line/85 bg-white/38 px-3 py-3"
            >
              <button
                type="button"
                className={`grid size-9 shrink-0 place-items-center rounded-xl border transition ${
                  todo.is_complete
                    ? "border-success bg-success text-white"
                    : "border-line bg-panel text-muted hover:border-accent"
                }`}
                aria-label={
                  todo.is_complete
                    ? "Aufgabe als offen markieren"
                    : "Aufgabe abschliessen"
                }
                title={
                  todo.is_complete
                    ? "Aufgabe als offen markieren"
                    : "Aufgabe abschliessen"
                }
                disabled={isPending || todo.id.startsWith("draft-")}
                onClick={() => {
                  startTransition(() => {
                    applyOptimisticTodo({
                      type: "toggle",
                      id: todo.id,
                      isComplete: !todo.is_complete,
                    });
                  });
                  void toggleTodo(todo.id, !todo.is_complete);
                }}
              >
                {todo.is_complete ? <Check size={17} aria-hidden="true" /> : null}
              </button>
              <p
                className={`min-w-0 flex-1 text-sm leading-6 ${
                  todo.is_complete
                    ? "text-muted line-through decoration-accent-strong/45"
                    : "text-foreground"
                }`}
              >
                {todo.title}
              </p>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-panel-soft hover:text-accent-strong"
                aria-label="Aufgabe loeschen"
                title="Aufgabe loeschen"
                disabled={isPending || todo.id.startsWith("draft-")}
                onClick={() => {
                  startTransition(() => {
                    applyOptimisticTodo({ type: "delete", id: todo.id });
                  });
                  void deleteTodo(todo.id);
                }}
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
