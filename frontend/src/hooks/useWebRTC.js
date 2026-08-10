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
  getPeerConnectionStats,
  requestMediaStream,
  restartPeerIce,
  setManagedAudioEnabled,
} from "../services/webrtc.js";
import { useAppStore } from "../store/appStore.js";
import { determineOfferer, getMediaErrorMessage, getSignalDescription, stopStream } from "../utils/helpers.js";

export function useWebRTC({ listen = false } = {}) {
  const activeRoomRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const startingRef = useRef(false);
  const connectionPromiseRef = useRef(null);
  const connectionWatchdogRef = useRef(null);
  const telemetryIntervalRef = useRef(null);
  const lastFailureToastRef = useRef(0);

  const stopTelemetry = useCallback(() => {
    if (telemetryIntervalRef.current) {
      clearInterval(telemetryIntervalRef.current);
      telemetryIntervalRef.current = null;
    }
  }, []);

  const startTelemetry = useCallback((pc, sessionKey) => {
    stopTelemetry();
    telemetryIntervalRef.current = setInterval(async () => {
      if (!pc || pc.connectionState !== "connected") {
        stopTelemetry();
        return;
      }
      const store = useAppStore.getState();
      const stats = await getPeerConnectionStats(pc, store.localStream, store.remoteStream);
      if (stats) {
        console.log(`[WEBRTC-TELEMETRY][session=${sessionKey}]`, stats);
      }
    }, 3000);
  }, [stopTelemetry]);

  const clearConnectionWatchdog = useCallback(() => {
    if (!connectionWatchdogRef.current) return;
    window.clearTimeout(connectionWatchdogRef.current);
    connectionWatchdogRef.current = null;
  }, []);

  const resetRemoteStream = useCallback(() => {
    remoteStreamRef.current = null;
    useAppStore.getState().setRemoteStream(null);
  }, []);

  const publishRemoteTrack = useCallback((event, sessionKey) => {
    // Guard: reject tracks from previous sessions.
    if (sessionKey && getSessionKey(useAppStore.getState()) !== sessionKey) {
      console.warn("[WEBRTC-VIDEO] ontrack discarded — session mismatch", {
        incoming: sessionKey,
        current: getSessionKey(useAppStore.getState()),
      });
      return;
    }

    const track = event.track;
    if (!track) return;

    // Reuse the existing MediaStream — do NOT create a clone.
    // Cloning on every ontrack call causes React to set a new srcObject reference
    // which triggers another play() call; on Safari/mobile the second play() can
    // be blocked by autoplay policy, silently leaving video frozen on one side.
    let remoteStream = remoteStreamRef.current;
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
    }

    // Add the primary track from the event if not already present.
    if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
      remoteStream.addTrack(track);
      console.log("[WEBRTC-VIDEO] Remote track added", { kind: track.kind, id: track.id, readyState: track.readyState, muted: track.muted });
    }

    // Also add any additional tracks from event.streams[0] (e.g., when browser
    // bundles audio+video into a single stream and fires ontrack for each).
    const streamTracks = event.streams?.[0]?.getTracks?.() ?? [];
    streamTracks.forEach((t) => {
      if (!remoteStream.getTracks().some((existing) => existing.id === t.id)) {
        remoteStream.addTrack(t);
      }
    });

    // Monitor track lifecycle for diagnostics.
    track.onmute = () => console.log("[WEBRTC-VIDEO] Remote track muted", { kind: track.kind, id: track.id });
    track.onunmute = () => console.log("[WEBRTC-VIDEO] Remote track unmuted", { kind: track.kind, id: track.id });
    track.onended = () => console.log("[WEBRTC-VIDEO] Remote track ended", { kind: track.kind, id: track.id });

    // Publish the SAME stream reference — VideoTile's srcObject stays stable.
    useAppStore.getState().setRemoteStream(remoteStream);
  }, [getSessionKey]);

  const getSessionKey = useCallback((state) => {
    if (!state.roomId || !state.partnerId) return null;
    return `${state.roomId}:${state.partnerId}:${state.sessionVersion || 0}:${state.sessionGeneration || 1}`;
  }, []);

  const emitSignal = useCallback((event, data, sessionKey = null) => {
    const state = useAppStore.getState();
    if (!state.roomId) return;
    if (sessionKey && getSessionKey(state) !== sessionKey) return;

    socketService.emit(event, {
      roomId: state.roomId,
      partnerId: state.partnerId,
      sessionVersion: state.sessionVersion,
      sessionGeneration: state.sessionGeneration,
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

        stopTelemetry();
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
    [addPeerFailureToast, clearConnectionWatchdog, resetRemoteStream, stopTelemetry]
  );

  const createConnection = useCallback(async () => {
    const build = async () => {
      const sessionKey = getSessionKey(useAppStore.getState());
      const pc = createManagedPeerConnection({
        onIceCandidate: (candidate) => emitSignal(EVENTS.SEND_ICE_CANDIDATE, { candidate }, sessionKey),
        // Pass sessionKey into the track handler so stale-session tracks are rejected.
        onTrack: (event) => publishRemoteTrack(event, sessionKey),
        onConnectionStateChange: (state) => {
          const store = useAppStore.getState();
          store.setRtcConnectionState(state);
          if (state === "connected") {
            clearConnectionWatchdog();
            startTelemetry(pc, sessionKey);
          }
          if (state === "disconnected") {
            scheduleConnectionWatchdog("disconnected");
            restartPeerIce(pc);
          }
          if (state === "failed") {
            scheduleConnectionWatchdog("failed");
          }
        },
        onIceConnectionStateChange: (state) => {
          const store = useAppStore.getState();
          store.setIceConnectionState(state);
          if (state === "connected" || state === "completed") {
            clearConnectionWatchdog();
            startTelemetry(pc, sessionKey);
          }
          if (state === "disconnected") {
            scheduleConnectionWatchdog("disconnected");
            restartPeerIce(pc);
          }
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

      if (pc.signalingState === "closed" || pc.connectionState === "closed") {
        throw new Error("Peer connection closed while setting up media.");
      }

      addLocalTracks(pc, stream);
      setManagedAudioEnabled(stream, store.audioEnabled);

      const localAudioTrack = stream.getAudioTracks()[0];
      const localVideoTrack = stream.getVideoTracks()[0];
      const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
      const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
      const transceivers = pc.getTransceivers();

      console.log("[WEBRTC-DIAGNOSTIC] Senders after addLocalTracks:", {
        senderCount: pc.getSenders().length,
        audioSenderTrack: audioSender?.track?.id,
        audioTrackMatch: localAudioTrack?.id === audioSender?.track?.id,
        videoSenderTrack: videoSender?.track?.id,
        videoTrackMatch: localVideoTrack?.id === videoSender?.track?.id,
        videoTrackReadyState: localVideoTrack?.readyState,
        videoTrackEnabled: localVideoTrack?.enabled,
        transceivers: transceivers.map((t) => ({
          mid: t.mid,
          direction: t.direction,
          senderKind: t.sender?.track?.kind,
          receiverKind: t.receiver?.track?.kind,
        })),
      });

      if (!videoSender) {
        console.error("[WEBRTC-DIAGNOSTIC] ❌ No video sender found after addLocalTracks! Video will NOT be sent.");
      } else if (!videoSender.track) {
        console.error("[WEBRTC-DIAGNOSTIC] ❌ Video sender exists but track is null!");
      } else {
        console.log("[WEBRTC-DIAGNOSTIC] ✅ Video sender verified:", videoSender.track.id, videoSender.track.label);
      }


      useAppStore.getState().setRtcConnectionState("connecting");
      return pc;
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existing = getActivePeerConnection();
      if (
        existing &&
        existing.signalingState !== "closed" &&
        existing.connectionState !== "closed" &&
        existing.connectionState !== "failed"
      ) {
        return existing;
      }

      if (!connectionPromiseRef.current) {
        connectionPromiseRef.current = build();
      }

      try {
        const pc = await connectionPromiseRef.current;
        if (
          pc &&
          pc.signalingState !== "closed" &&
          pc.connectionState !== "closed" &&
          pc.connectionState !== "failed"
        ) {
          return pc;
        }
      } finally {
        connectionPromiseRef.current = null;
      }
    }

    throw new Error("Unable to establish a peer connection.");
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
      const store = useAppStore.getState();
      closePeerConnection();
      if (getSessionKey(store) !== sessionKey) return;

      const message = getMediaErrorMessage(error);
      activeRoomRef.current = null;
      store.setMediaPermission("denied");
      store.setLastError(message);
      store.addToast({ title: "Video setup failed", description: message, variant: "error" });
    } finally {
      startingRef.current = false;
    }
  }, [clearConnectionWatchdog, createConnection, emitSignal, getSessionKey, resetRemoteStream]);

  const toggleAudio = useCallback(() => {
    const state = useAppStore.getState();
    if (!state.localStream) return;
    const enabled = !state.audioEnabled;
    setManagedAudioEnabled(state.localStream, enabled);
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
      if (payload.sessionGeneration !== undefined && Number(payload.sessionGeneration) !== Number(state.sessionGeneration)) return false;
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
        if (!isCurrentSignal(payload)) return;
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
      stopTelemetry();
      clearConnectionWatchdog();
      closePeerConnection();
      resetRemoteStream();
    };
  }, [clearConnectionWatchdog, listen, createConnection, emitSignal, getSessionKey, resetRemoteStream, stopTelemetry]);

  return { toggleAudio, toggleVideo, stopLocalMedia };
}
