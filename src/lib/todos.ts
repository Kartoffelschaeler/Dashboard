import { getSupabase } from "@/lib/supabase";
import type { Todo } from "@/lib/types";

export async function getTodos(): Promise<Todo[]> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id,text,completed,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createTodo(text: string): Promise<Todo> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({ text })
    .select("id,text,completed,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateTodoCompleted(
  id: string,
  completed: boolean,
): Promise<Todo> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .update({ completed })
    .eq("id", id)
    .select("id,text,completed,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function removeTodo(id: string): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
  }

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
