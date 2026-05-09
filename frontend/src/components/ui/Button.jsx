import { motion } from "framer-motion";
import { cn } from "../../utils/helpers.js";

const variants = {
  primary:
    "bg-white text-slate-950 shadow-[0_18px_48px_rgba(255,255,255,0.18)] hover:bg-slate-100 focus-visible:ring-white",
  secondary:
    "border border-white/15 bg-white/10 text-white hover:bg-white/15 focus-visible:ring-cyan-300",
  ghost: "text-slate-200 hover:bg-white/10 focus-visible:ring-cyan-300",
  danger: "bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-300",
  subtle: "border border-white/10 bg-slate-950/50 text-slate-100 hover:bg-slate-900 focus-visible:ring-cyan-300",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-11 w-11 p-0",
};

export default function Button({ variant = "primary", size = "md", className, children, disabled, ...props }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}