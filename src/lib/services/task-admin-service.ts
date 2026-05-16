import { getServerSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type { Task } from "@/types/task";

const taskFields = "id,text,completed,created_at";

function getAdminClient() {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw createServiceError("Datenbank ist serverseitig nicht konfiguriert.");
  }

  return supabase;
}

export async function getTasksAdmin(): Promise<Task[]> {
  const { data, error } = await getAdminClient()
    .from("todos")
    .select(taskFields)
    .order("created_at", { ascending: false });

  if (error) {
    throw createServiceError(error.message);
  }

  return data ?? [];
}

export async function createTaskAdmin(text: string): Promise<Task> {
  const { data, error } = await getAdminClient()
    .from("todos")
    .insert({ text })
    .select(taskFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function updateTaskAdmin(
  id: string,
  completed: boolean,
): Promise<Task> {
  const { data, error } = await getAdminClient()
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

export async function deleteTaskAdmin(id: string): Promise<void> {
  const { error } = await getAdminClient().from("todos").delete().eq("id", id);

  if (error) {
    throw createServiceError(error.message);
  }
}
