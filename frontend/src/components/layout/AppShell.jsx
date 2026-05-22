import { Link } from "react-router-dom";
import { ShieldCheck, Video } from "lucide-react";
import ConnectionStatus from "../common/ConnectionStatus.jsx";
import { cn } from "../../utils/helpers.js";

export default function AppShell({ children, variant = "light" }) {
  const isDark = variant === "dark";

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#05060a] text-white" : "bg-[#f7f5ef] text-[#111115]")}>
      <header className={cn("studio-navbar fixed inset-x-0 top-0 z-50", isDark && "studio-navbar-dark")}>
        <nav className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="OmegleX home">
            <span className={cn("liquid-icon flex h-9 w-9 items-center justify-center rounded-2xl text-[#0071e3]", isDark && "border-white/10 bg-white/10 text-white")}>
              <Video className="h-4 w-4" />
            </span>
            <span className={cn("text-sm font-semibold tracking-[-0.02em]", isDark ? "text-white" : "text-[#111115]")}>OmegleX</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className={cn("liquid-pill hidden items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#62626c] md:flex", isDark && "border-white/10 bg-white/10 text-white/70")}>
              <ShieldCheck className="h-3.5 w-3.5 text-[#0071e3]" />
              {isDark ? "Private rooms" : "Private signaling"}
            </div>
            {isDark ? (
              <Link to="/chat" className="dark-nav-start">
                Start
              </Link>
            ) : (
              <ConnectionStatus />
            )}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
