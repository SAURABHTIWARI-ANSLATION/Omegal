import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { cn } from "../../utils/helpers.js";

const variantStyles = {
  default: "border-black/[0.08] bg-white/[0.90] text-[#1d1d1f]",
  success: "border-[#34c759]/20 bg-white/[0.90] text-[#1d1d1f]",
  warning: "border-[#ff9f0a]/20 bg-white/[0.90] text-[#1d1d1f]",
  error: "border-[#ff375f]/20 bg-white/[0.90] text-[#1d1d1f]",
};

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

function ToastItem({ toast }) {
  const removeToast = useAppStore((state) => state.removeToast);
  const Icon = icons[toast.variant] || Info;

  useEffect(() => {
    const timeout = window.setTimeout(() => removeToast(toast.id), toast.duration);
    return () => window.clearTimeout(timeout);
  }, [removeToast, toast.duration, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className={cn("pointer-events-auto flex w-full max-w-sm gap-3 rounded-3xl border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl", variantStyles[toast.variant])}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm text-[#6e6e73]">{toast.description}</p> : null}
      </div>
      <button
        className="rounded-full p-1 text-[#6e6e73] transition hover:bg-black/[0.06] hover:text-[#1d1d1f]"
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
