import { MessageCircle, SkipForward } from "lucide-react";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import MessageComposer from "./MessageComposer.jsx";
import MessageList from "./MessageList.jsx";
import { useQueue } from "../../hooks/useQueue.js";
import { useAppStore } from "../../store/appStore.js";
import { SESSION_STATUS } from "../../utils/constants.js";

export default function ChatSidebar({ expanded = false }) {
  const queueStatus = useAppStore((state) => state.queueStatus);
  const partnerDisconnected = useAppStore((state) => state.partnerDisconnected);
  const messages = useAppStore((state) => state.messages);
  const { nextPartner } = useQueue();
  const canChat = queueStatus === SESSION_STATUS.MATCHED && !partnerDisconnected;

  return (
    <aside className={`surface-panel flex min-h-0 flex-col overflow-hidden rounded-lg ${expanded ? "lg:col-span-2" : ""}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-950">Room chat</h2>
            <p className="truncate text-xs text-slate-500">{messages.length} messages</p>
          </div>
        </div>
        <Badge variant={canChat ? "success" : partnerDisconnected ? "warning" : "default"}>
          {canChat ? "Connected" : partnerDisconnected ? "Ended" : "Waiting"}
        </Badge>
      </div>

      {partnerDisconnected ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Partner disconnected. You can start a fresh room.
        </div>
      ) : null}

      <MessageList />

      {partnerDisconnected ? (
        <div className="border-t border-slate-200 p-4">
          <Button className="w-full" type="button" onClick={nextPartner}>
            <SkipForward className="h-4 w-4" />
            Next partner
          </Button>
        </div>
      ) : (
        <MessageComposer disabled={!canChat} />
      )}
    </aside>
  );
}
