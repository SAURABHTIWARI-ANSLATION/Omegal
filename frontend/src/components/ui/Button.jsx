import { motion } from "framer-motion";
import { cn } from "../../utils/helpers.js";

const variants = {
  primary: "border border-transparent bg-[#0071e3] text-white hover:bg-[#0077ed] focus-visible:ring-[#0071e3]",
  secondary: "border border-black/[0.12] bg-white/[0.80] text-[#1d1d1f] hover:bg-white focus-visible:ring-[#0071e3]",
  ghost: "border border-transparent bg-transparent text-[#0071e3] underline underline-offset-[3px] hover:text-[#0077ed] focus-visible:ring-[#0071e3]",
  danger: "border border-transparent bg-[#ff375f] text-white hover:bg-[#e83457] focus-visible:ring-[#ff375f]",
  subtle: "border border-transparent bg-black/[0.06] text-[#1d1d1f] hover:bg-black/[0.10] focus-visible:ring-[#0071e3]",
  success: "border border-transparent bg-[#34c759] text-white hover:bg-[#2eb350] focus-visible:ring-[#34c759]",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-medium shadow-[0_4px_18px_rgba(0,0,0,0.08)] backdrop-blur-xl transition outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
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
