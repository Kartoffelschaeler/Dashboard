export function ChatPlaceholder() {
  return (
    <section className="rounded-[2rem] bg-panel/82 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <p className="text-sm font-medium text-muted">KI-Chat kommt später</p>
      <input
        disabled
        placeholder="Nachricht"
        className="mt-4 w-full rounded-2xl bg-white/45 px-4 py-3 text-sm text-muted outline-none placeholder:text-muted/60 disabled:cursor-not-allowed"
      />
    </section>
  );
}
