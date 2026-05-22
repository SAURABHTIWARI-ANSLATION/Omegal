import { Link } from "react-router-dom";
import { ShieldCheck, Video } from "lucide-react";
import ConnectionStatus from "../common/ConnectionStatus.jsx";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#111115]">
      <header className="studio-navbar fixed inset-x-0 top-0 z-50">
        <nav className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="OmegleX home">
            <span className="liquid-icon flex h-9 w-9 items-center justify-center rounded-2xl text-[#0071e3]">
              <Video className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#111115]">OmegleX</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="liquid-pill hidden items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#62626c] md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0071e3]" />
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
