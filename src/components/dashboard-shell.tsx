"use client";

import { useEffect, useState } from "react";
import { ChatPlaceholder } from "@/components/chat-placeholder";
import { ClockCard } from "@/components/clock-card";
import { ProtectedSection } from "@/components/protected-section";

const storageKey = "dashboard-unlocked";

export function DashboardShell() {
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

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ClockCard isUnlocked={isUnlocked} />
          <ProtectedSection
            error={error}
            hasLoadedState={hasLoadedState}
            isChecking={isChecking}
            isUnlocked={isUnlocked}
            onUnlock={unlock}
          />
        </section>

        <ChatPlaceholder />
      </div>
    </main>
  );
}
