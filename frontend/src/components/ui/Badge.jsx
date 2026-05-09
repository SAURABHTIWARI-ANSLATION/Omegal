import { cn } from "../../utils/helpers.js";

const variants = {
  default: "border-slate-200 bg-slate-100 text-slate-700",
  success: "border-teal-200 bg-teal-50 text-teal-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
  dark: "border-slate-700 bg-slate-900 text-slate-100",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
