import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useChat } from "../../hooks/useChat.js";
import { cn } from "../../utils/helpers.js";

export default function MessageComposer({ compact = false, disabled }) {
  const [value, setValue] = useState("");
  const { sendMessage } = useChat();

  const submit = () => {
    const sent = sendMessage(value);
    if (sent) setValue("");
  };

  return (
    <form
      className={cn(
        "safe-bottom shrink-0 border-t border-white/10 bg-white/[0.03]",
        compact ? "p-1.5 [--safe-bottom-padding:0.375rem] sm:p-2.5" : "p-2.5 [--safe-bottom-padding:0.75rem] sm:p-3"
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className={cn("flex min-w-0 items-end gap-2 rounded-full border border-white/16 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl focus-within:border-cyan-200/35", compact ? "p-1.5" : "p-2")}>
        <textarea
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder={disabled ? "Connect with a partner to chat" : "Write a message"}
          className={cn(
            "min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-sm text-white outline-none placeholder:text-white/36 disabled:cursor-not-allowed",
            compact ? "h-9 px-2.5 py-1.5 sm:h-10 sm:py-2" : "h-11 px-3 py-2.5"
          )}
        />
        <Button type="submit" size="icon" className={cn("shrink-0", compact && "h-9 w-9 sm:h-10 sm:w-10")} disabled={disabled || !value.trim()} aria-label="Send message">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
