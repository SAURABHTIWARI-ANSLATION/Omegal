import { motion } from "framer-motion";
import { Radar, Users } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);

  return (
    <section className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        className="mx-auto flex w-full max-w-3xl flex-col items-center text-center"
      >
        <div className="relative mb-10 flex h-52 w-52 items-center justify-center">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="absolute inset-0 rounded-full border border-cyan-300/25"
              animate={{ scale: [0.55, 1.15], opacity: [0.65, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.45, ease: "easeOut" }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="glass-panel flex h-28 w-28 items-center justify-center rounded-full"
          >
            <Radar className="h-10 w-10 text-cyan-200" />
          </motion.div>
        </div>

        <Badge variant="info" className="mb-5">
          {chatMode === CHAT_MODES.VIDEO ? "Video queue" : "Text queue"}
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">Searching for partner...</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Keep this tab open while EchoRoom pairs you with another online stranger.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm text-slate-200 backdrop-blur-xl">
          <Users className="h-4 w-4 text-cyan-200" />
          <span>Online users: {queueSize}</span>
        </div>
      </motion.div>
    </section>
  );
}