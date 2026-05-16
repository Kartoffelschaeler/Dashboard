"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { ClockCard } from "@/components/dashboard/clock-card";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { ProtectedSection } from "@/components/dashboard/protected-section";

export function DashboardShell() {
  return (
    <DashboardProvider>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-5">
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <ClockCard />
            <ProtectedSection />
          </section>

          <ChatLayout />
        </div>
      </main>
    </DashboardProvider>
  );
}
