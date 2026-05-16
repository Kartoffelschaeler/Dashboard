"use client";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import { UnlockCard } from "@/components/dashboard/unlock-card";
import { CentralPanel } from "@/components/tasks/central-panel";

export function ProtectedSection() {
  const { error, hasLoadedState, isChecking, isUnlocked, unlock } =
    useDashboard();

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

  return <CentralPanel />;
}
