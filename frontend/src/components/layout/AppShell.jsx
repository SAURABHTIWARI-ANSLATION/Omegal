import { Link } from "react-router-dom";
import { ShieldCheck, Video } from "lucide-react";
import ConnectionStatus from "../common/ConnectionStatus.jsx";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Omegal home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Video className="h-4 w-4" />
            </span>
            <span className="text-base font-bold text-slate-950">Omegal</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
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
