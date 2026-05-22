import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText, ShieldCheck, Sparkles, Video, Zap } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { CHAT_MODES } from "../utils/constants.js";
import heroStudio from "../assets/studio/hero-studio.jpg";
import featuresStudio from "../assets/studio/features-studio.jpg";
import flowStudio from "../assets/studio/flow-studio.jpg";
import safetyStudio from "../assets/studio/safety-studio.jpg";
import chatUiStudio from "../assets/studio/chat-ui-studio.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const highlights = [
  ["Video", "Start face to face"],
  ["Text", "Keep it simple"],
  ["Next", "Move on anytime"],
];

const steps = [
  ["01", "Choose a room"],
  ["02", "Meet someone live"],
  ["03", "Skip when you want"],
];

function Eyebrow({ children }) {
  return (
    <span className="dark-eyebrow">
      <Sparkles className="h-4 w-4" />
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
      className={secondary ? "dark-cta-secondary disabled:opacity-50" : "dark-cta-primary disabled:opacity-50"}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function SectionImage({ src, className = "" }) {
  return (
    <div className={`dark-image-stage ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="eager" className="h-full w-full object-contain" />
    </div>
  );
}

function StorySection({ eyebrow, title, body, image, reverse = false, children }) {
  return (
    <section className="dark-story-section">
      <img src={image} alt="" aria-hidden="true" loading="eager" className="dark-section-bg-image" />
      <div className={`dark-container grid items-center gap-8 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl">{title}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/64 sm:text-lg">{body}</p>
          {children}
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
          <SectionImage src={image} />
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { startQueue } = useQueue();
  const [startingMode, setStartingMode] = useState(null);

  const begin = async (mode) => {
    setStartingMode(mode);
    const queued = await startQueue(mode);
    setStartingMode(null);
    if (queued) navigate("/chat");
  };

  const isStarting = Boolean(startingMode);

  return (
    <AppShell variant="dark">
      <main className="dark-home relative overflow-hidden">
        <section className="dark-hero">
          <div className="dark-container relative z-10 grid min-h-[calc(100svh-56px)] items-center gap-10 pb-12 pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:pt-20">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <Eyebrow>OmegleX</Eyebrow>
              </motion.div>
              <motion.h1 variants={fadeUp} className="mt-6 max-w-3xl text-6xl font-semibold leading-[0.84] tracking-[-0.08em] text-white sm:text-7xl lg:text-[6.2rem]">
                Meet a stranger.
                <br />
                Keep the vibe.
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-white/66 sm:text-xl">
                Live video and text rooms with a cleaner, safer, more premium feel.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.VIDEO ? "Opening..." : "Start video"}
                </CTAButton>
                <CTAButton secondary icon={MessageSquareText} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.TEXT ? "Opening..." : "Start text"}
                </CTAButton>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {highlights.map(([title, body]) => (
                  <div key={title} className="dark-mini-panel">
                    <p className="text-lg font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/54">{body}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <SectionImage src={heroStudio} className="dark-hero-image" />
            </motion.div>
          </div>
        </section>

        <StorySection
          eyebrow="Discovery"
          title="Less noise. More presence."
          body="A first screen that feels like a real social product, not a technical demo."
          image={featuresStudio}
        >
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {["Live rooms", "Quick skip", "Private feel"].map((item) => (
              <div key={item} className="dark-pill-card">{item}</div>
            ))}
          </div>
        </StorySection>

        <section className="dark-flow-section">
          <div className="dark-container">
            <div className="dark-bg-frame">
              <img src={flowStudio} alt="" aria-hidden="true" loading="eager" className="dark-bg-image" />
              <div className="relative z-10 max-w-2xl">
                <Eyebrow>How it works</Eyebrow>
                <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl">
                  Three taps. One live room.
                </h2>
              </div>
              <div className="relative z-10 mt-10 grid gap-3 md:grid-cols-3">
                {steps.map(([number, label]) => (
                  <div key={number} className="dark-step-card">
                    <p className="text-sm font-semibold text-white/44">{number}</p>
                    <p className="mt-4 text-xl font-semibold text-white">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <StorySection
          eyebrow="Safety"
          title="A calmer room."
          body="Clear controls, visible status, and a layout that never feels messy."
          image={safetyStudio}
          reverse
        >
          <div className="mt-7 flex flex-wrap gap-3">
            {["Private by feel", "Easy exit", "Simple status"].map((item) => (
              <span key={item} className="dark-inline-chip">
                <ShieldCheck className="h-4 w-4" />
                {item}
              </span>
            ))}
          </div>
        </StorySection>

        <StorySection
          eyebrow="Live UI"
          title="Video first. Chat when needed."
          body="The room stays focused on the person, with chat and controls available without taking over."
          image={chatUiStudio}
        >
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Try video</CTAButton>
            <CTAButton secondary icon={ArrowRight} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Try text</CTAButton>
          </div>
        </StorySection>

        <section className="dark-final-section">
          <div className="dark-container">
            <div className="dark-final-card">
              <div>
                <Eyebrow>Ready</Eyebrow>
                <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-white sm:text-7xl">
                  Start OmegleX.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Start video</CTAButton>
                <CTAButton secondary icon={Zap} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Start text</CTAButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
