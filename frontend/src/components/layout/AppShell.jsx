import { Link } from "react-router-dom";
import { ShieldCheck, Video } from "lucide-react";
import ConnectionStatus from "../common/ConnectionStatus.jsx";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-black/30 shadow-[inset_0_-1px_0_rgba(255,255,255,0.03)] backdrop-blur-[20px]">
        <nav className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="OmegleX home">
            <span className="liquid-icon flex h-8 w-8 items-center justify-center rounded-xl text-white">
              <Video className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-white/92">OmegleX</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="liquid-pill hidden items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white/72 md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-200" />
              Private signaling
            </div>
            <ConnectionStatus />
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
