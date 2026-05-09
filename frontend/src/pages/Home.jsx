import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  LockKeyhole,
  MessageSquareText,
  Mic,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
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
    title: "Video room",
    helper: "Camera, microphone, peer media",
    icon: Video,
  },
  {
    mode: CHAT_MODES.TEXT,
    label: "Text",
    title: "Text room",
    helper: "Socket messages, no media prompt",
    icon: MessageSquareText,
  },
];

const featureCards = [
  {
    icon: Users,
    title: "Queue",
    description: "FIFO matchmaking with clean rejoin and next-partner handling.",
    accent: "text-teal-700 bg-teal-50 border-teal-100",
  },
  {
    icon: ShieldCheck,
    title: "Room safety",
    description: "Participant-checked messages, offers, answers, and ICE candidates.",
    accent: "text-indigo-700 bg-indigo-50 border-indigo-100",
  },
  {
    icon: Video,
    title: "Direct WebRTC media",
    description: "Camera, microphone, peer media",
    accent: "text-sky-700 bg-sky-50 border-sky-100",
  },
  {
    icon: MessageSquareText,
    title: "Text room",
    description: "Socket messages, no media prompt",
    accent: "text-rose-700 bg-rose-50 border-rose-100",
  },
];

const flowSteps = [
  {
    icon: Users,
    title: "Queue",
    description: "A clean waiting state keeps users eligible until a real peer is ready.",
  },
  {
    icon: Route,
    title: "Room",
    description: "Backend-aligned room flow keeps socket events scoped to the right room.",
  },
  {
    icon: Radio,
    title: "Peer",
    description: "Strict signaling moves offers, answers, and ICE candidates only between participants.",
  },
];

function BackgroundGrid() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" aria-hidden="true">
      <defs>
        <pattern id="home-grid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="1" />
        </pattern>
        <linearGradient id="home-fade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(20,184,166,0.22)" />
          <stop offset="50%" stopColor="rgba(99,102,241,0.12)" />
          <stop offset="100%" stopColor="rgba(244,63,94,0.08)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#home-grid)" />
      <path d="M0 120 C180 40 310 250 510 140 S840 20 1080 150 1360 180 1530 80" fill="none" stroke="url(#home-fade)" strokeWidth="80" />
    </svg>
  );
}

function SignalIllustration() {
  return (
    <svg viewBox="0 0 420 250" className="h-full min-h-56 w-full" role="img" aria-label="Omegal queue room peer visual">
      <defs>
        <linearGradient id="signal-card" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="signal-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="52%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <pattern id="signal-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="rgba(255,255,255,0.16)" />
        </pattern>
      </defs>
      <rect x="8" y="8" width="404" height="234" rx="10" fill="url(#signal-card)" />
      <rect x="8" y="8" width="404" height="234" rx="10" fill="url(#signal-dots)" />
      <path d="M72 128 C132 58 195 200 256 124 S334 63 367 113" fill="none" stroke="url(#signal-line)" strokeWidth="6" strokeLinecap="round" />
      {[
        ["Queue", 70, 130, "#14b8a6"],
        ["Room", 214, 141, "#6366f1"],
        ["Peer", 356, 112, "#f43f5e"],
      ].map(([label, cx, cy, color]) => (
        <g key={label}>
          <circle cx={cx} cy={cy} r="28" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="10" fill={color} />
          <text x={cx} y={cy + 51} fill="#e2e8f0" fontSize="15" fontWeight="700" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <rect x="44" y="34" width="112" height="38" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.16)" />
      <text x="66" y="58" fill="#f8fafc" fontSize="13" fontWeight="700">
        Signal online
      </text>
      <rect x="254" y="184" width="120" height="34" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.16)" />
      <text x="276" y="206" fill="#f8fafc" fontSize="13" fontWeight="700">
        Private room
      </text>
    </svg>
  );
}

function PreviewTile({ label, active = false, tone = "teal" }) {
  const toneClass =
    tone === "rose"
      ? "from-rose-500/25 via-slate-900 to-indigo-500/15"
      : "from-teal-400/25 via-slate-900 to-indigo-500/20";

  return (
    <div className="relative min-h-48 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <div className={`absolute inset-0 bg-gradient-to-br ${toneClass}`} />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_18px)]" />
      <div className="relative flex h-full min-h-48 flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-black/35 px-2.5 py-1 text-xs font-semibold text-white">{label}</span>
          {active ? <span className="h-2.5 w-2.5 rounded-sm bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.75)]" /> : null}
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white">
          <UserRound className="h-8 w-8" />
        </div>
        <div className="h-2 rounded-md bg-white/10">
          <div className="h-full w-2/3 rounded-md bg-white/35" />
        </div>
      </div>
    </div>
  );
}

function RoomPreview({ signalLabel, signalVariant }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="media-panel overflow-hidden rounded-lg p-4 text-white sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <Badge variant="dark" className="border-white/20 bg-white/10">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            Live lobby
          </Badge>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Clean stranger rooms, ready for video or text.</h2>
        </div>
        <Badge variant={signalVariant}>
          <Wifi className="h-3.5 w-3.5" />
          {signalLabel}
        </Badge>
      </div>

      <div className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.85fr)]">
        <PreviewTile label="Stranger" active />
        <div className="grid gap-3">
          <PreviewTile label="You" tone="rose" />
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

      <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        {["Queue", "Room", "Peer"].map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-3">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-teal-300" />
              <p className="text-sm font-semibold">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StartPanel({ selectedMode, setSelectedMode, startingMode, begin }) {
  const selected = modes.find((item) => item.mode === selectedMode);
  const SelectedIcon = selected?.icon || Video;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04 }}
      className="surface-panel rounded-lg p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Omegal queue</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Start matching</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Zap className="h-5 w-5" />
        </span>
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

      <div className="mt-5 grid gap-3">
        {modes.map(({ mode, title, helper, icon: Icon }) => {
          const active = selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setSelectedMode(mode)}
              className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                active ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="text-sm text-slate-500">{helper}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button className="mt-5 w-full" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin()}>
        <SelectedIcon className="h-5 w-5" />
        {startingMode ? "Joining..." : `Start ${selected?.label.toLowerCase()} match`}
      </Button>

      <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
          <LockKeyhole className="h-4 w-4" />
          Private signaling
        </div>
        <p className="mt-2 text-sm leading-6 text-teal-900/75">Room events stay scoped to matched participants.</p>
      </div>
    </motion.aside>
  );
}

function FeatureCard({ icon: Icon, title, description, accent }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-lg"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600">{description}</p>
    </motion.div>
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

  const signalOnline = socketStatus === SOCKET_STATUS.CONNECTED;
  const signalLabel = signalOnline ? "online" : socketStatus === SOCKET_STATUS.CONNECTING ? "connecting" : "offline";
  const signalVariant = signalOnline ? "success" : socketStatus === SOCKET_STATUS.ERROR ? "error" : "warning";

  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden pt-16">
        <section className="relative border-b border-slate-200/80">
          <BackgroundGrid />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8">
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-3xl">
                <Badge variant="info" className="border-indigo-200 bg-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Stranger rooms, rebuilt for production
                </Badge>
                <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Meet someone new, without the clutter.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  Join a random text or video room with a clean queue, strict signaling, and direct WebRTC media.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.VIDEO)}>
                    <Video className="h-5 w-5" />
                    {startingMode === CHAT_MODES.VIDEO ? "Joining..." : "Start video match"}
                  </Button>
                  <Button variant="secondary" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.TEXT)}>
                    <MessageSquareText className="h-5 w-5" />
                    {startingMode === CHAT_MODES.TEXT ? "Joining..." : "Start text match"}
                  </Button>
                </div>
              </motion.div>

              <RoomPreview signalLabel={signalLabel} signalVariant={signalVariant} />
            </div>

            <StartPanel selectedMode={selectedMode} setSelectedMode={setSelectedMode} startingMode={startingMode} begin={begin} />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div className="space-y-5">
            <Badge variant="success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Backend-aligned room flow
            </Badge>
            <div>
              <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">The front page now shows how Omegal actually works.</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Every block explains the product with the same core content: queue, room safety, WebRTC media, and socket messages.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-2 shadow-lg">
              <SignalIllustration />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white/70">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <Badge variant="default">
                  <Route className="h-3.5 w-3.5" />
                  Room lifecycle
                </Badge>
                <h2 className="mt-4 text-3xl font-bold text-slate-950">Queue to room to peer, without confusing states.</h2>
              </div>
              <p className="max-w-xl leading-8 text-slate-600">
                The interface mirrors the backend flow so users always understand what is happening before the match starts.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {flowSteps.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{description}</p>
                  {index < flowSteps.length - 1 ? (
                    <div className="pointer-events-none absolute -right-3 top-9 hidden h-px w-6 bg-gradient-to-r from-teal-400 to-indigo-400 lg:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="media-panel grid gap-8 overflow-hidden rounded-lg p-6 text-white md:grid-cols-[minmax(0,0.78fr)_minmax(18rem,0.55fr)] md:p-8">
            <div>
              <Badge variant="dark" className="border-white/20 bg-white/10">
                <Wifi className="h-3.5 w-3.5 text-teal-300" />
                Signal online
              </Badge>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Start matching with a clear, premium room experience.</h2>
              <p className="mt-4 max-w-2xl leading-8 text-slate-300">
                Pick video or text, enter the Omegal queue, and move into a private room when a peer is ready.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button variant="success" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.VIDEO)}>
                  <Video className="h-5 w-5" />
                  Start video match
                </Button>
                <Button variant="subtle" size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.TEXT)}>
                  <MessageSquareText className="h-5 w-5" />
                  Start text match
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <div className="grid gap-3">
                {["Clean queue", "Strict signaling", "Direct WebRTC media"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
                    <span className="text-sm font-semibold">{item}</span>
                    <ArrowRight className="h-4 w-4 text-teal-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
