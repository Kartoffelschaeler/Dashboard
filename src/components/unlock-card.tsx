"use client";

import { LockKeyhole } from "lucide-react";
import type { FormEvent } from "react";

type UnlockCardProps = {
  error: string | null;
  isChecking: boolean;
  onSubmit: (password: string) => void;
};

export function UnlockCard({ error, isChecking, onSubmit }: UnlockCardProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    onSubmit(password);
  }

  return (
    <article className="rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">
          Geschützter Bereich
        </p>
        <LockKeyhole size={18} className="text-muted" aria-hidden="true" />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Passwort"
          disabled={isChecking}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white/72 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isChecking}
          className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(156,99,62,0.18)] transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/35 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-accent"
        >
          Entsperren
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-accent-strong">{error}</p>
      ) : null}
    </article>
  );
}
