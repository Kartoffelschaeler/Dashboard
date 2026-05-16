export function ChatInput() {
  return (
    <input
      disabled
      placeholder="Nachricht"
      className="mt-4 w-full rounded-2xl bg-white/45 px-4 py-3 text-sm text-muted outline-none placeholder:text-muted/60 disabled:cursor-not-allowed"
    />
  );
}
