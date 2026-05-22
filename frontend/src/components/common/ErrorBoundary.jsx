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
      <main className="chat-glow flex min-h-screen items-center justify-center bg-[#f5f5f7] p-6 text-[#1d1d1f]">
        <div className="liquid-panel max-w-md rounded-[2rem] p-6 text-center">
          <p className="text-sm font-semibold text-[#ff375f]">Runtime error</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em]">OmegleX needs a refresh.</h1>
          <p className="mt-3 text-[#6e6e73]">{this.state.message}</p>
          <button
            type="button"
            className="apple-primary-cta mt-8"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      </main>
    );
  }
}
