import { motion } from "framer-motion";
import { cn } from "../../utils/helpers.js";

const variants = {
  primary: "border border-white/22 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_60px_rgba(0,0,0,0.24)] hover:bg-white/22 focus-visible:ring-cyan-200",
  secondary: "border border-white/18 bg-white/12 text-white hover:bg-white/18 focus-visible:ring-cyan-200",
  ghost: "border border-transparent text-white/78 hover:bg-white/10 hover:text-white focus-visible:ring-cyan-200",
  danger: "border border-rose-200/28 bg-rose-400/18 text-white hover:bg-rose-400/26 focus-visible:ring-rose-200",
  subtle: "border border-white/16 bg-white/10 text-white/88 hover:bg-white/16 focus-visible:ring-cyan-200",
  success: "border border-emerald-200/28 bg-emerald-300/18 text-white hover:bg-emerald-300/26 focus-visible:ring-emerald-200",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-11 w-11 p-0",
};

export default function Button({ variant = "primary", size = "md", className, children, disabled, ...props }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-black/20 backdrop-blur-2xl transition outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
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
