import type { ChatMessage } from "@/types/chat";

type MessageListProps = {
  messages: ChatMessage[];
  isLoading?: boolean;
  toolCalls?: Array<{ name: string; status: string }>;
};

export function MessageList({ messages, isLoading, toolCalls }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-sm font-medium text-muted">
        Frag nach Aufgaben oder Terminen.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <p
          key={message.id}
          className={`max-w-3xl rounded-2xl px-3 py-2 text-sm leading-6 ${
            message.role === "user"
              ? "ml-auto bg-white/42 text-foreground"
              : "bg-panel-soft/44 text-foreground"
          }`}
        >
          {message.content}
        </p>
      ))}
      {toolCalls?.length ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {toolCalls.map((toolCall) => (
            <span
              key={`${toolCall.name}-${toolCall.status}`}
              className="rounded-full bg-white/30 px-2.5 py-1 text-[11px] text-muted"
            >
              {toolCall.name}
            </span>
          ))}
        </div>
      ) : null}
      {isLoading ? (
        <p className="rounded-2xl bg-panel-soft/34 px-3 py-2 text-sm text-muted">
          Denke kurz nach...
        </p>
      ) : null}
    </div>
  );
}
