import { motion } from "framer-motion";
import { Radar, Users, Video, MessageSquareText } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { useAppStore } from "../../store/appStore.js";
import { CHAT_MODES } from "../../utils/constants.js";

export default function SearchPanel() {
  const queueSize = useAppStore((state) => state.queueSize);
  const chatMode = useAppStore((state) => state.chatMode);
  const isVideo = chatMode === CHAT_MODES.VIDEO;

  return (
    <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-4 px-4 pt-24 pb-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.45fr)] lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="media-panel rounded-lg p-5 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <Badge variant="dark">{isVideo ? "Video queue" : "Text queue"}</Badge>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Finding a live partner</h1>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
            <Radar className="h-7 w-7" />
          </div>
        </div>

        <div className="grid gap-3 py-6 sm:grid-cols-3">
          {["Socket ready", "Queue joined", "Room pending"].map((label, index) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4">
              <div className="text-2xl font-bold text-white">0{index + 1}</div>
              <div className="mt-2 text-sm text-slate-300">{label}</div>
            </div>
          ))}
        </div>

        <div className="h-2 overflow-hidden rounded-lg bg-white/10">
          <motion.div
            className="h-full w-1/2 rounded-lg bg-teal-300"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="surface-panel rounded-lg p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            {isVideo ? <Video className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-semibold text-slate-950">{isVideo ? "Video room" : "Text room"}</p>
            <p className="text-sm text-slate-500">Waiting for a second socket</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4 text-indigo-600" />
              Queue size
            </div>
            <span className="text-2xl font-bold text-slate-950">{queueSize}</span>
          </div>
        </div>
      </motion.aside>
    </section>
  );
}
