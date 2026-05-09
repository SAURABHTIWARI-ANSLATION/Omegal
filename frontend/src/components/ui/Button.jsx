import { motion } from "framer-motion";
import { cn } from "../../utils/helpers.js";

const variants = {
  primary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-950",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-teal-600",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-teal-600",
  danger: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500",
  subtle: "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-teal-400",
  success: "bg-teal-600 text-white hover:bg-teal-500 focus-visible:ring-teal-500",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
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
