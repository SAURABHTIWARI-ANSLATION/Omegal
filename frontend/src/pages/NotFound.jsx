import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell.jsx";

export default function NotFound() {
  return (
    <AppShell>
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10 text-center"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">404</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">Room not found.</h1>
          <p className="mt-4 text-slate-300">The page you requested does not exist.</p>
          <Link className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950" to="/">
            Back home
          </Link>
        </div>
      </motion.main>
    </AppShell>
  );
}