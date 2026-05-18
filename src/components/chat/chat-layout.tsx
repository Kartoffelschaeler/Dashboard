"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { ChatMessage } from "@/types/chat";
import { useMemo, useState } from "react";

type AgentResponse = {
  assistantMessage?: string;
  executedTools?: Array<{ status?: string; success: boolean; toolName: string }>;
  toolCalls?: Array<{ name: string; status: string }>;
  warnings?: string[];
  error?: string;
};

export function ChatLayout() {
  const { isUnlocked, refreshCalendar, refreshTasks } = useDashboard();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<AgentResponse["toolCalls"]>([]);
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  async function sendMessage() {
    const content = input.trim();

    if (!content || isLoading || !isUnlocked) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const recentMessages = messages.slice(-8);

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setToolCalls([]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          messages: recentMessages,
          conversationId,
        }),
      });
      const data = (await response.json()) as AgentResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Agent konnte nicht antworten.");
      }

      const executedTools =
        data.executedTools ??
        data.toolCalls?.map((toolCall) => ({
          toolName: toolCall.name,
          success: toolCall.status === "success",
          status: toolCall.status,
        })) ??
        [];

      if (
        executedTools.some(
          (toolCall) =>
            toolCall.toolName === "tasks.createTask" && toolCall.success,
        )
      ) {
        refreshTasks();
      }

      if (
        executedTools.some(
          (toolCall) =>
            toolCall.toolName === "calendar.createEvent" && toolCall.success,
        )
      ) {
        refreshCalendar();
      }

      setToolCalls(data.toolCalls ?? []);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.assistantMessage ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Agent konnte nicht antworten.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] bg-panel/82 p-5 shadow-[0_18px_50px_rgba(97,66,42,0.10)] backdrop-blur sm:p-6">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        toolCalls={toolCalls}
      />
      {error ? (
        <p className="mt-3 rounded-2xl bg-panel-soft/60 px-3 py-2 text-xs leading-5 text-accent-strong">
          {error}
        </p>
      ) : null}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        disabled={!isUnlocked || isLoading}
      />
    </section>
  );
}
