import { motion } from "framer-motion";
import { MessageSquareText, Radar, ShieldCheck, Users, Video, Wifi } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";

const scanSteps = ["Socket ready", "Queue joined", "Room pending", "Peer discovery"];

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);
  const waitingMessage = useAppStore((state) => state.waitingMessage);
  const isVideo = chatMode === CHAT_MODES.VIDEO;
  const headline = waitingMessage || "Looking for a live partner.";

  return (
    <section className="relative mt-[52px] flex min-h-[calc(100dvh-52px)] items-center overflow-hidden bg-black px-4 py-10 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 h-[32rem] w-[32rem] rounded-full bg-blue-500/30 blur-[140px]" />
        <div className="absolute right-[-8rem] bottom-[-5rem] h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/24 blur-[150px]" />
        <div className="absolute left-[38%] top-[35%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/16 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[0.95fr_0.78fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="liquid-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/78">
            {isVideo ? <Video className="h-4 w-4 text-cyan-200" /> : <MessageSquareText className="h-4 w-4 text-cyan-200" />}
            {isVideo ? "Video queue" : "Text queue"}
          </span>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.05em] text-white sm:text-7xl lg:text-8xl">{headline}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/56 sm:text-xl">
            OmegleX is preparing a private room, checking live sockets, and keeping the session ready for a clean connection.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-4">
            {scanSteps.map((label, index) => (
              <motion.div
                key={label}
                className="liquid-card rounded-[1.5rem] p-4"
                animate={{ y: [0, -5, 0], opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}
              >
                <p className="text-2xl font-black tracking-[-0.04em] text-white">0{index + 1}</p>
                <p className="mt-3 text-sm leading-5 text-white/50">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="liquid-panel relative overflow-hidden rounded-[2rem] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(96,165,250,0.18),transparent_34%)]" />
          <div className="relative flex aspect-square items-center justify-center">
            <motion.div className="absolute h-[82%] w-[82%] rounded-full border border-white/10" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute h-[58%] w-[58%] rounded-full border border-cyan-200/18" animate={{ scale: [1.05, 0.95, 1.05] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }} />
            <div className="liquid-icon relative flex h-24 w-24 items-center justify-center rounded-[2rem]">
              <Radar className="h-11 w-11 text-white" />
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [Users, "Queue", queueSize],
              [ShieldCheck, "Scope", "safe"],
              [Wifi, "Signal", "live"],
            ].map(([Icon, label, value]) => (
              <div key={label} className="liquid-card rounded-[1.35rem] p-4">
                <Icon className="h-4 w-4 text-cyan-100" />
                <p className="mt-3 text-xs text-white/42">{label}</p>
                <p className="text-xl font-black tracking-[-0.04em] text-white">{value}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
