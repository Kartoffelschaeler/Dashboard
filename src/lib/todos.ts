import { getSupabase } from "@/lib/supabase";
import type { Todo } from "@/lib/types";

export async function getTodos(): Promise<Todo[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id,title,is_complete,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load todos", error);
    return [];
  }

  return data ?? [];
}
