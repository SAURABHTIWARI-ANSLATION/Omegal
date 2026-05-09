import { Wifi, WifiOff } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { useAppStore } from "../../store/appStore.js";
import { SOCKET_STATUS } from "../../utils/constants.js";

export default function ConnectionStatus({ compact = false }) {
  const socketStatus = useAppStore((state) => state.socketStatus);
  const socketId = useAppStore((state) => state.socketId);

  const isConnected = socketStatus === SOCKET_STATUS.CONNECTED;
  const variant = isConnected ? "success" : socketStatus === SOCKET_STATUS.ERROR ? "error" : "warning";
  const label = isConnected ? "Signal online" : socketStatus === SOCKET_STATUS.CONNECTING ? "Connecting" : "Signal offline";

  return (
    <Badge variant={variant} className="max-w-[11rem] px-2 sm:max-w-none sm:px-2.5">
      {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{isConnected ? "Online" : socketStatus === SOCKET_STATUS.CONNECTING ? "Connecting" : "Offline"}</span>
      {!compact && socketId ? <span className="hidden text-slate-400 sm:inline">{socketId.slice(0, 6)}</span> : null}
    </Badge>
  );
}
