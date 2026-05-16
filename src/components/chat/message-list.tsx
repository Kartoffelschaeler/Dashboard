import type { ChatMessage } from "@/types/chat";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-sm font-medium text-muted">KI-Chat kommt später</div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <p key={message.id} className="text-sm leading-6 text-foreground">
          {message.content}
        </p>
      ))}
    </div>
  );
}
