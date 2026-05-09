import { create } from "zustand";
import { CHAT_MODES, SESSION_STATUS, SOCKET_STATUS } from "../utils/constants.js";
import { createId } from "../utils/helpers.js";

const initialSession = {
  queueStatus: SESSION_STATUS.IDLE,
  queueSize: 0,
  roomId: null,
  partnerId: null,
  partnerDisconnected: false,
  chatMode: CHAT_MODES.VIDEO,
};

const initialMedia = {
  localStream: null,
  remoteStream: null,
  audioEnabled: true,
  videoEnabled: true,
  mediaPermission: "idle",
  rtcConnectionState: "new",
  iceConnectionState: "new",
};

export const useAppStore = create((set, get) => ({
  socketId: null,
  socketStatus: SOCKET_STATUS.CONNECTING,
  socketError: null,
  ...initialSession,
  ...initialMedia,
  messages: [],
  toasts: [],
  lastError: null,

  setSocketReady: ({ socketId }) =>
    set({ socketId, socketStatus: SOCKET_STATUS.CONNECTED, socketError: null }),
  setSocketStatus: (socketStatus, socketError = null) => set({ socketStatus, socketError }),
  setQueueSize: (queueSize) => set({ queueSize: Number(queueSize) || 0 }),
  setChatMode: (chatMode) => set({ chatMode }),
  setSearching: (chatMode = get().chatMode) =>
    set({
      queueStatus: SESSION_STATUS.SEARCHING,
      queueSize: 0,
      roomId: null,
      partnerId: null,
      partnerDisconnected: false,
      chatMode,
      remoteStream: null,
      rtcConnectionState: "new",
      iceConnectionState: "new",
      lastError: null,
      messages: [],
    }),
  setMatched: ({ roomId, partnerId }) =>
    set({
      roomId,
      partnerId,
      queueStatus: SESSION_STATUS.MATCHED,
      partnerDisconnected: false,
      queueSize: 0,
      lastError: null,
    }),
  setPartnerDisconnected: () =>
    set({
      queueStatus: SESSION_STATUS.PARTNER_DISCONNECTED,
      partnerDisconnected: true,
      partnerId: null,
      remoteStream: null,
      rtcConnectionState: "closed",
      iceConnectionState: "closed",
    }),
  resetSession: () => set({ ...initialSession, messages: [], remoteStream: null, lastError: null }),
  setLocalStream: (localStream) => set({ localStream, mediaPermission: localStream ? "granted" : get().mediaPermission }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setMediaEnabled: ({ audioEnabled, videoEnabled }) =>
    set((state) => ({
      audioEnabled: typeof audioEnabled === "boolean" ? audioEnabled : state.audioEnabled,
      videoEnabled: typeof videoEnabled === "boolean" ? videoEnabled : state.videoEnabled,
    })),
  setMediaPermission: (mediaPermission) => set({ mediaPermission }),
  setRtcConnectionState: (rtcConnectionState) => set({ rtcConnectionState }),
  setIceConnectionState: (iceConnectionState) => set({ iceConnectionState }),
  setLastError: (lastError) => set({ lastError, queueStatus: lastError ? SESSION_STATUS.ERROR : get().queueStatus }),
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some(
        (item) => item.id === message.id || (message.clientMessageId && item.clientMessageId === message.clientMessageId)
      );
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  addSystemMessage: (content) =>
    get().addMessage({
      id: createId("system"),
      content,
      sender: "system",
      status: "delivered",
      timestamp: Date.now(),
    }),
  confirmMessageSent: (payload = {}) =>
    set((state) => {
      const clientMessageId = payload.clientMessageId || payload.message?.clientMessageId;
      let confirmed = false;
      const messages = state.messages.map((message) => {
        const matchesClientId = clientMessageId && message.clientMessageId === clientMessageId;
        const matchesFirstPending = !clientMessageId && !confirmed && message.sender === "me" && message.status === "sending";
        if (!matchesClientId && !matchesFirstPending) return message;
        confirmed = true;
        return { ...message, status: "sent", id: payload.id || payload.messageId || message.id };
      });
      return { messages };
    }),
  markSendingFailed: (clientMessageId) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.clientMessageId === clientMessageId ? { ...message, status: "failed" } : message
      ),
    })),
  clearMessages: () => set({ messages: [] }),
  addToast: ({ title, description, variant = "default", duration = 4200 }) => {
    const id = createId("toast");
    set((state) => ({
      toasts: [...state.toasts, { id, title, description, variant, duration }],
    }));
    return id;
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));