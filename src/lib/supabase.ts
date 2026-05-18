import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent } from "@/types/calendar";
import type { CalendarConnection } from "@/types/google-calendar";
import type { AgentMemory } from "@/types/memory";
import type { Task } from "@/types/task";

type Database = {
  public: {
    Tables: {
      todos: {
        Row: Task;
        Insert: {
          id?: string;
          text: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date?: string | null;
          all_day?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_connections: {
        Row: CalendarConnection;
        Insert: {
          id?: string;
          provider?: "google";
          access_token: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: "google";
          access_token?: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_action_logs: {
        Row: {
          id: string;
          conversation_id: string | null;
          tool_name: string;
          tool_input_summary: string | null;
          status: string;
          risk_level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          tool_name: string;
          tool_input_summary?: string | null;
          status: string;
          risk_level: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          tool_name?: string;
          tool_input_summary?: string | null;
          status?: string;
          risk_level?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_memories: {
        Row: AgentMemory;
        Insert: {
          id?: string;
          content: string;
          type?: AgentMemory["type"];
          confidence?: number;
          source?: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
          archived?: boolean;
        };
        Update: {
          id?: string;
          content?: string;
          type?: AgentMemory["type"];
          confidence?: number;
          source?: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
          archived?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabase: SupabaseClient<Database> | null = null;
let serverSupabase: SupabaseClient<Database> | null = null;

function normalizeSupabaseUrl(url: string) {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/auth\/v1\/?$/, "")
    .replace(/\/+$/, "");
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabase() {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabase = createClient(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}

export function getServerSupabase() {
  if (serverSupabase) {
    return serverSupabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  serverSupabase = createClient(
    normalizeSupabaseUrl(supabaseUrl),
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return serverSupabase;
}
