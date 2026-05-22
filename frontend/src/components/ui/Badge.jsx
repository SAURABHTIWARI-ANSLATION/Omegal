import { cn } from "../../utils/helpers.js";

const variants = {
  default: "border-white/14 bg-white/10 text-white/72",
  success: "border-emerald-200/25 bg-emerald-300/12 text-emerald-100",
  warning: "border-amber-200/25 bg-amber-300/12 text-amber-100",
  error: "border-rose-200/25 bg-rose-300/12 text-rose-100",
  info: "border-cyan-200/25 bg-cyan-300/12 text-cyan-100",
  dark: "border-white/14 bg-white/10 text-white/86",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl", variants[variant], className)}>
      {children}
    </span>
  );
}
