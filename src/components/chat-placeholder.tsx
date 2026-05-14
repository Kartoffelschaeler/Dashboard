import { MessageSquareText, Sparkles } from "lucide-react";

export function ChatPlaceholder() {
  return (
    <section className="rounded-[2rem] border border-white/60 bg-panel/74 p-5 shadow-[0_18px_60px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-panel-soft text-accent-strong">
            <MessageSquareText size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">KI-Chat</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Platzhalter fuer spaeter
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Dieser Bereich ist vorbereitet, aber noch ohne echte KI-Funktion.
              Spaeter kann hier ein Chatfenster mit Streaming-Antworten und
              Verlauf entstehen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/34 px-4 py-3 text-sm font-medium text-accent-strong">
          <Sparkles size={17} aria-hidden="true" />
          Bereit fuer Ausbau
        </div>
      </div>
    </section>
  );
}
