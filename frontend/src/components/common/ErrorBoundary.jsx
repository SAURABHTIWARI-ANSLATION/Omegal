import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-300">Runtime error</p>
          <h1 className="mt-4 text-3xl font-semibold">EchoRoom needs a refresh.</h1>
          <p className="mt-3 text-slate-400">{this.state.message}</p>
          <button
            type="button"
            className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      </main>
    );
  }
}