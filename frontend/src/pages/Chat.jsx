import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareText, Video } from "lucide-react";
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
    <section className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10">
      <div className="max-w-2xl text-center">
        <Badge variant="info">No active room</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Start a random chat.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">Choose text or video to join the backend queue and wait for a match.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => begin(CHAT_MODES.VIDEO)}>
            <Video className="h-4 w-4" />
            Start video
          </Button>
          <Button type="button" variant="secondary" onClick={() => begin(CHAT_MODES.TEXT)}>
            <MessageSquareText className="h-4 w-4" />
            Start text
          </Button>
        </div>
      </div>
    </section>
  );
}

function TextRoomPanel() {
  return (
    <section className="glass-panel hidden min-h-[34rem] flex-col justify-between rounded-[2rem] p-8 lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Private room</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Text conversation</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
          Messages are sent with send_message and confirmed by message_sent. Incoming partner messages appear instantly from receive_message.
        </p>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
        If your partner leaves, the partner_disconnected event closes the room and reveals the Next button.
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
      <AppShell>
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
        <section className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10">
          <div className="max-w-xl text-center">
            <Badge variant="error">Setup failed</Badge>
            <h1 className="mt-5 text-4xl font-semibold text-white">Could not start the session.</h1>
            <p className="mt-4 text-slate-300">{lastError}</p>
          </div>
        </section>
      </AppShell>
    );
  }

  const isVideo = chatMode === CHAT_MODES.VIDEO;

  return (
    <AppShell>
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pt-24 pb-6 sm:px-6 lg:px-8"
      >
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.36fr)]">
          {isVideo ? <VideoStage /> : <TextRoomPanel />}
          <ChatSidebar expanded={!isVideo} />
        </div>
      </motion.main>
    </AppShell>
  );
}