import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SOCKET_STATUS } from "../utils/constants.js";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
};

const features = [
  {
    icon: Users,
    title: "Clean queue matching",
    body: "A calm waiting state that keeps users moving into private rooms without noisy feed behavior.",
  },
  {
    icon: ShieldCheck,
    title: "Private signaling",
    body: "Participant-scoped messages, offers, answers, and ICE candidates keep room traffic isolated.",
  },
  {
    icon: Video,
    title: "Direct WebRTC media",
    body: "Video and audio move peer-to-peer after signaling, giving the room a fast live feel.",
  },
  {
    icon: MessageSquareText,
    title: "Text-first option",
    body: "Users can start lightweight socket chat without camera or microphone pressure.",
  },
  {
    icon: Radio,
    title: "Next partner flow",
    body: "Move on without a page refresh while the room and peer connection reset cleanly.",
  },
  {
    icon: LockKeyhole,
    title: "Safety by default",
    body: "The product makes privacy and moderation cues visible before the first conversation starts.",
  },
];

const steps = [
  {
    number: "01",
    eyebrow: "Choose your room",
    title: "Start with video or text, then let the queue do the work.",
    body: "OmegleX keeps entry simple: choose the room type, connect to the socket, and wait in a focused matching state.",
    points: ["No dashboard detour", "No account wall", "Mode stays explicit"],
    visual: "choose",
  },
  {
    number: "02",
    eyebrow: "Match privately",
    title: "A matched room is scoped to only two active participants.",
    body: "The room model stays tight so messages, WebRTC offers, answers, and ICE candidates are accepted only from the matched sockets.",
    points: ["Participant checks", "Session versioning", "Clean stale event guards"],
    visual: "room",
  },
  {
    number: "03",
    eyebrow: "Move smoothly",
    title: "Skip to the next person without breaking the session.",
    body: "The requester stays stable, the old partner can re-enter matchmaking, and the next peer renegotiates cleanly.",
    points: ["No reload", "No route change", "Fresh peer connection"],
    visual: "next",
  },
];

const faqs = [
  ["Is this only a landing page?", "No. The CTAs connect to the real socket queue and route users into the live chat experience."],
  ["Does video go through the backend?", "The backend handles signaling and matchmaking. Browser media is WebRTC peer-to-peer once connected."],
  ["Can users skip partners?", "Yes. The next-partner flow resets the peer connection and searches again without page refresh."],
  ["Is the room private?", "Room events are scoped to the matched participants and stale session events are ignored."],
];

function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black" aria-hidden="true">
      <div className="absolute -left-36 top-10 h-[34rem] w-[34rem] rounded-full bg-blue-500/35 blur-[140px]" />
      <div className="absolute left-[34%] top-[32%] h-[32rem] w-[32rem] rounded-full bg-emerald-400/20 blur-[150px]" />
      <div className="absolute -right-36 bottom-0 h-[38rem] w-[38rem] rounded-full bg-fuchsia-500/30 blur-[160px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.1),#000_78%)]" />
    </div>
  );
}

function Eyebrow({ icon: Icon = Sparkles, children }) {
  return (
    <span className="liquid-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/86">
      <Icon className="h-4 w-4 text-cyan-200" />
      {children}
    </span>
  );
}

function GradientWord({ children }) {
  return (
    <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function CTAButton({ children, ghost = false, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        ghost
          ? "liquid-button h-12 rounded-full px-6 text-sm font-semibold text-white/88 transition duration-500 hover:-translate-y-0.5 hover:text-white disabled:opacity-50"
          : "h-12 rounded-full border border-white/25 bg-white/18 px-6 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_18px_70px_rgba(80,140,255,0.28)] backdrop-blur-2xl transition duration-500 hover:-translate-y-0.5 hover:bg-white/24 disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

function SectionIntro({ eyebrow, title, body, icon }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className="mx-auto max-w-4xl text-center"
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2 className="mt-7 text-4xl font-black leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">{title}</h2>
      {body ? <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/58 sm:text-xl">{body}</p> : null}
    </motion.div>
  );
}

function HeroDevice({ signalLabel }) {
  return (
    <motion.div variants={fadeUp} className="relative mx-auto mt-14 max-w-5xl">
      <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-cyan-400/16 via-emerald-300/10 to-fuchsia-400/16 blur-3xl" />
      <div className="liquid-panel relative overflow-hidden rounded-[2rem] p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/28">
          <div className="grid gap-3 p-3 sm:grid-cols-[1fr_0.54fr] sm:p-4">
            <div className="relative min-h-[21rem] overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/36">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_22%,rgba(96,165,250,0.24),transparent_30%),radial-gradient(circle_at_68%_72%,rgba(34,197,94,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
              <div className="absolute left-5 top-5 liquid-pill px-3 py-1.5 text-xs font-semibold text-white/86">Stranger preview</div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="liquid-panel rounded-[1.4rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/62">Live room</p>
                      <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-white">Matched from the queue</p>
                    </div>
                    <Wifi className="h-6 w-6 text-emerald-200" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="liquid-panel rounded-[1.3rem] p-4">
                <div className="flex items-center justify-between">
                  <Eyebrow icon={Radio}>{signalLabel}</Eyebrow>
                </div>
                <div className="mt-8 grid gap-3">
                  {["Queue joined", "Room isolated", "Peer ready"].map((item, index) => (
                    <div key={item} className="liquid-card flex items-center justify-between rounded-2xl p-4">
                      <span className="text-sm font-semibold text-white/78">{item}</span>
                      <span className="text-sm font-bold text-white/45">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="liquid-panel rounded-[1.3rem] p-4">
                <p className="text-sm font-semibold text-white/60">Incoming message</p>
                <p className="mt-3 text-lg font-semibold leading-7 tracking-[-0.02em] text-white">“Where are you joining from?”</p>
                <div className="mt-5 flex gap-2">
                  <span className="h-2 w-10 rounded-full bg-cyan-200/70" />
                  <span className="h-2 w-16 rounded-full bg-white/18" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 top-3 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/22" />
        </div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -10, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
      className="liquid-card group min-h-[18rem] rounded-[1.75rem] p-6"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/18 bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="mt-10 text-sm font-semibold text-white/34">0{index + 1}</p>
      <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">{feature.title}</h3>
      <p className="mt-4 leading-7 text-white/56">{feature.body}</p>
    </motion.article>
  );
}

function StepVisual({ type }) {
  return (
    <div className="liquid-panel relative min-h-[28rem] overflow-hidden rounded-[2rem] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(96,165,250,0.22),transparent_32%),radial-gradient(circle_at_72%_78%,rgba(168,85,247,0.18),transparent_34%)]" />
      <div className="relative grid min-h-[24rem] content-center gap-4">
        {type === "choose" ? (
          <>
            {[Video, MessageCircle].map((Icon, index) => (
              <div key={index} className="liquid-card flex items-center justify-between rounded-[1.4rem] p-5">
                <span className="flex items-center gap-4 text-lg font-bold text-white">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                    <Icon className="h-6 w-6" />
                  </span>
                  {index === 0 ? "Video room" : "Text room"}
                </span>
                <ArrowRight className="h-5 w-5 text-white/48" />
              </div>
            ))}
          </>
        ) : null}
        {type === "room" ? (
          <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-2xl">
            {["participant.check", "session.version", "ice.guard"].map((item) => (
              <div key={item} className="flex items-center justify-between border-b border-white/10 py-4 last:border-0">
                <span className="font-mono text-sm text-white/70">{item}</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              </div>
            ))}
          </div>
        ) : null}
        {type === "next" ? (
          <div className="grid gap-4">
            {["Reset peer", "Requeue partner", "Find next"].map((item, index) => (
              <motion.div
                key={item}
                animate={{ x: [0, index === 1 ? -8 : 8, 0] }}
                transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                className="liquid-card rounded-[1.4rem] p-5 text-xl font-bold text-white"
              >
                {item}
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StepSection({ step, reverse }) {
  return (
    <motion.article
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className={`grid items-center gap-12 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
    >
      <motion.div variants={fadeUp} className="relative">
        <div className="absolute -left-3 -top-20 text-[10rem] font-black leading-none tracking-[-0.08em] text-white/[0.055] sm:text-[14rem]">
          {step.number}
        </div>
        <div className="relative">
          <Eyebrow icon={Sparkles}>{step.eyebrow}</Eyebrow>
          <h3 className="mt-7 text-4xl font-black leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl">{step.title}</h3>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/58">{step.body}</p>
          <div className="mt-8 grid gap-3">
            {step.points.map((point) => (
              <div key={point} className="flex items-center gap-3 text-white/74">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div variants={fadeUp}>
        <StepVisual type={step.visual} />
      </motion.div>
    </motion.article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();
  const socketStatus = useAppStore((state) => state.socketStatus);
  const [startingMode, setStartingMode] = useState(null);

  const begin = async (mode) => {
    setStartingMode(mode);
    const queued = await startQueue(mode);
    setStartingMode(null);
    if (queued) navigate("/chat");
  };

  const signalOnline = socketStatus === SOCKET_STATUS.CONNECTED;
  const signalLabel = signalOnline ? "Signal online" : socketStatus === SOCKET_STATUS.CONNECTING ? "Connecting" : "Signal offline";

  return (
    <AppShell variant="marketing">
      <AmbientOrbs />
      <main className="relative overflow-hidden bg-black text-white">
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-28 sm:px-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-6xl text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow>OmegleX private live rooms</Eyebrow>
            </motion.div>
            <motion.h1 variants={fadeUp} className="mx-auto mt-8 max-w-6xl text-6xl font-black leading-[0.88] tracking-[-0.055em] text-white sm:text-8xl lg:text-[8.8rem]">
              Meet strangers.
              <br />
              Feel <GradientWord>in control.</GradientWord>
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/58 sm:text-2xl sm:leading-10">
              Random video and text conversations redesigned as a calm, private, real-time social experience.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTAButton onClick={() => begin(CHAT_MODES.VIDEO)} disabled={Boolean(startingMode)}>
                <Video className="mr-2 inline h-4 w-4" />
                {startingMode === CHAT_MODES.VIDEO ? "Joining..." : "Start video"}
              </CTAButton>
              <CTAButton ghost onClick={() => begin(CHAT_MODES.TEXT)} disabled={Boolean(startingMode)}>
                <MessageSquareText className="mr-2 inline h-4 w-4" />
                {startingMode === CHAT_MODES.TEXT ? "Joining..." : "Start text"}
              </CTAButton>
            </motion.div>
          </motion.div>

          <HeroDevice signalLabel={signalLabel} />

          <motion.div
            animate={{ y: [0, 8, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-white/44"
          >
            Scroll
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </section>

        <section className="apple-section">
          <div className="apple-container">
            <SectionIntro
              eyebrow="Liquid room system"
              title={
                <>
                  Designed for the moment before <GradientWord>hello.</GradientWord>
                </>
              }
              body="The interface turns matchmaking, privacy, WebRTC, and next-partner switching into a clear visual story."
              icon={Sparkles}
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="mt-16 grid gap-5 lg:grid-cols-3"
            >
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        <section className="apple-section">
          <div className="apple-container grid gap-32">
            {steps.map((step, index) => (
              <StepSection key={step.title} step={step} reverse={index % 2 === 1} />
            ))}
          </div>
        </section>

        <section className="apple-section">
          <div className="apple-container">
            <SectionIntro
              eyebrow="Live product feel"
              title={
                <>
                  Built to feel <GradientWord>safe, fast, alive.</GradientWord>
                </>
              }
              body="Status, privacy, and conversation controls stay visible without turning the experience into a dashboard."
              icon={ShieldCheck}
            />
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="liquid-panel mx-auto mt-16 max-w-4xl rounded-[2rem] p-4 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  [Globe2, "Global queue", "Real-time discovery"],
                  [Mic, "Media ready", "Camera and microphone controls"],
                  [Zap, "Fast skip", "No page refresh"],
                ].map(([Icon, title, body]) => (
                  <div key={title} className="liquid-card rounded-[1.5rem] p-5">
                    <Icon className="h-6 w-6 text-cyan-100" />
                    <h3 className="mt-7 text-xl font-bold tracking-[-0.03em] text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/52">{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="apple-section">
          <div className="apple-container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <SectionIntro
              eyebrow="FAQ"
              title={
                <>
                  Clear answers.
                  <br />
                  Less <GradientWord>uncertainty.</GradientWord>
                </>
              }
              icon={MessageCircle}
            />
            <div className="grid gap-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="liquid-card group rounded-[1.5rem] p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold tracking-[-0.02em] text-white">
                    {question}
                    <ChevronDown className="h-5 w-5 text-white/42 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 leading-7 text-white/56">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="liquid-panel apple-container rounded-[2.25rem] p-8 text-center sm:p-12">
            <Eyebrow icon={Sparkles}>Ready to connect</Eyebrow>
            <h2 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl">
              Start a private <GradientWord>OmegleX</GradientWord> room.
            </h2>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton onClick={() => begin(CHAT_MODES.VIDEO)} disabled={Boolean(startingMode)}>Start video</CTAButton>
              <CTAButton ghost onClick={() => begin(CHAT_MODES.TEXT)} disabled={Boolean(startingMode)}>Start text</CTAButton>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
