import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Globe2, MessageSquareText, ShieldCheck, Sparkles, Video } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { healthCheck } from "../services/api.js";
import { CHAT_MODES } from "../utils/constants.js";

const workspaceImage =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=2200&q=85";

const modeOptions = [
  {
    mode: CHAT_MODES.VIDEO,
    label: "Video room",
    helper: "Camera, microphone, peer media",
    icon: Video,
  },
  {
    mode: CHAT_MODES.TEXT,
    label: "Text room",
    helper: "Socket messages, no media prompt",
    icon: MessageSquareText,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();
  const [startingMode, setStartingMode] = useState(null);
  const [serverHealth, setServerHealth] = useState("checking");

  useEffect(() => {
    let mounted = true;
    healthCheck()
      .then(() => mounted && setServerHealth("online"))
      .catch(() => mounted && setServerHealth("offline"));
    return () => {
      mounted = false;
    };
  }, []);

  const begin = async (mode) => {
    setStartingMode(mode);
    const queued = await startQueue(mode);
    setStartingMode(null);
    if (queued) navigate("/chat");
  };

  const healthVariant = serverHealth === "online" ? "success" : serverHealth === "offline" ? "error" : "warning";

  return (
    <AppShell>
      <main className="min-h-screen pt-16">
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${workspaceImage})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.95),rgba(15,23,42,0.82)_48%,rgba(15,23,42,0.42))]" />

          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,0.55fr)] lg:px-8">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
              <Badge variant="dark" className="border-white/20 bg-white/10">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Stranger rooms, rebuilt for production
              </Badge>

              <h1 className="mt-6 text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">Omegal</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Join a random text or video room with a clean queue, strict signaling, and direct WebRTC media.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {modeOptions.map(({ mode, label, helper, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={Boolean(startingMode)}
                    onClick={() => begin(mode)}
                    className="group rounded-lg border border-white/20 bg-white/10 p-4 text-left text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950">
                        <Icon className="h-5 w-5" />
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-4 text-base font-semibold">{startingMode === mode ? "Starting..." : label}</div>
                    <div className="mt-1 text-sm text-slate-300">{helper}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-lg border border-white/20 bg-white/95 p-4 shadow-2xl shadow-slate-950/25"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Operations console</p>
                  <p className="mt-1 text-sm text-slate-500">Backend-aligned room flow</p>
                </div>
                <Badge variant={healthVariant}>
                  <Activity className="h-3.5 w-3.5" />
                  {serverHealth}
                </Badge>
              </div>

              <div className="grid gap-3 py-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Globe2 className="h-4 w-4 text-indigo-600" />
                    Queue
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">FIFO matchmaking with clean rejoin and next-partner handling.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    Room safety
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Participant-checked messages, offers, answers, and ICE candidates.</p>
                </div>
              </div>

              <Button className="w-full" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.VIDEO)}>
                <Video className="h-5 w-5" />
                Start video match
              </Button>
            </motion.aside>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
