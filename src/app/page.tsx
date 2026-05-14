import { ChatPlaceholder } from "@/components/chat-placeholder";
import { ClockCard } from "@/components/clock-card";
import { ProtectedSection } from "@/components/protected-section";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ClockCard />
          <ProtectedSection />
        </section>

        <ChatPlaceholder />
      </div>
    </main>
  );
}
