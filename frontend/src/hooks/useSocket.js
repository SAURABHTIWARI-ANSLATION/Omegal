import { useEffect } from "react";
import { EVENTS, SESSION_STATUS, SOCKET_STATUS } from "../utils/constants.js";
import { socketService } from "../services/socket.js";
import { useAppStore } from "../store/appStore.js";

export function useSocket() {
  useEffect(() => {
    const socket = socketService.connect();
    const store = useAppStore.getState();

    const handleConnectionSuccess = (payload = {}) => {
      useAppStore.getState().setSocketReady({ socketId: payload.socketId || socket.id });
    };

    const handleConnect = () => {
      useAppStore.getState().setSocketReady({ socketId: socket.id });
    };

    const handleDisconnect = (reason) => {
      const state = useAppStore.getState();
      state.setSocketStatus(SOCKET_STATUS.DISCONNECTED, reason);
      state.addToast({
        title: "Connection lost",
        description: "Trying to reconnect to the chat server.",
        variant: "warning",
      });
    };

    const handleConnectError = (error) => {
      const state = useAppStore.getState();
      state.setSocketStatus(SOCKET_STATUS.ERROR, error.message);
      state.addToast({
        title: "Backend unavailable",
        description: error.message || "Unable to reach the signaling server.",
        variant: "error",
      });
    };

    const handleReconnectAttempt = () => {
      useAppStore.getState().setSocketStatus(SOCKET_STATUS.CONNECTING);
    };

    const handleReconnect = () => {
      const state = useAppStore.getState();
      state.setSocketStatus(SOCKET_STATUS.CONNECTED);
      if (state.queueStatus === SESSION_STATUS.SEARCHING) {
        socket.emit(EVENTS.JOIN_QUEUE, { userData: { chatMode: state.chatMode } });
      }
      state.addToast({
        title: "Reconnected",
        description:
          state.queueStatus === SESSION_STATUS.SEARCHING
            ? "Your realtime connection is back online and the queue was rejoined."
            : "Your realtime connection is back online.",
        variant: "success",
      });
    };

    store.setSocketStatus(socket.connected ? SOCKET_STATUS.CONNECTED : SOCKET_STATUS.CONNECTING);
    socket.on(EVENTS.CONNECTION_SUCCESS, handleConnectionSuccess);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off(EVENTS.CONNECTION_SUCCESS, handleConnectionSuccess);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  return socketService.getSocket();
}
