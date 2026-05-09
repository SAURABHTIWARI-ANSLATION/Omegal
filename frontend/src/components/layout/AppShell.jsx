import { Link } from "react-router-dom";
import { ShieldCheck, Video } from "lucide-react";
import ConnectionStatus from "../common/ConnectionStatus.jsx";

export default function AppShell({ children, variant = "app" }) {
  const isMarketing = variant === "marketing";

  return (
    <div className={isMarketing ? "min-h-screen bg-[#050711] text-white" : "min-h-screen bg-[#eef3f8] text-slate-950"}>
      <header
        className={
          isMarketing
            ? "fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#050711]/[0.74] backdrop-blur-xl"
            : "fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl"
        }
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Omegal home">
            <span className={isMarketing ? "flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950" : "flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"}>
              <Video className="h-4 w-4" />
            </span>
            <span className={isMarketing ? "text-base font-bold text-white" : "text-base font-bold text-slate-950"}>Omegal</span>
          </Link>

          <div className="flex items-center gap-2">
            <div
              className={
                isMarketing
                  ? "hidden items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/80 md:flex"
                  : "hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 md:flex"
              }
            >
              <ShieldCheck className={isMarketing ? "h-3.5 w-3.5 text-teal-300" : "h-3.5 w-3.5 text-teal-600"} />
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
