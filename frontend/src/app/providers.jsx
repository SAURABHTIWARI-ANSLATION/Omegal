import { BrowserRouter, useNavigate } from "react-router-dom";
import ErrorBoundary from "../components/common/ErrorBoundary.jsx";
import ToastViewport from "../components/ui/ToastViewport.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { useQueue } from "../hooks/useQueue.js";
import { useChat } from "../hooks/useChat.js";
import { useWebRTC } from "../hooks/useWebRTC.js";

function RealtimeRuntime() {
  const navigate = useNavigate();

  useSocket();
  useQueue({ listen: true, onMatched: () => navigate("/chat") });
  useChat({ listen: true });
  useWebRTC({ listen: true });

  return null;
}

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <RealtimeRuntime />
      <ErrorBoundary>{children}</ErrorBoundary>
      <ToastViewport />
    </BrowserRouter>
  );
}