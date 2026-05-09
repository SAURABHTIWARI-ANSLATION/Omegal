import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Mic,
  Play,
  Quote,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SOCKET_STATUS } from "../utils/constants.js";

const avatars = [
  { name: "Maya", location: "Berlin", src: "/assets/avatars/maya.svg", tone: "bg-teal-300" },
  { name: "Akira", location: "Tokyo", src: "/assets/avatars/akira.svg", tone: "bg-indigo-300" },
  { name: "Noah", location: "Austin", src: "/assets/avatars/noah.svg", tone: "bg-rose-300" },
  { name: "Zara", location: "Dubai", src: "/assets/avatars/zara.svg", tone: "bg-amber-300" },
];

const modes = [
  {
    mode: CHAT_MODES.VIDEO,
    label: "Video match",
    title: "Video room",
    description: "Camera, microphone, peer media",
    icon: Video,
  },
  {
    mode: CHAT_MODES.TEXT,
    label: "Text match",
    title: "Text room",
    description: "Socket messages, no media prompt",
    icon: MessageSquareText,
  },
];

const proofItems = [
  { value: "Live", label: "real-time room matching" },
  { value: "1:1", label: "private peer sessions" },
  { value: "4", label: "safety checks in the room flow" },
  { value: "0", label: "feed, noise, or timeline clutter" },
];

const storyPanels = [
  {
    eyebrow: "Social discovery",
    title: "A cinematic first impression for meeting someone new.",
    body: "Omegal is shaped around a single emotional moment: click, wait, connect. The page now makes that feel premium before the first room starts.",
    points: ["Fake active users show presence", "Video-call mockups explain the product", "Mode choices stay conversion-ready"],
    icon: Users,
    visual: "people",
  },
  {
    eyebrow: "Realtime architecture",
    title: "Backend-aligned room flow, shown as product storytelling.",
    body: "Queue, room, and peer states are presented visually so the marketing site matches the actual socket and WebRTC behavior.",
    points: ["FIFO matchmaking", "Clean rejoin handling", "Direct WebRTC media"],
    icon: Route,
    visual: "flow",
  },
  {
    eyebrow: "Trust layer",
    title: "Safety and privacy feel visible, not hidden in a footer.",
    body: "Participant-scoped messages, offers, answers, and ICE candidates are surfaced as a trust story users can understand quickly.",
    points: ["Private signaling", "Participant-checked events", "Room events stay scoped"],
    icon: ShieldCheck,
    visual: "safety",
  },
];

const flowSteps = [
  { title: "Choose", body: "Pick a video or text room.", icon: Play },
  { title: "Queue", body: "Join a clean waiting state.", icon: Users },
  { title: "Match", body: "Move into a private room.", icon: Radio },
  { title: "Connect", body: "Talk with direct WebRTC media.", icon: Video },
];

const reactions = [
  {
    quote: "It feels like a calm, premium version of random chat. I understand the room before I click.",
    person: "Founder tester",
    role: "Social app builder",
  },
  {
    quote: "The safety story is finally visible. The product feels less anonymous-chaotic and more intentional.",
    person: "Frontend reviewer",
    role: "Product engineer",
  },
  {
    quote: "The lobby makes live matching feel real, not like a college demo page.",
    person: "Early user",
    role: "Video chat user",
  },
];

const faqs = [
  {
    question: "Is Omegal only a landing page?",
    answer: "No. The front page is conversion-focused, but the CTA buttons still join the live backend queue and route users into the room flow.",
  },
  {
    question: "How does privacy work in the room?",
    answer: "Room events are scoped to matched participants, with participant-checked messages, offers, answers, and ICE candidates.",
  },
  {
    question: "Can users choose video or text?",
    answer: "Yes. The landing page keeps both entry points visible: video rooms for WebRTC media and text rooms for socket messages.",
  },
  {
    question: "What happens after matching?",
    answer: "The app moves users from the queue into a private room where the peer session can start cleanly.",
  },
];

function StatusPill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, body, align = "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <StatusPill className="border-teal-300/25 bg-teal-300/10 text-teal-200">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </StatusPill>
      <h2 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl">{title}</h2>
      {body ? <p className="mt-5 text-lg leading-8 text-slate-300">{body}</p> : null}
    </div>
  );
}

function ModeLauncher({ selectedMode, setSelectedMode, startingMode, begin, compact = false }) {
  const selected = modes.find((item) => item.mode === selectedMode) || modes[0];
  const SelectedIcon = selected.icon;

  return (
    <div className={compact ? "grid gap-3" : "grid gap-4 rounded-lg border border-white/[0.12] bg-white/[0.08] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl"}>
      <div className="grid grid-cols-2 gap-2">
        {modes.map(({ mode, label, icon: Icon }) => {
          const active = selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setSelectedMode(mode)}
              className={`group flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                active
                  ? "border-teal-300/50 bg-teal-300/15 text-white shadow-[0_0_30px_rgba(20,184,166,0.16)]"
                  : "border-white/10 bg-white/[0.06] text-slate-300 hover:border-white/[0.22] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 transition group-hover:scale-110" />
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={Boolean(startingMode)}
        onClick={() => begin(selectedMode)}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-white px-5 text-base font-bold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,0.24)] transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SelectedIcon className="h-5 w-5" />
        {startingMode ? "Joining..." : `Start ${selected.label.toLowerCase()}`}
      </button>
    </div>
  );
}

function AvatarCard({ user, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className={`float-soft rounded-lg border border-white/[0.12] bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img className="h-12 w-12 rounded-lg object-cover" src={user.src} alt={`${user.name} avatar`} />
          <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-sm border border-slate-950 ${user.tone}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{user.name}</p>
          <p className="text-xs text-slate-300">{user.location} online</p>
        </div>
      </div>
    </motion.div>
  );
}

function VideoPane({ label, avatar, active = false }) {
  return (
    <div className="relative min-h-48 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),transparent_32%),linear-gradient(45deg,rgba(99,102,241,0.22),transparent_56%),linear-gradient(315deg,rgba(244,63,94,0.16),transparent_42%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_18px)]" />
      <div className="relative flex min-h-48 flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-black/35 px-2.5 py-1 text-xs font-semibold text-white">{label}</span>
          {active ? <span className="h-2.5 w-2.5 rounded-sm bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.85)]" /> : null}
        </div>
        <div className="mx-auto flex flex-col items-center">
          <img className="h-20 w-20 rounded-lg border border-white/[0.12] bg-white/10 object-cover p-1" src={avatar.src} alt={`${avatar.name} video tile`} />
          <p className="mt-3 text-sm font-semibold text-white">{avatar.name}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-2 rounded-md bg-white/10">
            <div className="h-full w-2/3 rounded-md bg-white/40" />
          </div>
          <Wifi className="h-4 w-4 text-teal-200" />
        </div>
      </div>
    </div>
  );
}

function HeroMockup({ signalLabel }) {
  return (
    <div className="relative mx-auto max-w-2xl lg:max-w-none">
      <img className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 opacity-80" src="/assets/mockups/connection-ring.svg" alt="" />
      <AvatarCard user={avatars[0]} className="absolute -left-4 top-9 z-20 hidden w-44 lg:block" delay={0.2} />
      <AvatarCard user={avatars[1]} className="absolute -right-4 bottom-20 z-20 hidden w-44 lg:block" delay={0.3} />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg border border-white/[0.14] bg-slate-950/[0.84] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.2),transparent_28%),radial-gradient(circle_at_60%_90%,rgba(244,63,94,0.12),transparent_34%)]" />
        <div className="relative rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950">
                <Video className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Omegal live room</p>
                <p className="text-xs text-slate-400">Matched from the clean queue</p>
              </div>
            </div>
            <StatusPill className="border-teal-300/25 bg-teal-300/10 text-teal-100">
              <Wifi className="h-3.5 w-3.5" />
              {signalLabel}
            </StatusPill>
          </div>

          <div className="grid gap-3 py-3 md:grid-cols-[1fr_0.74fr]">
            <VideoPane label="Stranger" avatar={avatars[2]} active />
            <div className="grid gap-3">
              <VideoPane label="You" avatar={avatars[3]} />
              <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-teal-300" />
                  Private room ready
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

          <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-3">
            {["Queue", "Room", "Peer"].map((item, index) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.07] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{item}</p>
                  <span className="text-xs font-bold text-teal-200">0{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.38 }}
        className="float-soft absolute -right-2 top-28 hidden max-w-56 rounded-lg border border-white/[0.12] bg-white/[0.12] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:block"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <MessageSquareText className="h-4 w-4 text-teal-200" />
          New match
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-200">“Hey, where are you joining from?”</p>
      </motion.div>
    </div>
  );
}

function ProofStrip() {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.04]">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {proofItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
            <p className="text-3xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductNetworkBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.45 }}
      className="mt-10 grid overflow-hidden rounded-lg border border-white/[0.12] bg-white/[0.06] shadow-2xl shadow-black/30 lg:grid-cols-[1fr_0.68fr]"
    >
      <div className="p-5 sm:p-7">
        <StatusPill className="border-white/[0.12] bg-white/[0.08] text-slate-200">
          <Globe2 className="h-3.5 w-3.5 text-teal-200" />
          Live interaction map
        </StatusPill>
        <h3 className="mt-5 max-w-2xl text-2xl font-bold leading-tight text-white sm:text-4xl">
          A social product should look connected before anyone clicks.
        </h3>
        <p className="mt-4 max-w-2xl leading-8 text-slate-300">
          The global network visual gives the page a real-time social discovery feel while still matching the queue, room, and peer model behind Omegal.
        </p>
      </div>
      <div className="relative min-h-72 overflow-hidden border-t border-white/[0.12] bg-slate-950/[0.45] lg:border-l lg:border-t-0">
        <img loading="lazy" className="h-full w-full object-cover" src="/assets/illustrations/global-network.svg" alt="Global live users network illustration" />
      </div>
    </motion.div>
  );
}

function VisualStory({ panel, index }) {
  const Icon = panel.icon;
  const reverse = index % 2 === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.45 }}
      className={`grid items-center gap-8 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
    >
      <div>
        <StatusPill className="border-white/[0.12] bg-white/[0.06] text-slate-200">
          <Icon className="h-3.5 w-3.5 text-teal-200" />
          {panel.eyebrow}
        </StatusPill>
        <h3 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">{panel.title}</h3>
        <p className="mt-4 text-lg leading-8 text-slate-300">{panel.body}</p>
        <div className="mt-6 grid gap-3">
          {panel.points.map((point) => (
            <div key={point} className="flex items-center gap-3 text-slate-200">
              <CheckCircle2 className="h-5 w-5 text-teal-300" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-80 overflow-hidden rounded-lg border border-white/[0.12] bg-white/[0.06] p-5 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.22),transparent_34%),radial-gradient(circle_at_78%_28%,rgba(99,102,241,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent)]" />
        {panel.visual === "people" ? <PeopleVisual /> : null}
        {panel.visual === "flow" ? <FlowVisual /> : null}
        {panel.visual === "safety" ? <SafetyVisual /> : null}
      </div>
    </motion.article>
  );
}

function PeopleVisual() {
  return (
    <div className="relative z-10 grid h-full min-h-72 content-center gap-4">
      <div className="grid grid-cols-2 gap-3">
        {avatars.map((user, index) => (
          <div key={user.name} className="rounded-lg border border-white/[0.12] bg-slate-950/[0.45] p-3 backdrop-blur">
            <img loading="lazy" className="h-16 w-16 rounded-lg object-cover" src={user.src} alt={`${user.name} avatar`} />
            <p className="mt-3 font-bold text-white">{user.name}</p>
            <p className="text-sm text-slate-300">{index % 2 === 0 ? "Open to video" : "Text-first today"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowVisual() {
  return (
    <div className="relative z-10 flex min-h-72 flex-col justify-center gap-4">
      {["Join queue", "Create room", "Verify participants", "Stream media"].map((item, index) => (
        <div key={item} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-white/[0.12] bg-slate-950/[0.45] p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950 text-sm font-bold">0{index + 1}</span>
          <span className="font-semibold text-white">{item}</span>
          <ArrowRight className="h-4 w-4 text-teal-200" />
        </div>
      ))}
    </div>
  );
}

function SafetyVisual() {
  return (
    <div className="relative z-10 grid min-h-72 items-center gap-5 md:grid-cols-[0.7fr_1fr]">
      <div className="rounded-lg border border-white/[0.12] bg-slate-950/[0.45] p-4">
        <img loading="lazy" className="mx-auto h-36 w-36 rounded-lg" src="/assets/icons/privacy-spark.svg" alt="Private signaling shield" />
      </div>
      <div className="grid gap-3">
        {["Participant-checked messages", "Offers and answers scoped", "ICE candidates verified"].map((item) => (
          <div key={item} className="rounded-lg border border-white/[0.12] bg-white/[0.07] p-4 text-sm font-semibold text-white">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[#f6f8fb] py-24 text-slate-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1fr] lg:items-end">
          <div>
            <StatusPill className="border-slate-200 bg-white text-slate-700">
              <Route className="h-3.5 w-3.5 text-teal-600" />
              How it works
            </StatusPill>
            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">A fast path from curiosity to conversation.</h2>
          </div>
          <p className="text-lg leading-8 text-slate-600">
            The product story is simple: choose your room type, enter the queue, get matched, and connect without clutter.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <img loading="lazy" className="h-full min-h-80 w-full object-cover" src="/assets/illustrations/room-flow-board.svg" alt="Queue to room to peer flow illustration" />
          </div>
          <div className="grid gap-4">
            {["FIFO matchmaking", "Clean rejoin handling", "Direct WebRTC media"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <p className="mt-4 text-lg font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {flowSteps.map(({ title, body, icon: Icon }, index) => (
            <motion.div
              key={title}
              whileHover={{ y: -6 }}
              className="relative min-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-400 to-rose-400" />
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
              </div>
              <h3 className="mt-8 text-2xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
              {index < flowSteps.length - 1 ? <div className="absolute -right-8 top-16 hidden h-px w-16 bg-slate-300 lg:block" /> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InteractionShowcase({ begin, startingMode }) {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050711,#0c1020_48%,#050711)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Real-time interaction"
            title="Make the platform feel alive before a user joins."
            body="Floating chat, active users, room state, signal status, and media controls communicate that Omegal is a real live interaction product."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

        <div className="relative min-h-[30rem] overflow-hidden rounded-lg border border-white/[0.12] bg-white/[0.06] p-4 shadow-2xl shadow-black/30">
          <img className="absolute -right-12 -top-16 h-72 w-72 opacity-70" src="/assets/mockups/connection-ring.svg" alt="" loading="lazy" />
          <div className="relative grid gap-4">
            <img
              loading="lazy"
              className="rounded-lg border border-white/[0.12] shadow-2xl shadow-black/20"
              src="/assets/illustrations/chat-pulse.svg"
              alt="Live text room chat pulse illustration"
            />
            <div className="rounded-lg border border-white/[0.12] bg-slate-950/[0.72] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Live text room</p>
                  <p className="text-xs text-slate-400">Socket messages, no media prompt</p>
                </div>
                <StatusPill className="border-teal-300/25 bg-teal-300/10 text-teal-100">online</StatusPill>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="max-w-[80%] rounded-lg bg-white/10 p-3 text-sm leading-6 text-slate-100">What made you click tonight?</div>
                <div className="ml-auto max-w-[80%] rounded-lg bg-teal-300 p-3 text-sm font-semibold leading-6 text-slate-950">
                  Curious conversations, not a noisy feed.
                </div>
                <div className="max-w-[80%] rounded-lg bg-white/10 p-3 text-sm leading-6 text-slate-100">Same. This feels calmer already.</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {avatars.slice(0, 2).map((user) => (
                <div key={user.name} className="rounded-lg border border-white/[0.12] bg-white/[0.07] p-4">
                  <img loading="lazy" className="h-16 w-16 rounded-lg object-cover" src={user.src} alt={`${user.name} profile`} />
                  <p className="mt-3 font-bold text-white">{user.name}</p>
                  <p className="text-sm text-slate-300">available now</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-[#f6f8fb] py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <StatusPill className="border-slate-200 bg-white text-slate-700">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            User reactions
          </StatusPill>
          <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">The kind of first impression people remember.</h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {reactions.map((reaction) => (
            <motion.figure key={reaction.person} whileHover={{ y: -5 }} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl">
              <Quote className="h-7 w-7 text-teal-500" />
              <blockquote className="mt-5 text-lg leading-8 text-slate-700">{reaction.quote}</blockquote>
              <figcaption className="mt-6 border-t border-slate-200 pt-4">
                <p className="font-bold">{reaction.person}</p>
                <p className="text-sm text-slate-500">{reaction.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Clear answers before the first match."
          body="A launch-ready social product needs trust and clarity, not only a beautiful hero."
        />
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-lg border border-white/[0.12] bg-white/[0.06] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-white">
                {faq.question}
                <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 leading-7 text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ selectedMode, setSelectedMode, startingMode, begin }) {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-lg border border-white/[0.12] bg-white/[0.07] p-6 shadow-2xl shadow-black/30 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(244,63,94,0.16),transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-center">
          <div>
            <StatusPill className="border-white/[0.12] bg-white/10 text-white">
              <Zap className="h-3.5 w-3.5 text-amber-200" />
              Ready when they are
            </StatusPill>
            <h2 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">Turn curiosity into a live Omegal room.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Join a random text or video room with a clean queue, strict signaling, and direct WebRTC media.
            </p>
          </div>
          <ModeLauncher selectedMode={selectedMode} setSelectedMode={setSelectedMode} startingMode={startingMode} begin={begin} compact />
        </div>
      </div>
    </section>
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
  const signalLabel = signalOnline ? "Signal online" : socketStatus === SOCKET_STATUS.CONNECTING ? "Connecting" : "Signal offline";

  return (
    <AppShell variant="marketing">
      <main className="overflow-hidden">
        <section className="relative min-h-screen overflow-hidden pt-16">
          <div className="absolute inset-0 bg-cover bg-center opacity-95" style={{ backgroundImage: "url('/assets/backgrounds/aurora-mesh.svg')" }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,17,0.38),rgba(5,7,17,0.78)_58%,#050711)]" />
          <div className="marketing-noise absolute inset-0 opacity-35" />

          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <StatusPill className="border-white/[0.14] bg-white/10 text-teal-100 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5 text-teal-200" />
                  Modern stranger rooms, rebuilt for trust
                </StatusPill>
                <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl">
                  Meet someone new, without the internet feeling random.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                  Omegal turns random text and video rooms into a premium live social experience with a clean queue, strict signaling, and direct WebRTC media.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="mt-8 max-w-xl">
                <ModeLauncher selectedMode={selectedMode} setSelectedMode={setSelectedMode} startingMode={startingMode} begin={begin} />
              </motion.div>

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {[
                  [Globe2, "Global", "people online"],
                  [LockKeyhole, "Private", "room scoped"],
                  [Zap, "Fast", "live matching"],
                ].map(([Icon, title, label]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
                    <Icon className="h-5 w-5 text-teal-200" />
                    <p className="mt-3 text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroMockup signalLabel={signalLabel} />
          </div>
        </section>

        <ProofStrip />

        <section className="relative py-24">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#050711,#0a0f20_45%,#050711)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Product story"
              title="Not a dashboard. A launch-ready social platform narrative."
              body="Every section exists to make users feel the product is real, safe, alive, and worth trying."
              align="center"
            />
            <ProductNetworkBanner />
            <div className="mt-16 grid gap-16">
              {storyPanels.map((panel, index) => (
                <VisualStory key={panel.title} panel={panel} index={index} />
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-[#050711]" />
          <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-teal-950/30 to-transparent" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <SectionHeading
                eyebrow="Safety and moderation"
                title="Privacy should be part of the visual product, not an afterthought."
                body="The page makes room safety visible with participant-scoped signaling, clear states, and trust cues before users enter the room."
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
                <img
                  loading="lazy"
                  className="rounded-lg border border-white/[0.12] bg-white/[0.06] shadow-2xl shadow-black/20"
                  src="/assets/illustrations/moderation-panel.svg"
                  alt="Omegal moderation and private signaling illustration"
                />
                <img
                  loading="lazy"
                  className="hidden h-32 w-32 rounded-lg border border-white/[0.12] bg-white/[0.06] p-3 shadow-2xl shadow-black/20 sm:block"
                  src="/assets/illustrations/signal-glass.svg"
                  alt="Abstract secure signal illustration"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Private signaling", "Room events stay scoped to matched participants.", ShieldCheck],
                ["Participant-checked events", "Messages, offers, answers, and ICE candidates are validated.", LockKeyhole],
                ["Clean rejoin handling", "If a peer disappears, connected users remain eligible.", Users],
                ["No media prompt for text", "Text rooms use socket messages without camera pressure.", MessageSquareText],
              ].map(([title, body, Icon]) => (
                <motion.div key={title} whileHover={{ y: -5 }} className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <InteractionShowcase begin={begin} startingMode={startingMode} />
        <Testimonials />
        <FAQSection />
        <FinalCTA selectedMode={selectedMode} setSelectedMode={setSelectedMode} startingMode={startingMode} begin={begin} />
      </main>
    </AppShell>
  );
}
