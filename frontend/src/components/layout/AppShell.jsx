import { Link } from "react-router-dom";
import ConnectionStatus from "../common/ConnectionStatus.jsx";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-slate-950/35 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group inline-flex items-center gap-3" aria-label="EchoRoom home">
            <span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)] transition group-hover:scale-110" />
            <span className="text-sm font-semibold tracking-[0.28em] text-white uppercase">EchoRoom</span>
          </Link>
          <ConnectionStatus />
        </nav>
      </header>
      {children}
    </div>
  );
}