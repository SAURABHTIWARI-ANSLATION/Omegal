import { cn } from "../../utils/helpers.js";

const variants = {
  default: "border-white/12 bg-white/8 text-slate-200",
  success: "border-emerald-400/25 bg-emerald-400/12 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-400/12 text-amber-200",
  error: "border-rose-400/25 bg-rose-400/12 text-rose-200",
  info: "border-cyan-400/25 bg-cyan-400/12 text-cyan-200",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}