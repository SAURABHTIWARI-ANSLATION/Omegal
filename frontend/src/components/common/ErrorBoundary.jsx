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
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6 text-slate-950">
        <div className="surface-panel max-w-md rounded-lg p-6 text-center">
          <p className="text-sm font-semibold text-rose-600">Runtime error</p>
          <h1 className="mt-4 text-3xl font-bold">Omegal needs a refresh.</h1>
          <p className="mt-3 text-slate-600">{this.state.message}</p>
          <button
            type="button"
            className="mt-8 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      </main>
    );
  }
}
