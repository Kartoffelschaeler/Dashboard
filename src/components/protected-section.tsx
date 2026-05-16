"use client";

import { CentralPanel } from "@/components/central-panel";
import { UnlockCard } from "@/components/unlock-card";

type ProtectedSectionProps = {
  error: string | null;
  hasLoadedState: boolean;
  isChecking: boolean;
  isUnlocked: boolean;
  onUnlock: (password: string) => Promise<void>;
};

export function ProtectedSection({
  error,
  hasLoadedState,
  isChecking,
  isUnlocked,
  onUnlock,
}: ProtectedSectionProps) {
  if (!hasLoadedState) {
    return (
      <article className="min-h-72 rounded-[2rem] bg-panel/88 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6" />
    );
  }

  if (!isUnlocked) {
    return (
      <UnlockCard error={error} isChecking={isChecking} onSubmit={onUnlock} />
    );
  }

  return <CentralPanel />;
}
