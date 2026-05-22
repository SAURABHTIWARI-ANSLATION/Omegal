import { useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { cn, formatTime } from "../../utils/helpers.js";

export default function MessageList({ compact = false }) {
  const messages = useAppStore((state) => state.messages);
  const listRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    if (messages.length === 0) {
      shouldStickToBottomRef.current = true;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const shouldScroll = shouldStickToBottomRef.current || lastMessage?.sender === "me";
    if (!shouldScroll) return;

    list.scrollTop = list.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 96;
  };

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      className={cn(
        "chat-message-list min-h-0 flex-1 overscroll-contain overflow-y-auto overflow-x-hidden bg-white/[0.35] [overflow-anchor:none]",
        compact ? "px-2 py-2 sm:px-3 sm:py-3" : "px-3 py-3 sm:px-4 sm:py-4"
      )}
    >
      {messages.length === 0 ? (
        <div className={cn("chat-empty-state flex min-h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(0,113,227,0.08),transparent_34%)] px-4 text-center text-sm leading-6 text-[#62626c]", compact && "text-xs leading-5")}>
          <span className={cn("liquid-icon mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-[#0071e3]", compact && "mb-2 h-9 w-9")}>
            <MessagesSquare className="h-5 w-5" />
          </span>
          Say hello when your partner arrives.
        </div>
      ) : (
        <div className={cn(compact ? "space-y-2.5" : "space-y-3")}>
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isMine = message.sender === "me";
              const isSystem = message.sender === "system";

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn("flex min-w-0", isMine ? "justify-end" : isSystem ? "justify-center" : "justify-start")}
                >
                  <div
                    className={cn(
                      "chat-bubble min-w-[4.75rem] text-sm leading-6 shadow-sm",
                      compact ? "max-w-[min(90%,34rem)] px-3 py-2" : "max-w-[min(84%,34rem)] px-3.5 py-2.5 sm:px-4 sm:py-3",
                      isMine && "rounded-[18px_18px_4px_18px] bg-[#0071e3] text-white shadow-[0_8px_24px_rgba(0,113,227,0.18)]",
                      !isMine && !isSystem && "rounded-[18px_18px_18px_4px] bg-black/[0.06] text-[#111115]",
                      isSystem && "max-w-full rounded-full border border-black/[0.06] bg-white/[0.80] px-3 py-2 text-xs text-[#62626c] backdrop-blur-xl"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
                    {!isSystem ? (
                      <div className={cn("mt-1 min-h-3.5 text-[10px] font-semibold uppercase", isMine ? "text-white/[0.70]" : "text-[#86868b]")}>
                        {message.status === "sending" ? "Sending" : formatTime(message.timestamp)}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
