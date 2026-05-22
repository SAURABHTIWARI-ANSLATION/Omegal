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
        "min-h-0 flex-1 overscroll-contain overflow-y-auto overflow-x-hidden bg-black/10 [overflow-anchor:none]",
        compact ? "px-2 py-2 sm:px-3 sm:py-3" : "px-3 py-3 sm:px-4 sm:py-4"
      )}
    >
      {messages.length === 0 ? (
        <div className={cn("flex min-h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(96,165,250,0.12),transparent_32%)] px-4 text-center text-sm leading-6 text-white/45", compact && "text-xs leading-5")}>
          <span className={cn("liquid-icon mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white/70", compact && "mb-2 h-9 w-9")}>
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
                      "min-w-[4.75rem] rounded-lg text-sm leading-6 shadow-sm",
                      compact ? "max-w-[min(90%,34rem)] px-3 py-2" : "max-w-[min(84%,34rem)] px-3.5 py-2.5 sm:px-4 sm:py-3",
                      isMine && "border border-cyan-200/18 bg-cyan-200/18 text-white shadow-cyan-950/20 backdrop-blur-xl",
                      !isMine && !isSystem && "border border-white/14 bg-white/12 text-white/90 backdrop-blur-xl",
                      isSystem && "max-w-full border border-white/12 bg-white/[0.08] px-3 py-2 text-xs text-white/52 backdrop-blur-xl"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
                    {!isSystem ? (
                      <div className={cn("mt-1 min-h-3.5 text-[10px] font-semibold uppercase", isMine ? "text-cyan-50/58" : "text-white/36")}>
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
