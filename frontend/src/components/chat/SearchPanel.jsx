import { motion } from "framer-motion";
import { MessageSquareText, Radar, ShieldCheck, Users, Video, Wifi } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";
import chatUiStudio from "../../assets/studio/chat-ui-studio.jpg";

const scanSteps = ["Socket ready", "Queue joined", "Room pending", "Peer discovery"];

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);
  const waitingMessage = useAppStore((state) => state.waitingMessage);
  const isVideo = chatMode === CHAT_MODES.VIDEO;
  const headline = waitingMessage || "Looking for a live partner.";

  return (
    <section className="chat-glow relative mt-[56px] flex min-h-[calc(100dvh-56px)] items-center overflow-hidden bg-[#f7f5ef] px-4 py-10 text-[#111115] sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,113,227,0.14),transparent_34%),radial-gradient(circle_at_82%_76%,rgba(255,55,95,0.10),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(238,244,255,0.72))]" />
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[0.95fr_0.82fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="studio-eyebrow">
            {isVideo ? <Video className="h-4 w-4 text-[#0071e3]" /> : <MessageSquareText className="h-4 w-4 text-[#0071e3]" />}
            {isVideo ? "Video queue" : "Text queue"}
          </span>
          <h1 className="mt-7 max-w-4xl text-[clamp(2rem,8vw,3rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-[#111115] sm:text-7xl lg:text-8xl">{headline}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#62626c] sm:text-xl">
            OmegleX is preparing a private room, checking live sockets, and keeping the session ready for a clean connection.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {scanSteps.map((label, index) => (
              <motion.div
                key={label}
                className="studio-card p-4"
                animate={{ y: [0, -5, 0], opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}
              >
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#111115]">0{index + 1}</p>
                <p className="mt-3 text-sm leading-5 text-[#62626c]">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="studio-card relative overflow-hidden p-4 sm:p-5">
          <div className="relative aspect-square max-h-[360px] overflow-hidden rounded-[2rem] bg-[#eef4ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:max-h-none">
            <img src={chatUiStudio} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/0 to-white/82" />
            <motion.div className="absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0071e3]/25" animate={{ scale: [1.05, 0.95, 1.05] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.35rem] border border-white/80 bg-white/80 text-[#0071e3] shadow-[0_18px_42px_rgba(0,113,227,0.18)] backdrop-blur-2xl">
              <Radar className="h-8 w-8" />
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [Users, "Queue", queueSize],
              [ShieldCheck, "Scope", "safe"],
              [Wifi, "Signal", "live"],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
                <Icon className="h-4 w-4 text-[#0071e3]" />
                <p className="mt-3 text-xs text-[#62626c]">{label}</p>
                <p className="text-xl font-semibold tracking-[-0.04em] text-[#111115]">{value}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
