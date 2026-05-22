import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquareText, Sparkles, Video } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import SearchPanel from "../components/chat/SearchPanel.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import VideoStage from "../components/video/VideoStage.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SESSION_STATUS } from "../utils/constants.js";
import { cn } from "../utils/helpers.js";

function IdleChat() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();

  const begin = async (mode) => {
    const queued = await startQueue(mode);
    if (queued) navigate("/chat");
  };

  return (
    <section className="chat-glow relative mx-auto flex min-h-screen max-w-5xl items-center px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <div className="liquid-panel relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-10">
        <div className="relative">
          <Badge variant="info">
            <Sparkles className="h-3.5 w-3.5" />
            No active room
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#1d1d1f] sm:text-6xl">Choose a room mode.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#6e6e73] sm:text-lg">Your browser will join the backend queue and wait for a matching socket.</p>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
          <Button size="lg" type="button" onClick={() => begin(CHAT_MODES.VIDEO)}>
            <Video className="h-5 w-5" />
            Start video
          </Button>
          <Button size="lg" type="button" variant="secondary" onClick={() => begin(CHAT_MODES.TEXT)}>
            <MessageSquareText className="h-5 w-5" />
            Start text
          </Button>
        </div>
      </div>
    </section>
  );
}

function TextRoomPanel() {
  const roomId = useAppStore((state) => state.roomId);
  const partnerId = useAppStore((state) => state.partnerId);

  return (
    <section className="liquid-panel hidden min-h-[34rem] rounded-[2rem] p-5 text-[#1d1d1f] lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
        <div>
          <p className="text-sm font-semibold text-[#0071e3]">Private room</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Text conversation</h1>
        </div>
        <Badge variant="dark">Socket room</Badge>
      </div>

      <div className="grid flex-1 content-center gap-3 py-6">
        <div className="liquid-card rounded-[1.25rem] p-4">
          <p className="text-sm text-[#6e6e73]">Room ID</p>
          <p className="mt-2 break-all font-mono text-sm text-[#1d1d1f]">{roomId || "pending"}</p>
        </div>
        <div className="liquid-card rounded-[1.25rem] p-4">
          <p className="text-sm text-[#6e6e73]">Partner socket</p>
          <p className="mt-2 break-all font-mono text-sm text-[#1d1d1f]">{partnerId || "pending"}</p>
        </div>
      </div>
    </section>
  );
}

export default function Chat() {
  const queueStatus = useAppStore((state) => state.queueStatus);
  const chatMode = useAppStore((state) => state.chatMode);
  const lastError = useAppStore((state) => state.lastError);

  if (queueStatus === SESSION_STATUS.SEARCHING) {
    return (
      <AppShell variant="marketing">
        <SearchPanel />
      </AppShell>
    );
  }

  if (queueStatus === SESSION_STATUS.IDLE || (queueStatus === SESSION_STATUS.ERROR && !lastError)) {
    return (
      <AppShell>
        <IdleChat />
      </AppShell>
    );
  }

  if (queueStatus === SESSION_STATUS.ERROR) {
    return (
      <AppShell>
        <section className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 pb-10 pt-24">
          <div className="liquid-panel w-full rounded-[2rem] p-6 text-center">
            <Badge variant="error">
              <AlertTriangle className="h-3.5 w-3.5" />
              Setup failed
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">Could not start the session.</h1>
            <p className="mt-4 text-[#6e6e73]">{lastError}</p>
          </div>
        </section>
      </AppShell>
    );
  }

  const isVideo = chatMode === CHAT_MODES.VIDEO;

  return (
    <AppShell>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "chat-glow chat-room-main relative mt-[52px] h-[calc(100dvh-52px)] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]",
          isVideo ? "facetime-room" : "mx-auto flex max-w-[92rem] flex-col px-3 py-3 sm:px-5"
        )}
      >
        <div
          className={cn(
            "relative z-10 grid min-h-0 flex-1",
            isVideo
              ? "h-full"
              : "gap-3 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.4fr)]"
          )}
        >
          {isVideo ? (
            <>
              <VideoStage />
              <ChatSidebar compact className="chat-facetime-panel" />
            </>
          ) : (
            <>
              <TextRoomPanel />
              <ChatSidebar expanded className="min-h-0" />
            </>
          )}
        </div>
      </motion.main>
    </AppShell>
  );
}
