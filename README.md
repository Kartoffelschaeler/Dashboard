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

4. `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` eintragen.

5. Entwicklungsserver starten:

```bash
npm run dev
```

Die App läuft danach unter `http://localhost:3000`.
