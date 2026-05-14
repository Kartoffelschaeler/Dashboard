import { ChatPlaceholder } from "@/components/chat-placeholder";
import { ClockCard } from "@/components/clock-card";
import { TodoPanel } from "@/components/todo-panel";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getTodos } from "@/lib/todos";

export default async function Home() {
  const todos = await getTodos();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
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
