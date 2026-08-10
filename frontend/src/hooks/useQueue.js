import { useCallback, useEffect, useRef } from "react";
import { CHAT_MODES, EVENTS, SESSION_STATUS, SOCKET_STATUS } from "../utils/constants.js";
import { socketService } from "../services/socket.js";
import { closePeerConnection, requestMediaStream, stopLocalMedia } from "../services/webrtc.js";
import { useAppStore } from "../store/appStore.js";
import { getMediaErrorMessage, normalizeMatchPayload } from "../utils/helpers.js";

export function useQueue({ listen = false, onMatched } = {}) {
  const lastMatchRef = useRef(null);

  const prepareVideo = useCallback(async () => {
    const state = useAppStore.getState();
    if (state.localStream) return true;

    try {
      state.setMediaPermission("requesting");
      const stream = await requestMediaStream();
      const nextState = useAppStore.getState();
      nextState.setLocalStream(stream);
      nextState.setMediaEnabled({
        audioEnabled: stream.getAudioTracks().some((track) => track.enabled),
        videoEnabled: stream.getVideoTracks().some((track) => track.enabled),
      });
      nextState.setMediaPermission("granted");
      return true;
    } catch (error) {
      const message = getMediaErrorMessage(error);
      const nextState = useAppStore.getState();
      nextState.setMediaPermission("denied");
      nextState.setLastError(message);
      nextState.addToast({ title: "Media access blocked", description: message, variant: "error" });
      return false;
    }
  }, []);

  const startQueue = useCallback(
    async (mode = CHAT_MODES.VIDEO) => {
      const state = useAppStore.getState();
      const socket = socketService.connect();

      if (mode === CHAT_MODES.VIDEO) {
        const ready = await prepareVideo();
        if (!ready) return false;
      } else if (state.localStream) {
        stopLocalMedia(state.localStream);
        state.setLocalStream(null);
        state.setMediaEnabled({ audioEnabled: true, videoEnabled: true });
      }

      closePeerConnection();
      useAppStore.getState().setSearching(mode);

      if (!socket.connected && state.socketStatus !== SOCKET_STATUS.CONNECTING) {
        useAppStore.getState().setSocketStatus(SOCKET_STATUS.CONNECTING);
      }

      socket.emit(EVENTS.JOIN_QUEUE, { userData: { chatMode: mode } });
      return true;
    },
    [prepareVideo]
  );

  const nextPartner = useCallback(async () => {
    const state = useAppStore.getState();

    if (state.isSwitchingPartner || state.queueStatus === SESSION_STATUS.SEARCHING) return false;
    if (!state.roomId || state.partnerDisconnected) {
      return startQueue(state.chatMode);
    }

    closePeerConnection();
    state.setRemoteStream(null);
    state.setSearching(state.chatMode, {
      preserveRoom: true,
      switchingPartner: true,
      sessionVersion: state.sessionVersion,
      message: "Looking for a new partner...",
    });
    useAppStore.getState().addSystemMessage("Looking for a new partner...");
    socketService.emit(EVENTS.NEXT_PARTNER, {
      roomId: state.roomId,
      sessionVersion: state.sessionVersion,
    });
    return true;
  }, [startQueue]);

  useEffect(() => {
    if (!listen) return undefined;

    const socket = socketService.connect();

    const handleQueueSize = (payload = {}) => {
      useAppStore.getState().setQueueSize(payload.queueSize);
    };

    const handleMatched = (payload = {}) => {
      const match = normalizeMatchPayload(payload);
      if (!match.roomId || !match.partnerId) return;

      const state = useAppStore.getState();
      const matchKey = `${match.roomId}:${match.partnerId}:${match.sessionVersion}`;
      if (lastMatchRef.current === matchKey && state.queueStatus === SESSION_STATUS.MATCHED) return;

      lastMatchRef.current = matchKey;
      state.clearMessages();
      state.setMatched(match);
      state.addSystemMessage("Connected to stranger.");
      state.addToast({ title: "Partner found", description: "You are connected in a private room.", variant: "success" });
      onMatched?.(match);
    };

    const resetRemotePeer = () => {
      const state = useAppStore.getState();
      closePeerConnection();
      state.setRemoteStream(null);
      state.setRtcConnectionState("new");
      state.setIceConnectionState("new");
    };

    const handleNextPartnerWaiting = (payload = {}) => {
      resetRemotePeer();
      const state = useAppStore.getState();
      const message = payload.message || "Looking for a new partner...";
      state.setSearching(state.chatMode, {
        preserveRoom: true,
        switchingPartner: true,
        sessionVersion: payload.sessionVersion ?? state.sessionVersion,
        message,
      });
      useAppStore.getState().addSystemMessage(message);
    };

    const handlePartnerWaiting = (payload = {}) => {
      resetRemotePeer();
      const state = useAppStore.getState();
      const message = payload.message || "Waiting for another user...";
      state.setSearching(state.chatMode, {
        preserveRoom: false,
        switchingPartner: false,
        message,
      });
      useAppStore.getState().addSystemMessage(message);
    };

    socket.on(EVENTS.QUEUE_SIZE_UPDATED, handleQueueSize);
    socket.on(EVENTS.USER_MATCHED, handleMatched);
    socket.on(EVENTS.MATCHED, handleMatched);
    socket.on(EVENTS.NEXT_PARTNER_WAITING, handleNextPartnerWaiting);
    socket.on(EVENTS.PARTNER_WAITING, handlePartnerWaiting);

    return () => {
      socket.off(EVENTS.QUEUE_SIZE_UPDATED, handleQueueSize);
      socket.off(EVENTS.USER_MATCHED, handleMatched);
      socket.off(EVENTS.MATCHED, handleMatched);
      socket.off(EVENTS.NEXT_PARTNER_WAITING, handleNextPartnerWaiting);
      socket.off(EVENTS.PARTNER_WAITING, handlePartnerWaiting);
    };
  }, [listen, onMatched]);

  return { startQueue, nextPartner };
}
