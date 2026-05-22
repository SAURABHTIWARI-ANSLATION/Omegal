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
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="liquid-panel max-w-md rounded-[2rem] p-6 text-center">
          <p className="text-sm font-semibold text-rose-200">Runtime error</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em]">OmegleX needs a refresh.</h1>
          <p className="mt-3 text-white/58">{this.state.message}</p>
          <button
            type="button"
            className="liquid-button mt-8 rounded-full px-5 py-3 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      </main>
    );
  }
}
