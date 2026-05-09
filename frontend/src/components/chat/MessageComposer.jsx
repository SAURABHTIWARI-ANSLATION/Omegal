import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useChat } from "../../hooks/useChat.js";

export default function MessageComposer({ disabled }) {
  const [value, setValue] = useState("");
  const { sendMessage } = useChat();

  const submit = () => {
    const sent = sendMessage(value);
    if (sent) setValue("");
  };

  return (
    <div className="border-t border-white/10 p-3 sm:p-4">
      <div className="flex items-end gap-2 rounded-[1.7rem] border border-white/10 bg-slate-950/80 p-2 focus-within:border-cyan-300/45 focus-within:shadow-[0_0_0_4px_rgba(103,232,249,0.08)]">
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
          placeholder={disabled ? "Connect with a partner to chat" : "Write a message"}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
        />
        <Button type="button" size="icon" disabled={disabled || !value.trim()} onClick={submit} aria-label="Send message">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}