import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm leading-6 text-slate-400">
        Say hello when your partner arrives. Messages are delivered through the active Socket.io room.
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
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={cn("flex", isMine ? "justify-end" : isSystem ? "justify-center" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6",
                  isMine && "rounded-br-md bg-cyan-300 text-slate-950",
                  !isMine && !isSystem && "rounded-bl-md bg-white/10 text-slate-100",
                  isSystem && "max-w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {!isSystem ? (
                  <div className={cn("mt-1 text-[10px] uppercase tracking-[0.18em]", isMine ? "text-slate-700" : "text-slate-500")}>
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