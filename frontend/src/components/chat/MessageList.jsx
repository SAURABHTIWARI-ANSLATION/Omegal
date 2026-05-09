import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { cn, formatTime } from "../../utils/helpers.js";

export default function MessageList() {
  const messages = useAppStore((state) => state.messages);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <MessagesSquare className="h-5 w-5" />
        </span>
        Say hello when your partner arrives.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const isMine = message.sender === "me";
          const isSystem = message.sender === "system";

          return (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={cn("flex", isMine ? "justify-end" : isSystem ? "justify-center" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6",
                  isMine && "bg-slate-950 text-white",
                  !isMine && !isSystem && "border border-slate-200 bg-white text-slate-900",
                  isSystem && "max-w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {!isSystem ? (
                  <div className={cn("mt-1 text-[10px] font-semibold uppercase", isMine ? "text-slate-300" : "text-slate-400")}>
                    {message.status === "sending" ? "Sending" : formatTime(message.timestamp)}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
