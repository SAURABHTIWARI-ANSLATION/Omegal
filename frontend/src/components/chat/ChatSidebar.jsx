import { MessageCircle, SkipForward } from "lucide-react";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import MessageComposer from "./MessageComposer.jsx";
import MessageList from "./MessageList.jsx";
import { useQueue } from "../../hooks/useQueue.js";
import { useAppStore } from "../../store/appStore.js";
import { SESSION_STATUS } from "../../utils/constants.js";
import { cn } from "../../utils/helpers.js";

export default function ChatSidebar({ compact = false, expanded = false, className }) {
  const queueStatus = useAppStore((state) => state.queueStatus);
  const partnerDisconnected = useAppStore((state) => state.partnerDisconnected);
  const isSwitchingPartner = useAppStore((state) => state.isSwitchingPartner);
  const messages = useAppStore((state) => state.messages);
  const { nextPartner } = useQueue();
  const canChat = queueStatus === SESSION_STATUS.MATCHED && !partnerDisconnected;
  const nextDisabled = isSwitchingPartner || queueStatus === SESSION_STATUS.SEARCHING;

  return (
    <aside className={cn("surface-panel flex min-h-0 flex-col overflow-hidden rounded-lg", expanded && "lg:col-span-2", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-white via-white to-teal-50/70",
          compact ? "px-2.5 py-2 sm:px-3 sm:py-2.5" : "px-3 py-2.5 sm:px-5 sm:py-3"
        )}
      >
        <div className={cn("flex min-w-0 items-center", compact ? "gap-2" : "gap-3")}>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]",
              compact ? "h-9 w-9" : "h-10 w-10"
            )}
          >
            <MessageCircle className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-950">Room chat</h2>
            <p className={cn("truncate text-xs text-slate-500", compact && "max-sm:hidden")}>{messages.length} messages in this room</p>
          </div>
        </div>
        <Badge variant={canChat ? "success" : partnerDisconnected ? "warning" : "default"} className={cn(compact && "px-2 py-0.5")}>
          {canChat ? "Connected" : partnerDisconnected ? "Ended" : "Waiting"}
        </Badge>
      </div>

      {partnerDisconnected ? (
        <div className={cn("border-b border-amber-200 bg-amber-50 text-sm text-amber-800", compact ? "px-3 py-2" : "px-4 py-2.5")}>
          Partner disconnected. You can start a fresh room.
        </div>
      ) : null}

      <MessageList compact={compact} />

      {partnerDisconnected ? (
        <div className={cn("border-t border-slate-200 bg-slate-50/80", compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4")}>
          <Button className="w-full" type="button" onClick={nextPartner} disabled={nextDisabled}>
            <SkipForward className="h-4 w-4" />
            {nextDisabled ? "Searching..." : "Next partner"}
          </Button>
        </div>
      ) : (
        <MessageComposer compact={compact} disabled={!canChat} />
      )}
    </aside>
  );
}
