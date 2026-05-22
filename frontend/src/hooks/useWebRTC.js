import { useCallback, useEffect, useRef } from "react";
import { CHAT_MODES, EVENTS, SESSION_STATUS } from "../utils/constants.js";
import { socketService } from "../services/socket.js";
import {
  addLocalTracks,
  addRemoteIceCandidate,
  applyRemoteAnswer,
  closePeerConnection,
  createAnswerForOffer,
  createManagedPeerConnection,
  createOffer,
  getActivePeerConnection,
  requestMediaStream,
} from "../services/webrtc.js";
import { useAppStore } from "../store/appStore.js";
import { determineOfferer, getMediaErrorMessage, getSignalDescription, stopStream } from "../utils/helpers.js";

export function useWebRTC({ listen = false } = {}) {
  const activeRoomRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const startingRef = useRef(false);
  const connectionWatchdogRef = useRef(null);
  const lastFailureToastRef = useRef(0);

  const clearConnectionWatchdog = useCallback(() => {
    if (!connectionWatchdogRef.current) return;
    window.clearTimeout(connectionWatchdogRef.current);
    connectionWatchdogRef.current = null;
  }, []);

  const resetRemoteStream = useCallback(() => {
    remoteStreamRef.current = null;
    useAppStore.getState().setRemoteStream(null);
  }, []);

  const publishRemoteTrack = useCallback((event) => {
    const remoteStream = remoteStreamRef.current || new MediaStream();
    remoteStreamRef.current = remoteStream;

    const incomingTracks = event.streams?.[0]?.getTracks?.() || [];
    [...incomingTracks, event.track].filter(Boolean).forEach((track) => {
      const alreadyAdded = remoteStream.getTracks().some((item) => item.id === track.id);
      if (!alreadyAdded) remoteStream.addTrack(track);
    });

    useAppStore.getState().setRemoteStream(new MediaStream(remoteStream.getTracks()));
  }, []);

  const getSessionKey = useCallback((state) => {
    if (!state.roomId || !state.partnerId) return null;
    return `${state.roomId}:${state.partnerId}:${state.sessionVersion || 0}`;
  }, []);

  const emitSignal = useCallback((event, data, sessionKey = null) => {
    const state = useAppStore.getState();
    if (!state.roomId) return;
    if (sessionKey && getSessionKey(state) !== sessionKey) return;

    socketService.emit(event, {
      roomId: state.roomId,
      partnerId: state.partnerId,
      sessionVersion: state.sessionVersion,
      ...data,
    });
  }, [getSessionKey]);

  const addPeerFailureToast = useCallback((title, description) => {
    const now = Date.now();
    if (now - lastFailureToastRef.current < 6000) return;
    lastFailureToastRef.current = now;
    useAppStore.getState().addToast({ title, description, variant: "error" });
  }, []);

  const scheduleConnectionWatchdog = useCallback(
    (reason) => {
      clearConnectionWatchdog();
      const delayMs = reason === "disconnected" ? 8000 : 0;

      connectionWatchdogRef.current = window.setTimeout(() => {
        connectionWatchdogRef.current = null;
        const store = useAppStore.getState();
        const pc = getActivePeerConnection();
        if (store.queueStatus !== SESSION_STATUS.MATCHED || !pc) return;

        const connectionState = pc.connectionState;
        const iceState = pc.iceConnectionState;
        const failed = connectionState === "failed" || iceState === "failed";
        const stillDisconnected =
          reason === "disconnected" &&
          (connectionState === "disconnected" || iceState === "disconnected" || failed);

        if (!failed && !stillDisconnected) return;

        closePeerConnection();
        resetRemoteStream();
        store.setRtcConnectionState(failed ? "failed" : "disconnected");
        store.setIceConnectionState(failed ? "failed" : "disconnected");
        addPeerFailureToast(
          failed ? "Peer connection failed" : "Peer connection unstable",
          failed ? "Use Next to try a fresh room." : "The peer connection did not recover. Use Next to continue."
        );
      }, delayMs);
    },
    [addPeerFailureToast, clearConnectionWatchdog, resetRemoteStream]
  );

  const createConnection = useCallback(async () => {
    const existing = getActivePeerConnection();
    if (
      existing &&
      existing.signalingState !== "closed" &&
      existing.connectionState !== "closed" &&
      existing.connectionState !== "failed"
    ) {
      return existing;
    }

    const sessionKey = getSessionKey(useAppStore.getState());

    const pc = createManagedPeerConnection({
      onIceCandidate: (candidate) => emitSignal(EVENTS.SEND_ICE_CANDIDATE, { candidate }, sessionKey),
      onTrack: publishRemoteTrack,
      onConnectionStateChange: (state) => {
        const store = useAppStore.getState();
        store.setRtcConnectionState(state);
        if (state === "connected") clearConnectionWatchdog();
        if (state === "disconnected") scheduleConnectionWatchdog("disconnected");
        if (state === "failed") {
          scheduleConnectionWatchdog("failed");
        }
      },
      onIceConnectionStateChange: (state) => {
        const store = useAppStore.getState();
        store.setIceConnectionState(state);
        if (state === "connected" || state === "completed") clearConnectionWatchdog();
        if (state === "disconnected") scheduleConnectionWatchdog("disconnected");
        if (state === "failed") {
          scheduleConnectionWatchdog("failed");
        }
      },
    });

    const store = useAppStore.getState();
    let stream = store.localStream;
    if (!stream) {
      store.setMediaPermission("requesting");
      stream = await requestMediaStream();
      useAppStore.getState().setLocalStream(stream);
      useAppStore.getState().setMediaPermission("granted");
    }

    addLocalTracks(pc, stream);
    useAppStore.getState().setRtcConnectionState("connecting");
    return pc;
  }, [clearConnectionWatchdog, emitSignal, getSessionKey, publishRemoteTrack, scheduleConnectionWatchdog]);

  const startSession = useCallback(async () => {
    const state = useAppStore.getState();
    const sessionKey = getSessionKey(state);
    if (state.chatMode !== CHAT_MODES.VIDEO || state.queueStatus !== SESSION_STATUS.MATCHED || !sessionKey) return;
    if (activeRoomRef.current === sessionKey || startingRef.current) return;

    startingRef.current = true;
    activeRoomRef.current = sessionKey;
    clearConnectionWatchdog();
    closePeerConnection();
    resetRemoteStream();

    try {
      const pc = await createConnection();
      const latestState = useAppStore.getState();
      if (getSessionKey(latestState) !== sessionKey) return;

      if (determineOfferer(latestState.socketId, latestState.partnerId)) {
        const offer = await createOffer(pc);
        emitSignal(EVENTS.SEND_OFFER, { offer }, sessionKey);
      }
    } catch (error) {
      const message = getMediaErrorMessage(error);
      const store = useAppStore.getState();
      activeRoomRef.current = null;
      store.setMediaPermission("denied");
      store.setLastError(message);
      store.addToast({ title: "Video setup failed", description: message, variant: "error" });
      closePeerConnection();
    } finally {
      startingRef.current = false;
    }
  }, [clearConnectionWatchdog, createConnection, emitSignal, getSessionKey, resetRemoteStream]);

  const toggleAudio = useCallback(() => {
    const state = useAppStore.getState();
    if (!state.localStream) return;
    const enabled = !state.audioEnabled;
    state.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    state.setMediaEnabled({ audioEnabled: enabled });
  }, []);

  const toggleVideo = useCallback(() => {
    const state = useAppStore.getState();
    if (!state.localStream) return;
    const enabled = !state.videoEnabled;
    state.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    state.setMediaEnabled({ videoEnabled: enabled });
  }, []);

  const stopLocalMedia = useCallback(() => {
    const state = useAppStore.getState();
    stopStream(state.localStream);
    state.setLocalStream(null);
    state.setMediaEnabled({ audioEnabled: true, videoEnabled: true });
  }, []);

  useEffect(() => {
    if (!listen) return undefined;

    const unsubscribe = useAppStore.subscribe((state, previousState) => {
      const becameMatched = state.queueStatus === SESSION_STATUS.MATCHED && previousState.queueStatus !== SESSION_STATUS.MATCHED;
      const sessionChanged =
        state.queueStatus === SESSION_STATUS.MATCHED &&
        (state.roomId !== previousState.roomId ||
          state.partnerId !== previousState.partnerId ||
          state.sessionVersion !== previousState.sessionVersion);
      if (becameMatched || sessionChanged) startSession();

      if (state.queueStatus !== SESSION_STATUS.MATCHED && previousState.queueStatus === SESSION_STATUS.MATCHED) {
        activeRoomRef.current = null;
        clearConnectionWatchdog();
        resetRemoteStream();
        closePeerConnection();
      }
    });

    startSession();

    return () => {
      clearConnectionWatchdog();
      unsubscribe();
    };
  }, [clearConnectionWatchdog, listen, resetRemoteStream, startSession]);

  useEffect(() => {
    if (!listen) return undefined;

    const socket = socketService.connect();

    const isCurrentSignal = (payload = {}) => {
      const state = useAppStore.getState();
      if (state.chatMode !== CHAT_MODES.VIDEO || state.queueStatus !== SESSION_STATUS.MATCHED) return false;
      if (payload.roomId && payload.roomId !== state.roomId) return false;
      if (payload.sessionVersion !== undefined && Number(payload.sessionVersion) !== Number(state.sessionVersion)) return false;
      if (payload.senderId && payload.senderId !== state.partnerId) return false;
      return true;
    };

    const handleReceiveOffer = async (payload = {}) => {
      const state = useAppStore.getState();
      if (!isCurrentSignal(payload)) return;
      if (determineOfferer(state.socketId, state.partnerId)) return;

      const offer = getSignalDescription(payload, "offer");
      if (!offer) return;

      try {
        const pc = await createConnection();
        if (!isCurrentSignal(payload)) return;

        const currentSessionKey = getSessionKey(useAppStore.getState());
        activeRoomRef.current = currentSessionKey || activeRoomRef.current;
        const answer = await createAnswerForOffer(pc, offer);
        emitSignal(EVENTS.SEND_ANSWER, { answer }, currentSessionKey);
      } catch (error) {
        const message = error.message || "Unable to handle WebRTC offer.";
        useAppStore.getState().addToast({ title: "Offer failed", description: message, variant: "error" });
      }
    };

    const handleReceiveAnswer = async (payload = {}) => {
      if (!isCurrentSignal(payload)) return;
      const state = useAppStore.getState();
      if (!determineOfferer(state.socketId, state.partnerId)) return;

      const answer = getSignalDescription(payload, "answer");
      if (!answer) return;

      try {
        await applyRemoteAnswer(getActivePeerConnection(), answer);
      } catch (error) {
        useAppStore.getState().addToast({ title: "Answer failed", description: error.message, variant: "error" });
      }
    };

    const handleReceiveIce = async (payload = {}) => {
      if (!isCurrentSignal(payload)) return;
      const candidate = payload.candidate || payload.iceCandidate || payload;
      if (!candidate) return;

      try {
        await addRemoteIceCandidate(getActivePeerConnection(), candidate);
      } catch (error) {
        useAppStore.getState().addToast({ title: "ICE candidate failed", description: error.message, variant: "error" });
      }
    };

    socket.on(EVENTS.RECEIVE_OFFER, handleReceiveOffer);
    socket.on(EVENTS.RECEIVE_ANSWER, handleReceiveAnswer);
    socket.on(EVENTS.RECEIVE_ICE_CANDIDATE, handleReceiveIce);

    return () => {
      socket.off(EVENTS.RECEIVE_OFFER, handleReceiveOffer);
      socket.off(EVENTS.RECEIVE_ANSWER, handleReceiveAnswer);
      socket.off(EVENTS.RECEIVE_ICE_CANDIDATE, handleReceiveIce);
      clearConnectionWatchdog();
      closePeerConnection();
      resetRemoteStream();
    };
  }, [clearConnectionWatchdog, listen, createConnection, emitSignal, getSessionKey, resetRemoteStream]);

  return { toggleAudio, toggleVideo, stopLocalMedia };
}
