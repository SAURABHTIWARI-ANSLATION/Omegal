import { motion } from "framer-motion";
import { LockKeyhole, MessageSquareText, Radar, Radio, ShieldCheck, Terminal, Users, Video, Wifi, Zap } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";

const scanSteps = ["socket.ready", "queue.joined", "room.pending", "peer.scan"];
const terminalLines = [
  "init secure_signaling --private-room",
  "checking participant scope...",
  "routing queue packet through live mesh",
  "waiting for second socket handshake",
];

function MatrixRain() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-25 sm:block" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute top-[-20%] font-mono text-xs leading-6 text-teal-300/55"
          style={{ left: `${index * 7.4}%` }}
          animate={{ y: ["0vh", "130vh"] }}
          transition={{ duration: 4 + (index % 5), repeat: Infinity, ease: "linear", delay: index * 0.18 }}
        >
          {["0101", "SIGNAL", "ROOM", "ICE", "PEER", "QUEUE", "WRTC"].map((item) => (
            <div key={`${index}-${item}`}>{item}</div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function RadarCore() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[31rem] items-center justify-center">
      <div className="absolute inset-0 rounded-lg border border-teal-300/15 bg-teal-300/[0.03]" />
      <div className="absolute inset-8 rounded-lg border border-indigo-300/10" />
      <div className="absolute inset-16 rounded-lg border border-rose-300/10" />
      <motion.div
        className="absolute h-[46%] w-1 origin-bottom rounded-lg bg-gradient-to-t from-teal-300/0 via-teal-300/70 to-teal-100"
        animate={{ rotate: 360 }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute h-28 w-28 rounded-lg border border-teal-300/40 bg-teal-300/10 shadow-[0_0_70px_rgba(45,212,191,0.32)]"
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-lg bg-teal-300 text-slate-950 shadow-[0_0_70px_rgba(45,212,191,0.6)]">
        <Radar className="h-10 w-10" />
      </div>
      {[
        ["top-20 left-16", "user.node"],
        ["right-14 top-32", "peer.ping"],
        ["bottom-20 left-24", "socket.id"],
        ["bottom-28 right-20", "room.lock"],
      ].map(([position, label], index) => (
        <motion.div
          key={label}
          className={`absolute ${position} rounded-md border border-white/10 bg-white/[0.08] px-2.5 py-1 font-mono text-[10px] font-bold text-teal-100 backdrop-blur`}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -5, 0] }}
          transition={{ duration: 2 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.div>
      ))}
    </div>
  );
}

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);
  const waitingMessage = useAppStore((state) => state.waitingMessage);
  const isVideo = chatMode === CHAT_MODES.VIDEO;
  const headline = waitingMessage || "Scanning the live mesh for a real partner.";

  return (
    <section className="relative mt-16 min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#050711] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(99,102,241,0.22),transparent_32%),linear-gradient(180deg,#050711,#08111f)]" />
      <div className="marketing-noise absolute inset-0 opacity-25" />
      <MatrixRain />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-5 px-4 py-5 sm:gap-7 sm:px-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(24rem,0.72fr)] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-lg border border-teal-300/25 bg-teal-300/10 px-3 py-2 font-mono text-xs font-bold text-teal-100">
            <Terminal className="h-3.5 w-3.5" />
            {isVideo ? "VIDEO_QUEUE_SCAN" : "TEXT_QUEUE_SCAN"}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-white sm:mt-5 sm:text-5xl sm:leading-none lg:text-7xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-4 sm:text-lg sm:leading-8">
            Secure socket handshake active. Omegal is searching the queue, verifying room scope, and preparing a private {isVideo ? "video" : "text"} room.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-4 sm:gap-3">
            {scanSteps.map((label, index) => (
              <motion.div
                key={label}
                className="rounded-lg border border-white/10 bg-white/[0.07] p-3 backdrop-blur sm:p-4"
                animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(94,234,212,0.55)", "rgba(255,255,255,0.1)"] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.24 }}
              >
                <p className="font-mono text-xl font-black text-white sm:text-2xl">0{index + 1}</p>
                <p className="mt-2 break-words font-mono text-xs text-slate-300">{label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/35 p-3 font-mono text-xs shadow-2xl shadow-black/40 sm:mt-5 sm:p-4">
            {terminalLines.map((line, index) => (
              <motion.div
                key={line}
                className="flex min-w-0 items-center gap-2 py-1 text-teal-100"
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.35 }}
              >
                <span className="text-teal-300">$</span>
                <span className="min-w-0 break-words">{line}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative hidden min-w-0 lg:block">
          <RadarCore />
          <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950">
                  {isVideo ? <Video className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-bold text-white">{isVideo ? "Video room" : "Text room"}</p>
                  <p className="text-sm text-slate-300">Waiting for a second socket</p>
                </div>
              </div>
              <div className="rounded-lg border border-teal-300/25 bg-teal-300/10 px-3 py-2 text-sm font-bold text-teal-100">LIVE</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [Users, "Queue size", queueSize],
                [ShieldCheck, "Room scope", "safe"],
                [Wifi, "Signal", "online"],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <Icon className="h-4 w-4 text-teal-200" />
                  <p className="mt-3 text-xs text-slate-400">{label}</p>
                  <p className="text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="h-2 overflow-hidden rounded-lg bg-white/10">
              <motion.div
                className="h-full w-1/2 rounded-lg bg-gradient-to-r from-teal-300 via-indigo-300 to-rose-300"
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
              <LockKeyhole className="h-3.5 w-3.5 text-teal-200" />
              private signaling
              <Radio className="h-3.5 w-3.5 text-indigo-200" />
              peer discovery
              <Zap className="h-3.5 w-3.5 text-amber-200" />
              realtime queue
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
