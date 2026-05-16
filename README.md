# Personal Dashboard

Minimalistisches persönliches Dashboard mit Next.js App Router, TypeScript, Tailwind CSS und Supabase. Die App ist jetzt so strukturiert, dass ein späterer KI-Agent dieselben Services nutzen kann wie die UI.

## Lokal Starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Die App läuft danach unter `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DASHBOARD_PASSWORD=change-me

AGENT_ENABLED=false
AGENT_MODEL=
OPENAI_API_KEY=
```

`OPENAI_API_KEY`, `AGENT_ENABLED` und `AGENT_MODEL` sind nur vorbereitet und werden noch nicht verwendet. Sie dürfen nicht als `NEXT_PUBLIC_` Variablen angelegt werden.

## Struktur

```txt
src/components
  calendar
  chat
  dashboard
  tasks

src/lib
  agent
    memory
    tools
  config
  services
  utils

src/types
```

Das Dashboard bleibt ruhig und fokussiert:

- links: Zeit, Datum und Kalender-Icon
- rechts: Zentrale für Aufgaben und kurze Einträge
- darunter: vorbereiteter Chat-Platzhalter
- Kalender nur als Modal über das Icon

## Services

Alle Datenoperationen laufen über Services:

- `src/lib/services/task-service.ts`
  - `getTasks`
  - `createTask`
  - `toggleTask`
  - `deleteTask`
- `src/lib/services/calendar-service.ts`
  - `getEvents`
  - `createEvent`
  - `deleteEvent`

Komponenten sprechen nicht direkt mit Supabase. Ein späterer Agent soll ebenfalls diese Services verwenden.

## Agent-Vorbereitung

Noch keine echte KI ist eingebaut. Vorbereitet sind:

- `src/lib/agent/tools/create-task-tool.ts`
- `src/lib/agent/tools/create-event-tool.ts`
- `src/lib/agent/tools/get-open-tasks-tool.ts`
- `src/lib/agent/tools/get-upcoming-events-tool.ts`
- `src/lib/agent/memory/agent-memory.ts`
- `src/lib/agent/memory/conversation-store.ts`

Der spätere Agent soll nicht getrennt vom Dashboard arbeiten, sondern diese Tools nutzen, um Aufgaben und Termine über dieselbe Datenlogik zu lesen oder zu verändern.

## Typen

Zentrale Typen liegen in `src/types`:

- `Task`
- `CalendarEvent`
- `DashboardItem`
- `AgentAction`
- `ChatMessage`

Die Zentrale nutzt aktuell weiterhin die bestehende `todos` Tabelle. Eine spätere Migration auf `dashboard_items` ist vorbereitet, aber noch nicht notwendig.

## Supabase

Das vollständige Schema liegt in `supabase/schema.sql`.

Aktuell verwendet:

- `todos`
- `calendar_events`

Kalender-Tabelle:

```sql
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  all_day boolean not null default false,
  created_at timestamp with time zone not null default now()
);
```

Row Level Security ist aktiviert. Die App schützt persönliche Bereiche zusätzlich über das lokale Passwort-Unlock.
