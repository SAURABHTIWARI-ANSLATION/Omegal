import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, LockKeyhole, MessageSquareText, Radio, Video } from "lucide-react";
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
    <section className="mx-auto flex min-h-screen max-w-5xl items-center px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="surface-panel relative w-full overflow-hidden rounded-lg p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(20,184,166,0.12),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(99,102,241,0.12),transparent_28%)]" />
        <div className="relative">
          <Badge variant="info">No active room</Badge>
          <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">Choose a room mode.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Your browser will join the backend queue and wait for a matching socket.</p>
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
    <section className="media-panel hidden min-h-[34rem] rounded-lg p-5 text-white lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-sm font-semibold text-teal-200">Private room</p>
          <h1 className="mt-2 text-3xl font-bold">Text conversation</h1>
        </div>
        <Badge variant="dark">Socket room</Badge>
      </div>

      <div className="grid flex-1 content-center gap-3 py-6">
        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
          <p className="text-sm text-slate-400">Room ID</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-100">{roomId || "pending"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
          <p className="text-sm text-slate-400">Partner socket</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-100">{partnerId || "pending"}</p>
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
        <section className="mx-auto flex min-h-screen max-w-3xl items-center px-4 pt-24 pb-10">
          <div className="surface-panel w-full rounded-lg p-6 text-center">
            <Badge variant="error">
              <AlertTriangle className="h-3.5 w-3.5" />
              Setup failed
            </Badge>
            <h1 className="mt-5 text-4xl font-bold text-slate-950">Could not start the session.</h1>
            <p className="mt-4 text-slate-600">{lastError}</p>
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
        className="chat-room-main relative mx-auto mt-16 flex h-[calc(100dvh-4rem)] max-w-[92rem] flex-col overflow-hidden px-2 pt-2 pb-2 sm:px-5 sm:pt-3 sm:pb-3 lg:px-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(circle_at_18%_0%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_82%_15%,rgba(99,102,241,0.16),transparent_30%)]" />

        <div className="mobile-room-summary mb-2 shrink-0 rounded-lg border border-slate-200/80 bg-white/86 p-2.5 shadow-sm backdrop-blur-xl sm:mb-3 sm:p-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant={isVideo ? "info" : "success"}>{isVideo ? "Video mode" : "Text mode"}</Badge>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <Activity className="h-3.5 w-3.5" />
                  Live room
                </span>
              </div>
              <h1 className="mobile-room-title mt-1.5 truncate text-lg font-black tracking-normal text-slate-950 sm:text-2xl">Private stranger room</h1>
            </div>

            <div className="hidden grid-cols-2 gap-2 text-xs font-semibold text-slate-600 sm:grid md:flex">
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <LockKeyhole className="h-3.5 w-3.5 text-teal-600" />
                Isolated room
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Radio className="h-3.5 w-3.5 text-indigo-600" />
                Realtime signal
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid min-h-0 flex-1",
            isVideo
              ? "chat-video-layout"
              : "gap-3 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.4fr)]"
          )}
        >
          {isVideo ? <VideoStage /> : <TextRoomPanel />}
          <ChatSidebar compact={isVideo} expanded={!isVideo} className={isVideo ? "min-h-0" : ""} />
        </div>
      </motion.main>
    </AppShell>
  );
}
