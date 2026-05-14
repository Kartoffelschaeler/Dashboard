import { ChatPlaceholder } from "@/components/chat-placeholder";
import { ClockCard } from "@/components/clock-card";
import { TodoPanel } from "@/components/todo-panel";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getTodos } from "@/lib/todos";

export default async function Home() {
  const todos = await getTodos();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col justify-between gap-3 rounded-[2rem] border border-white/55 bg-panel/72 px-5 py-5 shadow-[0_18px_70px_rgba(97,66,42,0.12)] backdrop-blur md:flex-row md:items-end md:px-7">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">
              Personal Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Ein ruhiger Ort fuer den Tag.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">
            Fokus auf Zeit, Aufgaben und einen klaren Platz fuer das spaetere
            Chatfenster.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
          <ClockCard />
          <TodoPanel
            initialTodos={todos}
            isSupabaseConfigured={isSupabaseConfigured()}
          />
        </section>

        <ChatPlaceholder />
      </div>
    </main>
  );
}
