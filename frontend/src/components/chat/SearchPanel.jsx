import { motion } from "framer-motion";
import { MessageSquareText, Radar, ShieldCheck, Users, Video, Wifi } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";
import waitingMatch from "../../assets/illustrations/waiting_match.svg";

const scanSteps = ["Socket ready", "Queue joined", "Room pending", "Peer discovery"];

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);
  const waitingMessage = useAppStore((state) => state.waitingMessage);
  const isVideo = chatMode === CHAT_MODES.VIDEO;
  const headline = waitingMessage || "Looking for a live partner.";

  return (
    <section className="chat-glow relative mt-[52px] flex min-h-[calc(100dvh-52px)] items-center overflow-hidden bg-[#f5f5f7] px-4 py-10 text-[#1d1d1f] sm:px-6">
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[0.95fr_0.78fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="liquid-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#6e6e73]">
            {isVideo ? <Video className="h-4 w-4 text-[#0071e3]" /> : <MessageSquareText className="h-4 w-4 text-[#0071e3]" />}
            {isVideo ? "Video queue" : "Text queue"}
          </span>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-[#1d1d1f] sm:text-7xl lg:text-8xl">{headline}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6e6e73] sm:text-xl">
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
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#1d1d1f]">0{index + 1}</p>
                <p className="mt-3 text-sm leading-5 text-[#6e6e73]">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="liquid-panel relative overflow-hidden rounded-[2rem] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,113,227,0.10),transparent_42%)]" />
          <div className="relative flex aspect-square items-center justify-center">
            <motion.div className="absolute h-[86%] w-[86%] rounded-full border border-[#0071e3]/10" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute h-[60%] w-[60%] rounded-full border border-[#34c759]/15" animate={{ scale: [1.05, 0.95, 1.05] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }} />
            <img src={waitingMatch} alt="" aria-hidden="true" className="relative z-10 w-[72%] max-w-sm" />
            <div className="liquid-icon absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.25rem] text-[#0071e3]">
              <Radar className="h-8 w-8" />
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [Users, "Queue", queueSize],
              [ShieldCheck, "Scope", "safe"],
              [Wifi, "Signal", "live"],
            ].map(([Icon, label, value]) => (
              <div key={label} className="liquid-card rounded-[1.35rem] p-4">
                <Icon className="h-4 w-4 text-[#0071e3]" />
                <p className="mt-3 text-xs text-[#6e6e73]">{label}</p>
                <p className="text-xl font-semibold tracking-[-0.04em] text-[#1d1d1f]">{value}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
