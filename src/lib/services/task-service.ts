import { getSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type { Task } from "@/types/task";

const taskFields = "id,text,completed,created_at";

export async function getTasks(): Promise<Task[]> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .select(taskFields)
    .order("created_at", { ascending: false });

  if (error) {
    throw createServiceError(error.message);
  }

  return data ?? [];
}

export async function createTask(text: string): Promise<Task> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({ text })
    .select(taskFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function toggleTask(
  id: string,
  completed: boolean,
): Promise<Task> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("todos")
    .update({ completed })
    .eq("id", id)
    .select(taskFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    throw createServiceError(error.message);
  }
}

export const getTodos = getTasks;
export const createTodo = createTask;
export const updateTodoCompleted = toggleTask;
export const removeTodo = deleteTask;
