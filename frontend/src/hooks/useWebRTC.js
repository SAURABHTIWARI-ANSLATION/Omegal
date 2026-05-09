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
  const startingRef = useRef(false);

  const getSessionKey = useCallback((state) => {
    if (!state.roomId || !state.partnerId) return null;
    return `${state.roomId}:${state.partnerId}:${state.sessionVersion || 0}`;
  }, []);

  const emitSignal = useCallback((event, data) => {
    const state = useAppStore.getState();
    if (!state.roomId) return;

    socketService.emit(event, {
      roomId: state.roomId,
      partnerId: state.partnerId,
      sessionVersion: state.sessionVersion,
      ...data,
    });
  }, []);

  const createConnection = useCallback(async () => {
    const existing = getActivePeerConnection();
    if (existing && existing.signalingState !== "closed") return existing;

    const pc = createManagedPeerConnection({
      onIceCandidate: (candidate) => emitSignal(EVENTS.SEND_ICE_CANDIDATE, { candidate }),
      onTrack: (event) => {
        const remoteStream = event.streams?.[0] || new MediaStream([event.track]);
        useAppStore.getState().setRemoteStream(remoteStream);
      },
      onConnectionStateChange: (state) => {
        const store = useAppStore.getState();
        store.setRtcConnectionState(state);
        if (state === "failed") {
          store.addToast({ title: "Peer connection failed", description: "Use Next to try a fresh room.", variant: "error" });
        }
      },
      onIceConnectionStateChange: (state) => {
        const store = useAppStore.getState();
        store.setIceConnectionState(state);
        if (state === "failed") {
          store.addToast({ title: "ICE connection failed", description: "Network traversal failed for this peer.", variant: "error" });
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
  }, [emitSignal]);

  const startSession = useCallback(async () => {
    const state = useAppStore.getState();
    const sessionKey = getSessionKey(state);
    if (state.chatMode !== CHAT_MODES.VIDEO || state.queueStatus !== SESSION_STATUS.MATCHED || !sessionKey) return;
    if (activeRoomRef.current === sessionKey || startingRef.current) return;

    startingRef.current = true;
    activeRoomRef.current = sessionKey;
    closePeerConnection();

    try {
      const pc = await createConnection();
      if (determineOfferer(state.socketId, state.partnerId)) {
        const offer = await createOffer(pc);
        emitSignal(EVENTS.SEND_OFFER, { offer });
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
  }, [createConnection, emitSignal, getSessionKey]);

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
        closePeerConnection();
      }
    });

    startSession();

    return () => unsubscribe();
  }, [listen, startSession]);

  useEffect(() => {
    if (!listen) return undefined;

    const socket = socketService.connect();

    const isCurrentSignal = (payload = {}) => {
      const state = useAppStore.getState();
      if (state.chatMode !== CHAT_MODES.VIDEO || state.queueStatus !== SESSION_STATUS.MATCHED) return false;
      if (payload.roomId && payload.roomId !== state.roomId) return false;
      if (payload.sessionVersion && Number(payload.sessionVersion) !== Number(state.sessionVersion)) return false;
      if (payload.senderId && payload.senderId !== state.partnerId) return false;
      return true;
    };

    const handleReceiveOffer = async (payload = {}) => {
      const state = useAppStore.getState();
      if (!isCurrentSignal(payload)) return;

      const offer = getSignalDescription(payload, "offer");
      if (!offer) return;

      try {
        const pc = await createConnection();
        activeRoomRef.current = getSessionKey(state) || activeRoomRef.current;
        const answer = await createAnswerForOffer(pc, offer);
        emitSignal(EVENTS.SEND_ANSWER, { answer });
      } catch (error) {
        const message = error.message || "Unable to handle WebRTC offer.";
        useAppStore.getState().addToast({ title: "Offer failed", description: message, variant: "error" });
      }
    };

    const handleReceiveAnswer = async (payload = {}) => {
      if (!isCurrentSignal(payload)) return;
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
      closePeerConnection();
    };
  }, [listen, createConnection, emitSignal, getSessionKey]);

  return { toggleAudio, toggleVideo, stopLocalMedia };
}
