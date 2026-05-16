import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import type { ChatMessage } from "@/types/chat";

const placeholderMessages: ChatMessage[] = [];

export function ChatLayout() {
  return (
    <section className="rounded-[2rem] bg-panel/82 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <MessageList messages={placeholderMessages} />
      <ChatInput />
    </section>
  );
}
