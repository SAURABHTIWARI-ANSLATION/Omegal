import { cn } from "../../utils/helpers.js";

const variants = {
  default: "border-black/[0.08] bg-white/[0.72] text-[#6e6e73]",
  success: "border-[#34c759]/20 bg-[#34c759]/10 text-[#188038]",
  warning: "border-[#ff9f0a]/20 bg-[#ff9f0a]/10 text-[#9a5b00]",
  error: "border-[#ff375f]/20 bg-[#ff375f]/10 text-[#b42345]",
  info: "border-[#0071e3]/20 bg-[#0071e3]/10 text-[#0071e3]",
  dark: "border-black/[0.08] bg-white/[0.80] text-[#1d1d1f]",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl", variants[variant], className)}>
      {children}
    </span>
  );
}
