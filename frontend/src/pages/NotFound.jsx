import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell.jsx";

export default function NotFound() {
  return (
    <AppShell>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="mx-auto flex min-h-screen max-w-3xl items-center px-4 pt-24 pb-10 text-center"
      >
        <div className="surface-panel w-full rounded-lg p-6">
          <p className="text-sm font-semibold text-indigo-600">404</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-950">Room not found.</h1>
          <p className="mt-4 text-slate-600">The page you requested does not exist.</p>
          <Link className="mt-8 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white" to="/">
            Back home
          </Link>
        </div>
      </motion.main>
    </AppShell>
  );
}
