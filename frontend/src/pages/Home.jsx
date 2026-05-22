import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Mic,
  ShieldCheck,
  Sparkles,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { useAppStore } from "../store/appStore.js";
import { CHAT_MODES, SOCKET_STATUS } from "../utils/constants.js";
import heroVideoCall from "../assets/illustrations/hero_video_call.svg";
import step1Choose from "../assets/illustrations/step1_choose.svg";
import step2Match from "../assets/illustrations/step2_match.svg";
import step3Talk from "../assets/illustrations/step3_talk.svg";
import safetyShield from "../assets/illustrations/safety_shield.svg";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Video,
    title: "Direct WebRTC media",
    body: "Video and audio move peer-to-peer after signaling, giving each room a fast live feel.",
    tint: "bg-[#0071e3]/10 text-[#0071e3]",
  },
  {
    icon: MessageSquareText,
    title: "Text-first option",
    body: "Start lightweight socket chat without camera or microphone pressure.",
    tint: "bg-[#34c759]/10 text-[#34c759]",
  },
  {
    icon: LockKeyhole,
    title: "Private room scope",
    body: "Participant-checked messages, offers, answers, and ICE candidates stay isolated.",
    tint: "bg-[#af52de]/10 text-[#af52de]",
  },
  {
    icon: Globe2,
    title: "Global discovery",
    body: "A clean queue pairs active sockets without feed noise or account friction.",
    tint: "bg-[#ff9f0a]/10 text-[#ff9f0a]",
  },
  {
    icon: ShieldCheck,
    title: "Safety by default",
    body: "Visible privacy cues make the room feel calmer before the first hello.",
    tint: "bg-[#ff375f]/10 text-[#ff375f]",
  },
  {
    icon: Zap,
    title: "Fast next partner",
    body: "Switch partners without a page reload while media renegotiates cleanly.",
    tint: "bg-[#5ac8fa]/12 text-[#5ac8fa]",
  },
];

const steps = [
  {
    number: "01",
    eyebrow: "Choose your room",
    title: "Start with video or text, then let the queue do the work.",
    body: "OmegleX keeps entry simple: choose the room type, connect to the socket, and wait in a focused matching state.",
    points: ["No dashboard detour", "No account wall", "Mode stays explicit"],
    image: step1Choose,
  },
  {
    number: "02",
    eyebrow: "Match privately",
    title: "A matched room is scoped to only two active participants.",
    body: "The room model stays tight so messages, offers, answers, and ICE candidates are accepted only from matched sockets.",
    points: ["Participant checks", "Session versioning", "Clean stale event guards"],
    image: step2Match,
  },
  {
    number: "03",
    eyebrow: "Move smoothly",
    title: "Skip to the next person without breaking the session.",
    body: "The requester stays stable, the old partner can re-enter matchmaking, and the next peer renegotiates cleanly.",
    points: ["No reload", "No route change", "Fresh peer connection"],
    image: step3Talk,
  },
];

const faqs = [
  ["Is this only a landing page?", "No. The CTAs connect to the real socket queue and route users into the live chat experience."],
  ["Does video go through the backend?", "The backend handles signaling and matchmaking. Browser media is WebRTC peer-to-peer once connected."],
  ["Can users skip partners?", "Yes. The next-partner flow resets the peer connection and searches again without page refresh."],
  ["Is the room private?", "Room events are scoped to the matched participants and stale session events are ignored."],
];

const footerColumns = [
  ["Explore", "Video room", "Text room", "Queue system", "Next partner"],
  ["Platform", "Private signaling", "WebRTC media", "Socket rooms", "Mobile support"],
  ["Safety", "Room isolation", "Stale event guards", "Participant checks", "Moderation ready"],
  ["Company", "Status", "Privacy", "Terms", "Contact"],
];

function AmbientOrbs() {
  return (
    <div className="light-orbs" aria-hidden="true">
      <span />
    </div>
  );
}

function Eyebrow({ icon: Icon = Sparkles, children }) {
  return (
    <span className="liquid-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#6e6e73]">
      <Icon className="h-4 w-4 text-[#0071e3]" />
      {children}
    </span>
  );
}

function GradientWord({ children }) {
  return (
    <span className="bg-gradient-to-r from-[#0071e3] to-[#af52de] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function CTAButton({ children, secondary = false, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={secondary ? "apple-secondary-cta disabled:opacity-50" : "apple-primary-cta disabled:opacity-50"}
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
      <h2 className="mt-7 text-4xl font-semibold leading-[0.96] tracking-[-0.03em] text-[#1d1d1f] sm:text-6xl lg:text-7xl">{title}</h2>
      {body ? <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6e6e73] sm:text-xl">{body}</p> : null}
    </motion.div>
  );
}

function HeroIllustration({ signalLabel }) {
  return (
    <motion.div variants={fadeUp} className="relative">
      <div className="hero-illustration-card relative mx-auto max-w-[580px] p-8 sm:p-10">
        <img src={heroVideoCall} alt="" aria-hidden="true" className="mx-auto w-full max-w-[520px]" />
        <div className="liquid-panel absolute -left-3 top-8 hidden rounded-3xl px-4 py-3 sm:block">
          <p className="text-xs font-semibold text-[#6e6e73]">Signal</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
            <Wifi className="h-4 w-4 text-[#34c759]" />
            {signalLabel}
          </p>
        </div>
        <div className="liquid-panel absolute -right-2 bottom-8 hidden rounded-3xl px-4 py-3 sm:block">
          <p className="text-xs font-semibold text-[#6e6e73]">Private room</p>
          <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">2 active sockets</p>
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
      whileHover={{ y: -8, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
      className="liquid-card min-h-[18rem] rounded-3xl p-6"
    >
      <div className={`feature-icon ${feature.tint}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-10 text-sm font-semibold text-[#86868b]">0{index + 1}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">{feature.title}</h3>
      <p className="mt-4 leading-7 text-[#6e6e73]">{feature.body}</p>
    </motion.article>
  );
}

function StepVisual({ step }) {
  return (
    <div className="liquid-panel relative min-h-[28rem] overflow-hidden rounded-[2rem] p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,113,227,0.08),transparent_36%),radial-gradient(circle_at_80%_76%,rgba(175,82,222,0.06),transparent_40%)]" />
      <div className="relative flex min-h-[22rem] items-center justify-center">
        <img src={step.image} alt="" aria-hidden="true" className="w-full max-w-[450px]" />
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
        <div className="absolute -left-3 -top-20 text-[10rem] font-semibold leading-none tracking-[-0.08em] text-black/[0.045] sm:text-[14rem]">
          {step.number}
        </div>
        <div className="relative">
          <Eyebrow icon={Sparkles}>{step.eyebrow}</Eyebrow>
          <h3 className="mt-7 text-4xl font-semibold leading-[0.96] tracking-[-0.03em] text-[#1d1d1f] sm:text-6xl">{step.title}</h3>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#6e6e73]">{step.body}</p>
          <div className="mt-8 grid gap-3">
            {step.points.map((point) => (
              <div key={point} className="flex items-center gap-3 text-[#1d1d1f]">
                <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div variants={fadeUp}>
        <StepVisual step={step} />
      </motion.div>
    </motion.article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/[0.08] bg-[#f5f5f7] text-[#6e6e73]">
      <div className="apple-container py-10">
        <p className="max-w-4xl text-[11px] leading-5">
          OmegleX is a live social discovery product. Always follow local laws, respect other people, and leave a room whenever a
          conversation does not feel right. Availability of video, audio, and signaling features may vary by browser and network.
        </p>
        <div className="mt-8 grid gap-8 border-t border-black/[0.08] pt-8 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map(([title, ...items]) => (
            <div key={title}>
              <h3 className="font-semibold text-[#1d1d1f]">{title}</h3>
              <ul className="mt-3 grid gap-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="/" className="transition hover:text-[#1d1d1f]" onClick={(event) => event.preventDefault()}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-black/[0.08] pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 OmegleX. All rights reserved.</p>
          <p>Privacy Policy | Terms of Use | Legal | Site Map</p>
        </div>
      </div>
    </footer>
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
    <AppShell>
      <AmbientOrbs />
      <main className="relative overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
        <section className="hero-glow relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-28 sm:px-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="apple-container relative z-10 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div variants={fadeUp}>
                <Eyebrow>OmegleX private live rooms</Eyebrow>
              </motion.div>
              <motion.h1 variants={fadeUp} className="mt-8 max-w-2xl text-6xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#1d1d1f] sm:text-7xl lg:text-[5.8rem]">
                Meet strangers.
                <br />
                Feel <GradientWord>in control.</GradientWord>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-7 max-w-xl text-xl leading-8 text-[#6e6e73] sm:text-2xl sm:leading-10">
                Random video and text conversations redesigned as a calm, private, real-time social experience.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
                <CTAButton onClick={() => begin(CHAT_MODES.VIDEO)} disabled={Boolean(startingMode)}>
                  {startingMode === CHAT_MODES.VIDEO ? "Joining..." : "Start video"}
                </CTAButton>
                <CTAButton secondary onClick={() => begin(CHAT_MODES.TEXT)} disabled={Boolean(startingMode)}>
                  {startingMode === CHAT_MODES.TEXT ? "Joining..." : "Start text"}
                </CTAButton>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["Private", "signaling"],
                  ["Clean", "queue"],
                  ["No", "refresh"],
                ].map(([value, label]) => (
                  <div key={label} className="liquid-card rounded-3xl p-4">
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">{value}</p>
                    <p className="mt-1 text-sm text-[#6e6e73]">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
            <HeroIllustration signalLabel={signalLabel} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-[#86868b]"
          >
            Scroll
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </section>

        <section className="apple-section features-glow bg-white">
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
              className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        <section className="apple-section how-glow bg-[#f5f5f7]">
          <div className="apple-container grid gap-32">
            {steps.map((step, index) => (
              <StepSection key={step.title} step={step} reverse={index % 2 === 1} />
            ))}
          </div>
        </section>

        <section className="apple-section stats-glow bg-white">
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
                  [Globe2, "Global queue", "Real-time discovery", "#ff9f0a"],
                  [Mic, "Media ready", "Camera and microphone controls", "#0071e3"],
                  [Zap, "Fast skip", "No page refresh", "#34c759"],
                ].map(([Icon, title, body, color]) => (
                  <div key={title} className="liquid-card rounded-[1.5rem] p-5">
                    <Icon className="h-6 w-6" style={{ color }} />
                    <h3 className="mt-7 text-xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6e6e73]">{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="apple-section safety-glow bg-[#f5f5f7]">
          <div className="apple-container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }}>
              <Eyebrow icon={ShieldCheck}>Safety and room privacy</Eyebrow>
              <h2 className="mt-7 text-4xl font-semibold leading-[0.96] tracking-[-0.03em] text-[#1d1d1f] sm:text-6xl">
                Calm by design.
                <br />
                Guarded by <GradientWord>room rules.</GradientWord>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#6e6e73]">
                The frontend makes safety feel visible while the backend keeps queue, room, and WebRTC events scoped to the active session.
              </p>
              <div className="mt-8 grid gap-3">
                {["Participant-checked messages", "Stale ICE candidate protection", "Clean disconnect recovery"].map((point) => (
                  <div key={point} className="flex items-center gap-3 text-[#1d1d1f]">
                    <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }} className="liquid-panel rounded-[2rem] p-8">
              <img src={safetyShield} alt="" aria-hidden="true" className="mx-auto w-full max-w-[500px]" />
            </motion.div>
          </div>
        </section>

        <section className="apple-section bg-white">
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
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                    {question}
                    <ChevronDown className="h-5 w-5 text-[#6e6e73] transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 leading-7 text-[#6e6e73]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="hero-glow relative overflow-hidden bg-[#f5f5f7] px-4 py-24 sm:px-6">
          <div className="liquid-panel apple-container relative z-10 rounded-[2.25rem] p-8 text-center sm:p-12">
            <Eyebrow icon={Sparkles}>Ready to connect</Eyebrow>
            <h2 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-[#1d1d1f] sm:text-7xl">
              Start a private <GradientWord>OmegleX</GradientWord> room.
            </h2>
            <div className="mt-9 flex flex-col justify-center gap-2 sm:flex-row">
              <CTAButton onClick={() => begin(CHAT_MODES.VIDEO)} disabled={Boolean(startingMode)}>Start video</CTAButton>
              <CTAButton secondary onClick={() => begin(CHAT_MODES.TEXT)} disabled={Boolean(startingMode)}>Start text</CTAButton>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppShell>
  );
}
