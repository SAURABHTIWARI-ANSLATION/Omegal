import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Zap,
} from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import { useQueue } from "../hooks/useQueue.js";
import { CHAT_MODES } from "../utils/constants.js";
import heroStudio from "../assets/studio/hero-studio.jpg";
import featuresStudio from "../assets/studio/features-studio.jpg";
import flowStudio from "../assets/studio/flow-studio.jpg";
import safetyStudio from "../assets/studio/safety-studio.jpg";
import chatUiStudio from "../assets/studio/chat-ui-studio.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const featurePanels = [
  {
    icon: Video,
    title: "Live in seconds",
    body: "Open a video room fast, with a layout that keeps the person in focus.",
  },
  {
    icon: LockKeyhole,
    title: "Private by feel",
    body: "Clear room states, simple controls, and no noisy account wall.",
  },
  {
    icon: Zap,
    title: "Skip anytime",
    body: "Move to the next conversation without making the whole app feel broken.",
  },
];

const steps = [
  ["01", "Choose video or text", "Start with the mode that feels right."],
  ["02", "Meet someone live", "The room opens into a clean, focused conversation."],
  ["03", "Keep moving", "Leave, skip, or continue without friction."],
];

const proof = [
  ["Fast rooms", "No heavy signup flow before the first hello."],
  ["Clean chat", "Messages stay readable without shifting the room."],
  ["Mobile ready", "Controls stay near the thumb zone on small screens."],
];

const faqs = [
  ["Do I need an account?", "No. Open a room and start talking."],
  ["Can I use text only?", "Yes. Text rooms are available when camera is not needed."],
  ["Can I skip?", "Yes. Use Next whenever the vibe is not right."],
];

function Eyebrow({ children, icon: Icon = Sparkles }) {
  return (
    <span className="ox-eyebrow">
      <Icon className="h-4 w-4" />
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
      className={secondary ? "ox-cta ox-cta-secondary disabled:opacity-50" : "ox-cta ox-cta-primary disabled:opacity-50"}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function SectionIntro({ eyebrow, title, body, icon, light = false }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className={light ? "ox-section-intro ox-section-intro-light" : "ox-section-intro"}
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </motion.div>
  );
}

function MiniVisual({ title, body, icon: Icon }) {
  return (
    <motion.article variants={fadeUp} className="ox-mini-visual-card">
      <span><Icon className="h-5 w-5" /></span>
      <h3>{title}</h3>
      <p>{body}</p>
    </motion.article>
  );
}

function ImageStage({ src, className = "" }) {
  return (
    <div className={`ox-image-stage ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="eager" />
    </div>
  );
}

function HeroMockup() {
  return (
    <motion.div variants={fadeUp} className="ox-hero-device" aria-hidden="true">
      <div className="ox-device-top">
        <span className="ox-live-dot" />
        Live room
      </div>
      <div className="ox-device-call">
        <div>
          <p>Stranger</p>
          <strong>Online now</strong>
        </div>
        <div className="ox-avatar-stack">
          {["maya", "noah", "zara"].map((name) => (
            <img key={name} src={`/assets/avatars/${name}.svg`} alt="" />
          ))}
        </div>
      </div>
      <div className="ox-device-controls">
        <span><Video className="h-4 w-4" /></span>
        <span><MessageCircle className="h-4 w-4" /></span>
        <span><ArrowRight className="h-4 w-4" /></span>
      </div>
    </motion.div>
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
    <AppShell>
      <main className="ox-page">
        <section className="ox-hero">
          <img src={heroStudio} alt="" aria-hidden="true" className="ox-hero-bg" />
          <div className="ox-hero-grid" aria-hidden="true" />
          <motion.div variants={stagger} initial="hidden" animate="show" className="ox-hero-content">
            <div className="ox-hero-copy">
              <motion.div variants={fadeUp}>
                <Eyebrow>Next-gen anonymous chat</Eyebrow>
              </motion.div>
              <motion.h1 variants={fadeUp} className="ox-hero-title">
                <span>Meet</span>
                <span className="ghost">strangers.</span>
                <span>Keep the</span>
                <span className="vibe">vibe.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="ox-hero-subtitle">
                Live video and text rooms that feel like a premium social product. Real people, zero noise, total privacy.
              </motion.p>
              <motion.div variants={fadeUp} className="ox-hero-actions">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.VIDEO ? "Opening..." : "Start Video"}
                </CTAButton>
                <CTAButton secondary icon={MessageSquareText} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>
                  {startingMode === CHAT_MODES.TEXT ? "Opening..." : "Text Chat"}
                </CTAButton>
              </motion.div>
            </div>
            <HeroMockup />
          </motion.div>
        </section>

        <section className="ox-proof-strip">
          <div className="ox-container ox-proof-grid">
            {proof.map(([title, body]) => (
              <motion.article key={title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="ox-proof-card">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="ox-section ox-showcase-section">
          <div className="ox-container ox-showcase-shell">
            <div className="ox-showcase-art">
              <img src={featuresStudio} alt="" aria-hidden="true" />
              <div className="ox-showcase-chip ox-chip-one">
                <span className="ox-live-dot" />
                People online
              </div>
              <div className="ox-showcase-chip ox-chip-two">
                <Sparkles className="h-4 w-4" />
                Clean room flow
              </div>
            </div>
            <SectionIntro
              eyebrow="Discovery"
              title="A room that feels alive before anyone speaks."
              body="The interface gives users instant confidence: what to do, where to look, and how to move on."
              icon={Globe2}
            />
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="ox-feature-grid">
              {featurePanels.map((item) => {
                return <MiniVisual key={item.title} {...item} />;
              })}
            </motion.div>
          </div>
        </section>

        <section className="ox-section ox-how-section">
          <div className="ox-container ox-how-shell">
            <div>
              <SectionIntro
                eyebrow="How it works"
                title="Three steps. One clean conversation."
                body="A simple path from choice to connection, designed for phones first and desktop second."
                icon={Sparkles}
              />
            </div>
            <div className="ox-flow-board">
              <img src={flowStudio} alt="" aria-hidden="true" />
              <div className="ox-step-list">
                {steps.map(([number, title, body]) => (
                  <motion.article key={number} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="ox-step-card">
                    <strong>{number}</strong>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ox-section ox-safety-section">
          <div className="ox-container ox-split ox-split-reverse">
            <ImageStage src={safetyStudio} className="ox-safety-stage" />
            <div>
              <SectionIntro
                eyebrow="Safety"
                title="Private, calm, and easy to leave."
                body="Safety should not feel like a settings page. It should be visible in the room, the controls, and the flow."
                icon={ShieldCheck}
              />
              <div className="ox-safety-pills">
                {["Clear status", "Quick exit", "No clutter"].map((item) => (
                  <span key={item}>
                    <ShieldCheck className="h-4 w-4" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ox-section ox-live-section">
          <div className="ox-container ox-split">
            <div>
              <SectionIntro
                eyebrow="Live room"
                title="Video first. Chat when needed."
                body="A focused room surface with readable messages, clear controls, and an obvious next action."
                icon={Video}
              />
              <div className="ox-live-actions">
                <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Try video</CTAButton>
                <CTAButton secondary icon={MessageSquareText} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Try text</CTAButton>
              </div>
            </div>
            <ImageStage src={chatUiStudio} className="ox-chat-stage" />
          </div>
        </section>

        <section className="ox-section ox-community-section">
          <div className="ox-container">
            <SectionIntro
              eyebrow="Community"
              title="A social room, not a noisy feed."
              body="Designed for direct presence: one person, one room, one decision at a time."
              icon={Users}
            />
            <div className="ox-reaction-grid">
              {[
                ["Feels premium", "The first screen already feels like a real product."],
                ["Easy to trust", "Status, privacy, and controls are obvious."],
                ["Fast to move", "Next is clear when the conversation is not right."],
              ].map(([title, body]) => (
                <motion.article key={title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="ox-reaction-card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="ox-section ox-faq-section">
          <div className="ox-container ox-faq-layout">
            <SectionIntro eyebrow="FAQ" title="Simple answers." icon={MessageCircle} />
            <div className="ox-faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question} className="ox-faq-item">
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ox-final-cta">
          <div className="ox-container ox-final-card">
            <div>
              <Eyebrow>Ready</Eyebrow>
              <h2>Start a room.</h2>
              <p>Video or text. Private by default. Built for the first hello.</p>
            </div>
            <div className="ox-final-actions">
              <CTAButton icon={Video} onClick={() => begin(CHAT_MODES.VIDEO)} disabled={isStarting}>Start video</CTAButton>
              <CTAButton secondary icon={ArrowRight} onClick={() => begin(CHAT_MODES.TEXT)} disabled={isStarting}>Start text</CTAButton>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
