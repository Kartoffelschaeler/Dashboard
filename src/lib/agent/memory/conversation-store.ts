import type { ChatMessage } from "@/types/chat";

export type ConversationStore = {
  messages: ChatMessage[];
};

export function createEmptyConversationStore(): ConversationStore {
  return { messages: [] };
}

// Future persistence can store thread history, tool calls, user corrections,
// and short summaries. No external storage is connected in this preparation step.
