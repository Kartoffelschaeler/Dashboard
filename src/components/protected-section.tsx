"use client";

import { useEffect, useState } from "react";
import { CalendarPanel } from "@/components/calendar-panel";
import { TodoPanel } from "@/components/todo-panel";
import { UnlockCard } from "@/components/unlock-card";

const storageKey = "dashboard-unlocked";

export function ProtectedSection() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasLoadedState, setHasLoadedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(window.localStorage.getItem(storageKey) === "true");
      setHasLoadedState(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function unlock(password: string) {
    if (!password || isChecking) {
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const isValid = (await response.json()) === true;

      if (isValid) {
        window.localStorage.setItem(storageKey, "true");
        setIsUnlocked(true);
        return;
      }

      if (response.status === 503) {
        setError("Passwortschutz ist noch nicht konfiguriert.");
      } else {
        setError("Passwort falsch");
      }
    } catch {
      setError("Passwort falsch");
    } finally {
      setIsChecking(false);
    }
  }

  if (!hasLoadedState) {
    return (
      <article className="min-h-72 rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6" />
    );
  }

  if (!isUnlocked) {
    return (
      <UnlockCard error={error} isChecking={isChecking} onSubmit={unlock} />
    );
  }

  return (
    <section className="grid gap-5">
      <TodoPanel />
      <CalendarPanel />
    </section>
  );
}
