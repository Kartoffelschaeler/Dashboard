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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DASHBOARD_PASSWORD=change-me

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_AGENT_CALENDAR_NAME=Dashboard Agent

AGENT_ENABLED=false
AGENT_MODEL=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` wird nur serverseitig genutzt, um Google OAuth Tokens zu speichern. Google Secrets und spätere Agent-Secrets dürfen nicht als `NEXT_PUBLIC_` Variablen angelegt werden.

`OPENAI_API_KEY`, `AGENT_ENABLED` und `AGENT_MODEL` sind nur vorbereitet und werden noch nicht verwendet.

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
- kleine Google-Kalender-Karte im entsperrten Bereich

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
- `src/lib/services/google-calendar-auth-service.ts`
  - `createGoogleAuthUrl`
  - `exchangeCodeForTokens`
  - `saveGoogleConnection`
  - `refreshAccessTokenIfNeeded`
- `src/lib/services/google-calendar-service.ts`
  - `getGoogleCalendars`
  - `getGoogleEvents`
  - `createGoogleEvent`
  - `updateGoogleEvent`
  - `deleteGoogleEvent`

Komponenten sprechen nicht direkt mit Supabase. Ein späterer Agent soll ebenfalls diese Services verwenden.

## Agent-Vorbereitung

Noch keine echte KI ist eingebaut. Vorbereitet sind:

- `src/lib/agent/tools/create-task-tool.ts`
- `src/lib/agent/tools/create-event-tool.ts`
- `src/lib/agent/tools/create-calendar-event-tool.ts`
- `src/lib/agent/tools/update-calendar-event-tool.ts`
- `src/lib/agent/tools/delete-calendar-event-tool.ts`
- `src/lib/agent/tools/get-calendar-events-tool.ts`
- `src/lib/agent/tools/get-open-tasks-tool.ts`
- `src/lib/agent/tools/get-upcoming-events-tool.ts`
- `src/lib/agent/memory/agent-memory.ts`
- `src/lib/agent/memory/conversation-store.ts`

Der spätere Agent soll nicht getrennt vom Dashboard arbeiten, sondern diese Tools nutzen, um Aufgaben und Termine über dieselbe Datenlogik zu lesen oder zu verändern.

Google-Schreibzugriffe sind in den vorbereiteten Tools auf den Kalender aus `GOOGLE_AGENT_CALENDAR_NAME` begrenzt. Persönliche Kalender werden gelesen, aber nicht als Schreibziel vorbereitet.

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
- `calendar_connections`

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

Google OAuth Tokens liegen in `calendar_connections`. Für diese Tabelle sind keine öffentlichen RLS Policies vorgesehen; der Zugriff läuft serverseitig über den Supabase Service Role Key.

```sql
create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists calendar_connections_provider_key
  on public.calendar_connections(provider);

alter table public.calendar_connections enable row level security;
```

## Google Calendar

In Google Cloud muss der OAuth Client als Redirect URI denselben Wert haben wie `GOOGLE_REDIRECT_URI`, lokal also meist:

```txt
http://localhost:3000/api/auth/google/callback
```

Nach dem Entsperren erscheint eine kleine Karte „Google Kalender“. Der Button startet den OAuth Flow. Danach werden Kalender gelesen und Google-Termine im bestehenden Kalender-Modal als dezente Punkte zusammen mit lokalen Terminen angezeigt.

Der Kalender mit dem Namen aus `GOOGLE_AGENT_CALENDAR_NAME` ist der vorbereitete Schreib-Kalender für spätere Agent-Funktionen. Er sollte im Google Konto existieren, zum Beispiel `Dashboard Agent`.
