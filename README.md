# Personal Dashboard

Minimalistisches persönliches Dashboard mit Next.js App Router, TypeScript, Tailwind CSS und Supabase.

## Lokal starten

1. Abhängigkeiten installieren:

```bash
npm install
```

2. Supabase-Projekt anlegen und die Tabelle aus `supabase/schema.sql` ausführen.

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

Persönliche Bereiche wie Todos, der vorbereitete Kalenderbereich und spätere private Daten werden erst nach Eingabe von `DASHBOARD_PASSWORD` angezeigt. Der entsperrte Zustand wird nur lokal im Browser gespeichert und kann über „Sperren“ zurückgesetzt werden.

Dieser Schutz ist für ein persönliches Dashboard gedacht und ersetzt kein vollständiges Benutzerkonto mit Authentifizierung.
