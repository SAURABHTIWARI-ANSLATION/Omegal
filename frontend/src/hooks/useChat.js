import { useCallback, useEffect } from "react";
import { EVENTS, SESSION_STATUS } from "../utils/constants.js";
import { socketService } from "../services/socket.js";
import { closePeerConnection } from "../services/webrtc.js";
import { useAppStore } from "../store/appStore.js";
import { createId, normalizeIncomingMessage, stopStream } from "../utils/helpers.js";

export function useChat({ listen = false } = {}) {
  const sendMessage = useCallback((content) => {
    const trimmed = content.trim();
    if (!trimmed) return false;

    const state = useAppStore.getState();
    if (!state.roomId || state.queueStatus !== SESSION_STATUS.MATCHED) {
      state.addToast({ title: "No active partner", description: "Start a new chat before sending a message.", variant: "warning" });
      return false;
    }

    const clientMessageId = createId("client_msg");
    state.addMessage({
      id: clientMessageId,
      clientMessageId,
      content: trimmed,
      sender: "me",
      status: "sending",
      timestamp: Date.now(),
    });

    try {
      socketService.emit(EVENTS.SEND_MESSAGE, {
        roomId: state.roomId,
        partnerId: state.partnerId,
        message: trimmed,
        clientMessageId,
      });
      return true;
    } catch (error) {
      useAppStore.getState().markSendingFailed(clientMessageId);
      useAppStore.getState().addToast({ title: "Message failed", description: error.message, variant: "error" });
      return false;
    }
  }, []);

  useEffect(() => {
    if (!listen) return undefined;

    const socket = socketService.connect();

    const handleReceiveMessage = (payload = {}) => {
      const state = useAppStore.getState();
      const message = normalizeIncomingMessage(payload, state.socketId);
      if (message.sender === "me") {
        state.confirmMessageSent({ clientMessageId: message.clientMessageId, id: message.id });
        return;
      }
      state.addMessage(message);
    };

    const handleMessageSent = (payload = {}) => {
      useAppStore.getState().confirmMessageSent(payload);
    };

    const handlePartnerDisconnected = () => {
      const state = useAppStore.getState();
      closePeerConnection();
      stopStream(state.remoteStream);
      state.setPartnerDisconnected();
      state.addSystemMessage("Partner disconnected.");
      state.addToast({ title: "Partner disconnected", description: "You can search for another stranger now.", variant: "warning" });
    };

    socket.on(EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(EVENTS.MESSAGE_SENT, handleMessageSent);
    socket.on(EVENTS.PARTNER_DISCONNECTED, handlePartnerDisconnected);

    return () => {
      socket.off(EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(EVENTS.MESSAGE_SENT, handleMessageSent);
      socket.off(EVENTS.PARTNER_DISCONNECTED, handlePartnerDisconnected);
    };
  }, [listen]);

  return { sendMessage };
}