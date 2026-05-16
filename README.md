# Personal Dashboard

Minimalistisches persönliches Dashboard mit Next.js App Router, TypeScript, Tailwind CSS und Supabase.

## Lokal starten

1. Abhängigkeiten installieren:

```bash
npm install
```

2. Supabase-Projekt anlegen und das Schema aus `supabase/schema.sql` ausführen.

3. Umgebungsvariablen kopieren:

```bash
cp .env.example .env.local
```

4. Umgebungsvariablen in `.env.local` eintragen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DASHBOARD_PASSWORD=change-me
```

5. Entwicklungsserver starten:

```bash
npm run dev
```

Die App läuft danach unter `http://localhost:3000`.

## Geschützte Bereiche

Die Website bleibt öffentlich sichtbar. Uhrzeit, Datum, Layout und der KI-Chat-Platzhalter sind frei zugänglich.

Persönliche Bereiche wie Zentrale, Kalender und spätere private Daten werden erst nach Eingabe von `DASHBOARD_PASSWORD` angezeigt. Der entsperrte Zustand wird nur lokal im Browser gespeichert.

Dieser Schutz ist für ein persönliches Dashboard gedacht und ersetzt kein vollständiges Benutzerkonto mit Authentifizierung.

## Dashboard-Struktur

Das Dashboard bleibt bewusst reduziert:

- links: Zeit, Datum und Kalender-Icon
- rechts: Zentrale
- darunter: KI-Chat-Platzhalter

Die Zentrale nutzt aktuell weiterhin die bestehende `todos` Tabelle. Sie ist als späterer KI-Ausgabebereich vorbereitet, zum Beispiel für Hausaufgaben, Abgaben, Erinnerungen, kurze Notizen und persönliche Aufgaben. Eine spätere Migration auf eine allgemeinere `dashboard_items` Tabelle ist vorgesehen, aber noch nicht nötig.

## Kalender

Der Kalender ist kein dauerhaftes Dashboard-Panel mehr. Nach dem Entsperren öffnet das Kalender-Icon in der Zeitkarte ein ruhiges Modal:

- Monatsansicht mit Navigation
- heutiger Tag deutlich markiert
- Tage mit Terminen zeigen kleine Punkte
- Tagesdetails erscheinen erst nach Klick auf einen Tag
- Termine können im Detailbereich geöffnet und gelöscht werden
- neue Termine werden über den kleinen Plus-Button im Modal erstellt

Die Kalenderlogik ist für spätere KI-Agenten vorbereitet:

- `src/lib/calendar-types.ts` enthält die Termin-Typen
- `src/lib/calendar-utils.ts` enthält Datumsraster, Filter und Formatierung
- `src/lib/calendar-service.ts` kapselt Laden, Erstellen und Löschen über Supabase

## Supabase Schema

Das vollständige lokale Schema liegt in `supabase/schema.sql`. Für den Kalender wird diese Tabelle benötigt:

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

Row Level Security ist aktiviert. Das Schema enthält einfache Policies für Lesen, Erstellen und Löschen mit dem Supabase Anon Key. Der Dashboard-Zugriff wird zusätzlich über das lokale Passwort-Unlock gesteuert.

## Environment Variables

Diese Variablen werden lokal in `.env.local` benötigt:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DASHBOARD_PASSWORD=change-me
```

`NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` werden für Todos und Kalender verwendet. `DASHBOARD_PASSWORD` schützt die persönlichen Bereiche im Dashboard.
