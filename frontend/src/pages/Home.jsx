import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageSquareText, Mic, Sparkles, UserRound, Video, Wifi } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SOCKET_STATUS } from "../utils/constants.js";

const modes = [
  {
    mode: CHAT_MODES.VIDEO,
    label: "Video",
    helper: "Camera room",
    icon: Video,
  },
  {
    mode: CHAT_MODES.TEXT,
    label: "Text",
    helper: "Chat room",
    icon: MessageSquareText,
  },
];

function PreviewTile({ label, active = false }) {
  return (
    <div className="relative min-h-48 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),transparent_35%),linear-gradient(45deg,rgba(99,102,241,0.2),transparent_45%)]" />
      <div className="relative flex h-full min-h-48 flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-black/35 px-2.5 py-1 text-xs font-semibold text-white">{label}</span>
          {active ? <span className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.75)]" /> : null}
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-white">
          <UserRound className="h-8 w-8" />
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-white/35" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();
  const [startingMode, setStartingMode] = useState(null);
  const [selectedMode, setSelectedMode] = useState(CHAT_MODES.VIDEO);
  const socketStatus = useAppStore((state) => state.socketStatus);

  const begin = async (mode = selectedMode) => {
    setStartingMode(mode);
    const queued = await startQueue(mode);
    setStartingMode(null);
    if (queued) navigate("/chat");
  };

  const selected = modes.find((item) => item.mode === selectedMode);
  const SelectedIcon = selected?.icon || Video;
  const signalOnline = socketStatus === SOCKET_STATUS.CONNECTED;
  const signalLabel = signalOnline ? "online" : socketStatus === SOCKET_STATUS.CONNECTING ? "connecting" : "offline";
  const signalVariant = signalOnline ? "success" : socketStatus === SOCKET_STATUS.ERROR ? "error" : "warning";

  return (
    <AppShell>
      <main className="min-h-screen pt-16">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="media-panel overflow-hidden rounded-lg p-4 text-white sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <Badge variant="dark" className="border-white/20 bg-white/10">
                  <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                  Live lobby
                </Badge>
                <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Meet someone new, without the clutter.
                </h1>
              </div>
              <Badge variant={signalVariant}>
                <Wifi className="h-3.5 w-3.5" />
                {signalLabel}
              </Badge>
            </div>

            <div className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
              <PreviewTile label="Stranger" active />
              <div className="grid gap-3">
                <PreviewTile label="You" />
                <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-4 w-4 text-teal-300" />
                    Ready
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/10 p-3">
                      <Video className="h-4 w-4 text-teal-200" />
                      <p className="mt-2 text-xs text-slate-300">Camera</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <Mic className="h-4 w-4 text-indigo-200" />
                      <p className="mt-2 text-xs text-slate-300">Microphone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="surface-panel order-first rounded-lg p-5 lg:order-none"
          >
            <div>
              <p className="text-sm font-semibold text-slate-500">Omegal queue</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Start matching</h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              {modes.map(({ mode, label, icon: Icon }) => {
                const active = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-950">{selected?.label} match</p>
                  <p className="text-sm text-slate-500">{selected?.helper}</p>
                </div>
              </div>
            </div>

            <Button className="mt-5 w-full" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin()}>
              <SelectedIcon className="h-5 w-5" />
              {startingMode ? "Joining..." : `Start ${selected?.label.toLowerCase()}`}
            </Button>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {["Queue", "Room", "Peer"].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-3">
                  <p className="text-xs font-semibold text-slate-500">{item}</p>
                </div>
              ))}
            </div>
          </motion.aside>
        </section>
      </main>
    </AppShell>
  );
}
