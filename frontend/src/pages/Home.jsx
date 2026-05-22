import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Mic,
  Play,
  Radar,
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
import heroStudio from "../assets/studio/hero-studio.jpg";
import featuresStudio from "../assets/studio/features-studio.jpg";
import flowStudio from "../assets/studio/flow-studio.jpg";
import safetyStudio from "../assets/studio/safety-studio.jpg";
import chatUiStudio from "../assets/studio/chat-ui-studio.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.82, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const features = [
  {
    icon: Video,
    title: "Direct WebRTC media",
    body: "Video and audio move peer-to-peer after signaling, giving every room a fast live feel.",
    tint: "from-[#0071e3] to-[#5ac8fa]",
  },
  {
    icon: MessageSquareText,
    title: "Text-first option",
    body: "Start lightweight socket chat without camera or microphone pressure.",
    tint: "from-[#34c759] to-[#9be15d]",
  },
  {
    icon: LockKeyhole,
    title: "Private room scope",
    body: "Participant-checked messages, offers, answers, and ICE candidates stay isolated.",
    tint: "from-[#af52de] to-[#ff9f0a]",
  },
  {
    icon: Globe2,
    title: "Global discovery",
    body: "A clean queue pairs active sockets without feed noise or account friction.",
    tint: "from-[#ff9f0a] to-[#ff375f]",
  },
  {
    icon: ShieldCheck,
    title: "Safety by default",
    body: "Visible privacy cues make the room feel calmer before the first hello.",
    tint: "from-[#ff375f] to-[#af52de]",
  },
  {
    icon: Zap,
    title: "Fast next partner",
    body: "Switch partners without a page reload while media renegotiates cleanly.",
    tint: "from-[#5ac8fa] to-[#0071e3]",
  },
];

const steps = [
  {
    number: "01",
    eyebrow: "Choose signal",
    title: "Pick video or text without leaving the moment.",
    body: "The first interaction stays simple: choose a mode, enter the queue, and let the room system prepare a clean match.",
    points: ["No account wall", "Explicit mode control", "Stable local session"],
  },
  {
    number: "02",
    eyebrow: "Match privately",
    title: "Two active sockets enter one scoped room.",
    body: "Messages and WebRTC signaling are accepted only from matched participants, with stale session events ignored.",
    points: ["Participant checks", "Session versioning", "Scoped WebRTC events"],
  },
  {
    number: "03",
    eyebrow: "Move forward",
    title: "Find the next person without breaking the room.",
    body: "The requester keeps local media stable, the old peer can rejoin the queue, and the next peer renegotiates cleanly.",
    points: ["No page refresh", "Clean peer reset", "Smooth next-partner flow"],
  },
];

const reactions = [
  ["Feels private", "The room tells me exactly what is happening."],
  ["No awkward reset", "Next partner feels instant instead of broken."],
  ["Actually premium", "It looks like a product, not a demo."],
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
    <div className="studio-ambient" aria-hidden="true">
      <span />
    </div>
  );
}

function Eyebrow({ icon: Icon = Sparkles, children, className = "" }) {
  return (
    <span className={`studio-eyebrow ${className}`}>
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function GradientWord({ children }) {
  return (
    <span className="bg-gradient-to-r from-[#0071e3] via-[#af52de] to-[#ff375f] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function CTAButton({ children, secondary = false, onClick, disabled, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={secondary ? "studio-cta-secondary disabled:opacity-50" : "studio-cta-primary disabled:opacity-50"}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function SectionIntro({ eyebrow, title, body, icon, align = "center" }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className={align === "left" ? "max-w-3xl" : "mx-auto max-w-4xl text-center"}
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.055em] text-[#111115] sm:text-6xl lg:text-7xl">
        {title}
      </h2>
      {body ? <p className="mt-6 max-w-2xl text-lg leading-8 text-[#62626c] sm:text-xl">{body}</p> : null}
    </motion.div>
  );
}

function StudioImage({ src, alt = "", className = "", loading = "eager", fetchPriority, children }) {
  return (
    <div className={`studio-art-card ${className}`}>
      <img
        src={src}
        alt={alt}
        aria-hidden={alt ? undefined : "true"}
        loading={loading}
        fetchPriority={fetchPriority}
        className="h-full w-full object-cover"
      />
      <div className="studio-art-sheen" aria-hidden="true" />
      {children}
    </div>
  );
}

function HeroVisual({ signalLabel }) {
  return (
    <motion.div variants={fadeUp} className="relative min-h-[31rem] lg:min-h-[38rem]">
      <div className="studio-orbit" aria-hidden="true" />
      <StudioImage
        src={heroStudio}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-x-0 top-6 mx-auto h-[28rem] max-w-[42rem] rounded-[2.5rem] lg:h-[33rem]"
      >
        <div className="absolute left-5 top-5 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold text-[#111115] shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
          Live room preview
        </div>
        <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
          {[
            [Users, "2 people", "room scoped"],
            [Wifi, signalLabel, "socket ready"],
            [ShieldCheck, "private", "events guarded"],
          ].map(([Icon, title, caption]) => (
            <div key={title} className="rounded-3xl border border-white/70 bg-white/72 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
              <Icon className="h-4 w-4 text-[#0071e3]" />
              <p className="mt-2 text-sm font-semibold text-[#111115]">{title}</p>
              <p className="text-xs text-[#62626c]">{caption}</p>
            </div>
          ))}
        </div>
      </StudioImage>
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="studio-floating-card left-0 top-2 hidden w-56 lg:block"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a95]">Partner found</p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111115]">Fresh stranger connected.</p>
      </motion.div>
      <motion.div
        animate={{ y: [0, 12, 0], rotate: [1, -1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="studio-floating-card bottom-6 right-0 hidden w-64 lg:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071e3] text-white">
            <Play className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111115]">Next partner</p>
            <p className="text-xs text-[#62626c]">Peer reset, no page refresh</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -10, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
      className="studio-card group min-h-[18rem] p-6"
    >
      <div className={`flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${feature.tint} text-white shadow-[0_16px_36px_rgba(0,113,227,0.18)]`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-9 text-sm font-semibold text-[#8a8a95]">0{index + 1}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111115]">{feature.title}</h3>
      <p className="mt-4 leading-7 text-[#62626c]">{feature.body}</p>
      <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
    </motion.article>
  );
}

function StepRow({ step, index }) {
  const reverse = index % 2 === 1;

  return (
    <motion.article
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className={`grid items-center gap-10 lg:grid-cols-[0.82fr_1fr] ${reverse ? "lg:grid-cols-[1fr_0.82fr]" : ""}`}
    >
      <motion.div variants={fadeUp} className={reverse ? "lg:order-2" : ""}>
        <div className="relative">
          <span className="absolute -left-4 -top-16 text-[8rem] font-semibold leading-none tracking-[-0.08em] text-black/[0.045] sm:text-[12rem]">
            {step.number}
          </span>
          <div className="relative">
            <Eyebrow icon={Radar}>{step.eyebrow}</Eyebrow>
            <h3 className="mt-6 text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#111115] sm:text-6xl">
              {step.title}
            </h3>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#62626c]">{step.body}</p>
            <div className="mt-8 grid gap-3">
              {step.points.map((point) => (
                <div key={point} className="flex items-center gap-3 text-[#202027]">
                  <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
                  <span className="font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div variants={fadeUp} className={reverse ? "lg:order-1" : ""}>
        <div className="studio-flow-panel">
          <img src={flowStudio} alt="" aria-hidden="true" loading="eager" className="h-full w-full rounded-[2rem] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/55" />
          <div className="absolute bottom-5 left-5 rounded-3xl border border-white/70 bg-white/75 px-4 py-3 shadow-[0_16px_38px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold text-[#111115]">Flow node {step.number}</p>
            <p className="text-xs text-[#62626c]">Queue to room to reconnect</p>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/[0.08] bg-[#f7f5ef] text-[#62626c]">
      <div className="studio-container py-10">
        <p className="max-w-4xl text-[11px] leading-5">
          OmegleX is a live social discovery product. Always follow local laws, respect other people, and leave a room whenever a
          conversation does not feel right. Availability of video, audio, and signaling features may vary by browser and network.
        </p>
        <div className="mt-8 grid gap-8 border-t border-black/[0.08] pt-8 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map(([title, ...items]) => (
            <div key={title}>
              <h3 className="font-semibold text-[#111115]">{title}</h3>
              <ul className="mt-3 grid gap-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="/" className="transition hover:text-[#111115]" onClick={(event) => event.preventDefault()}>
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
  const isStarting = Boolean(startingMode);

  return (
    <AppShell>
      <AmbientOrbs />
      <main className="studio-page relative overflow-hidden">
        <section className="studio-hero relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:pb-10 lg:pt-24">
          <motion.div variants={stagger} initial="hidden" animate="show" className="studio-container relative z-10 grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative">
              <motion.div variants={fadeUp}>
                <Eyebrow>OmegleX signal studio</Eyebrow>
              </motion.div>
              <motion.h1 variants={fadeUp} className="mt-7 max-w-3xl text-6xl font-semibold leading-[0.86] tracking-[-0.075em] text-[#111115] sm:text-7xl lg:text-[5.85rem] xl:text-[6.4rem]">
                Random chat,
                <br />
                rebuilt as a <GradientWord>living room.</GradientWord>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-xl leading-8 text-[#62626c] sm:text-xl sm:leading-9">
                Random video and text conversations redesigned as a calm, private, real-time social experience.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.VIDEO ? "Opening room..." : "Start video room"}
                </CTAButton>
                <CTAButton secondary icon={MessageSquareText} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.TEXT ? "Opening text..." : "Start text room"}
                </CTAButton>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["Private", "signaling"],
                  ["Clean", "queue"],
                  ["No", "refresh"],
                ].map(([value, label]) => (
                  <div key={label} className="studio-stat-card">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-[#111115] sm:text-3xl">{value}</p>
                    <p className="mt-1 text-sm text-[#62626c]">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
            <HeroVisual signalLabel={signalLabel} />
          </motion.div>
        </section>

        <section className="studio-section bg-[#fbfbfd]">
          <div className="studio-container">
            <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <SectionIntro
                align="left"
                eyebrow="Live product architecture"
                title={
                  <>
                    Every signal has a <GradientWord>visual place.</GradientWord>
                  </>
                }
                body="The interface turns matchmaking, privacy, WebRTC, and next-partner switching into one coherent product story."
                icon={Sparkles}
              />
              <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }} className="studio-wide-art">
                <img src={featuresStudio} alt="" aria-hidden="true" loading="eager" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/0 to-white/5" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                  {["Queue", "WebRTC", "Safety", "Next"].map((item) => (
                    <span key={item} className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#111115] shadow-sm backdrop-blur-xl">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        <section className="studio-section bg-[#f7f5ef]">
          <div className="studio-container grid gap-24">
            <SectionIntro
              eyebrow="How matching feels"
              title={
                <>
                  From queue to room in three <GradientWord>clean moves.</GradientWord>
                </>
              }
              body="The backend stays serious. The frontend makes the flow obvious, responsive, and emotionally calm."
              icon={Radar}
            />
            {steps.map((step, index) => (
              <StepRow key={step.title} step={step} index={index} />
            ))}
          </div>
        </section>

        <section className="studio-section bg-[#fbfbfd]">
          <div className="studio-container grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }}>
              <Eyebrow icon={ShieldCheck}>Safety and room privacy</Eyebrow>
              <h2 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.055em] text-[#111115] sm:text-6xl lg:text-7xl">
                Calm by design.
                <br />
                Guarded by <GradientWord>room rules.</GradientWord>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#62626c]">
                The frontend makes safety visible while the backend keeps queue, room, and WebRTC events scoped to the active session.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Participant checks", "Stale ICE guards", "Disconnect recovery"].map((point) => (
                  <div key={point} className="studio-mini-card">
                    <ShieldCheck className="h-5 w-5 text-[#34c759]" />
                    <p className="mt-3 text-sm font-semibold text-[#111115]">{point}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }}>
              <StudioImage src={safetyStudio} className="h-[32rem] rounded-[2.5rem]">
                <div className="absolute right-5 top-5 rounded-3xl border border-white/75 bg-white/75 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a95]">Room safety</p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#111115]">Scoped events only</p>
                </div>
              </StudioImage>
            </motion.div>
          </div>
        </section>

        <section className="studio-section bg-[#eef4ff]">
          <div className="studio-container grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }} className="studio-chat-showcase">
              <img src={chatUiStudio} alt="" aria-hidden="true" loading="eager" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-white/5 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
                {[
                  [Mic, "Local media", "stable"],
                  [MessageCircle, "Room chat", "slide-in"],
                  [Zap, "Next", "instant"],
                ].map(([Icon, title, body]) => (
                  <div key={title} className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_16px_38px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
                    <Icon className="h-5 w-5 text-[#0071e3]" />
                    <p className="mt-3 text-sm font-semibold text-[#111115]">{title}</p>
                    <p className="text-xs text-[#62626c]">{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }}>
              <Eyebrow icon={Video}>Actual chat UI</Eyebrow>
              <h2 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.055em] text-[#111115] sm:text-6xl">
                Full-screen when it matters.
                <br />
                Chat when it helps.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#62626c]">
                Video takes the stage, local preview stays readable, controls float near the thumb zone, and messages never push the layout around.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Try video</CTAButton>
                <CTAButton secondary icon={ArrowRight} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Open text room</CTAButton>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="studio-section bg-[#fbfbfd]">
          <div className="studio-container">
            <SectionIntro
              eyebrow="Social proof"
              title={
                <>
                  The room should feel <GradientWord>alive</GradientWord> before anyone speaks.
                </>
              }
              body="Small cues, real states, and polished motion make the product feel trustworthy from the first second."
              icon={Users}
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="mt-12 grid gap-4 md:grid-cols-3"
            >
              {reactions.map(([title, body], index) => (
                <motion.div key={title} variants={fadeUp} className="studio-card relative p-6">
                  <div className="absolute right-5 top-5 flex -space-x-2" aria-hidden="true">
                    {[0, 1, 2].map((offset) => (
                      <span
                        key={offset}
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${["#0071e3", "#af52de", "#34c759", "#ff9f0a", "#ff375f"][index + offset]}, #ffffff)`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[#111115]">{title}</p>
                  <p className="mt-4 leading-7 text-[#62626c]">{body}</p>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a95]">User reaction</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="studio-section bg-[#f7f5ef]">
          <div className="studio-container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <SectionIntro
              align="left"
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
                <details key={question} className="studio-card group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold tracking-[-0.02em] text-[#111115]">
                    {question}
                    <ChevronDown className="h-5 w-5 text-[#62626c] transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 leading-7 text-[#62626c]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#fbfbfd] px-4 py-24 sm:px-6">
          <div className="studio-container">
            <div className="studio-final-cta">
              <div className="relative z-10 max-w-3xl">
                <Eyebrow icon={Sparkles}>Ready to connect</Eyebrow>
                <h2 className="mt-6 text-5xl font-semibold leading-[0.88] tracking-[-0.06em] text-[#111115] sm:text-7xl">
                  Start a private <GradientWord>OmegleX</GradientWord> room.
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#62626c]">
                  The product is built for quick entry, clean matching, stable media, and a clear next-partner path.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Start video</CTAButton>
                  <CTAButton secondary icon={MessageSquareText} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Start text</CTAButton>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="absolute -right-24 bottom-0 hidden h-[24rem] w-[34rem] rotate-[-8deg] rounded-[2rem] bg-cover bg-center opacity-80 shadow-[0_34px_80px_rgba(0,0,0,0.18)] lg:block"
                style={{ backgroundImage: `url(${heroStudio})` }}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppShell>
  );
}
