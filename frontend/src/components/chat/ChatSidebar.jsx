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
  const { nextPartner } = useQueue();
  const canChat = queueStatus === SESSION_STATUS.MATCHED && !partnerDisconnected;

  return (
    <aside className={`glass-panel flex min-h-[28rem] flex-col overflow-hidden rounded-[2rem] ${expanded ? "lg:col-span-2" : ""}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cyan-200">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Live chat</h2>
            <p className="text-xs text-slate-400">Socket.io messages</p>
          </div>
        </div>
        <Badge variant={canChat ? "success" : partnerDisconnected ? "warning" : "default"}>
          {canChat ? "Connected" : partnerDisconnected ? "Disconnected" : "Waiting"}
        </Badge>
      </div>

      {partnerDisconnected ? (
        <div className="border-b border-white/10 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Partner disconnected. Start a new search when you are ready.
        </div>
      ) : null}

      <MessageList />

      {partnerDisconnected ? (
        <div className="border-t border-white/10 p-4">
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