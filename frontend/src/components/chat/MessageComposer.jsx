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
    <div className="shrink-0 border-t border-slate-200 p-3">
      <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
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
          className="max-h-20 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <Button type="button" size="icon" disabled={disabled || !value.trim()} onClick={submit} aria-label="Send message">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
