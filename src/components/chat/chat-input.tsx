import type { FormEvent } from "react";

type ChatInputProps = {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInput({
  disabled,
  value,
  onChange,
  onSubmit,
}: ChatInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Nachricht"
        className="w-full rounded-2xl bg-white/45 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted/60 disabled:cursor-not-allowed disabled:text-muted"
      />
    </form>
  );
}
