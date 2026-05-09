import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { cn } from "../../utils/helpers.js";

const variantStyles = {
  default: "border-slate-700 bg-slate-950 text-slate-100",
  success: "border-teal-700 bg-teal-950 text-teal-50",
  warning: "border-amber-700 bg-amber-950 text-amber-50",
  error: "border-rose-700 bg-rose-950 text-rose-50",
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
      className={cn("pointer-events-auto flex w-full max-w-sm gap-3 rounded-lg border p-4 shadow-xl", variantStyles[toast.variant])}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
      </div>
      <button
        className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
