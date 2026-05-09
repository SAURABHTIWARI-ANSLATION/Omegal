import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquareText, Video } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import SearchPanel from "../components/chat/SearchPanel.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import VideoStage from "../components/video/VideoStage.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SESSION_STATUS } from "../utils/constants.js";

function IdleChat() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();

  const begin = async (mode) => {
    const queued = await startQueue(mode);
    if (queued) navigate("/chat");
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl items-center px-4 pt-24 pb-10 sm:px-6 lg:px-8">
      <div className="surface-panel w-full rounded-lg p-5 sm:p-8">
        <Badge variant="info">No active room</Badge>
        <h1 className="mt-5 text-4xl font-bold text-slate-950 sm:text-5xl">Choose a room mode.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Your browser will join the backend queue and wait for a matching socket.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
        className="mx-auto mt-16 flex h-[calc(100vh-4rem)] max-w-7xl flex-col overflow-hidden px-4 pt-3 pb-3 sm:px-6 lg:px-8"
      >
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant={isVideo ? "info" : "success"}>{isVideo ? "Video mode" : "Text mode"}</Badge>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Live room</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">Matched sockets stay isolated inside a backend room until either user moves on.</p>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.34fr)]">
          {isVideo ? <VideoStage /> : <TextRoomPanel />}
          <ChatSidebar expanded={!isVideo} />
        </div>
      </motion.main>
    </AppShell>
  );
}
