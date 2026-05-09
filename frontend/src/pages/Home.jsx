import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareText, Video } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { healthCheck } from "../services/api.js";
import { CHAT_MODES } from "../utils/constants.js";

const heroImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=80";

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

  return (
    <AppShell>
      <main>
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96),rgba(2,6,23,0.76)_45%,rgba(2,6,23,0.34)),linear-gradient(0deg,rgba(2,6,23,0.96),transparent_45%)]" />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pt-28 pb-20 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="max-w-3xl">
              <p className="text-base font-semibold tracking-[0.45em] text-cyan-200 uppercase sm:text-lg">EchoRoom</p>
              <h1 className="mt-6 max-w-3xl text-5xl leading-[0.95] font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
                Meet a stranger in seconds.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-xl">
                Jump into a random text or video room with realtime Socket.io matching and direct WebRTC media.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.VIDEO)}>
                  <Video className="h-5 w-5" />
                  {startingMode === CHAT_MODES.VIDEO ? "Preparing camera" : "Start video"}
                </Button>
                <Button size="lg" variant="secondary" type="button" disabled={Boolean(startingMode)} onClick={() => begin(CHAT_MODES.TEXT)}>
                  <MessageSquareText className="h-5 w-5" />
                  {startingMode === CHAT_MODES.TEXT ? "Joining queue" : "Start text"}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <Badge variant={serverHealth === "online" ? "success" : serverHealth === "offline" ? "error" : "warning"}>
              Health check: {serverHealth}
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Built for live matching.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              EchoRoom keeps the frontend aligned with your backend events: queue updates, match payloads, message confirmations, peer signaling, and disconnect recovery.
            </p>
          </motion.div>
        </section>
      </main>
    </AppShell>
  );
}