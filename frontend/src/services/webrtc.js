import { rtcConfig } from "../utils/rtcConfig.js";

let peerConnection = null;
let queuedIceCandidates = [];

const MAX_QUEUED_ICE_CANDIDATES = 80;
const STREAM_CLEANUP_KEY = "__omegalCleanup";
const AUDIO_SOURCE_TRACKS_KEY = "__omegalAudioSourceTracks";

const speechAudioConstraints = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: false },
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  sampleSize: { ideal: 16 },
  latency: { ideal: 0.02 },
};

function isClosed(pc) {
  return !pc || pc.signalingState === "closed" || pc.connectionState === "closed";
}

function isActive(pc) {
  return Boolean(pc && peerConnection === pc && !isClosed(pc));
}

export function getActivePeerConnection() {
  return peerConnection;
}

export function createManagedPeerConnection(handlers = {}) {
  closePeerConnection();

  const pc = new RTCPeerConnection(rtcConfig);
  peerConnection = pc;

  pc.onicecandidate = (event) => {
    if (isActive(pc) && event.candidate) handlers.onIceCandidate?.(event.candidate);
  };
  pc.onicecandidateerror = (event) => {
    if (isActive(pc)) handlers.onIceCandidateError?.(event);
  };
  pc.ontrack = (event) => {
    if (isActive(pc)) handlers.onTrack?.(event);
  };
  pc.onconnectionstatechange = () => {
    if (isActive(pc)) handlers.onConnectionStateChange?.(pc.connectionState);
  };
  pc.oniceconnectionstatechange = () => {
    if (isActive(pc)) handlers.onIceConnectionStateChange?.(pc.iceConnectionState);
  };
  pc.onsignalingstatechange = () => {
    if (isActive(pc)) handlers.onSignalingStateChange?.(pc.signalingState);
  };

  return pc;
}

export function closePeerConnection() {
  const pc = peerConnection;
  if (!pc) return;

  queuedIceCandidates = [];
  peerConnection = null;

  pc.onicecandidate = null;
  pc.onicecandidateerror = null;
  pc.ontrack = null;
  pc.onconnectionstatechange = null;
  pc.oniceconnectionstatechange = null;
  pc.onsignalingstatechange = null;

  try {
    pc.getSenders().forEach((sender) => {
      if (sender.track && pc.signalingState !== "closed") {
        pc.removeTrack(sender);
      }
    });
  } catch {
    // Browser implementations can throw while a connection is already closing.
  }

  try {
    if (pc.signalingState !== "closed") pc.close();
  } catch {
    // A stale peer connection is already unusable; keep cleanup idempotent.
  }
}

export function addLocalTracks(pc, stream) {
  if (isClosed(pc) || !stream) return;

  const existingTrackIds = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
  stream.getTracks().forEach((track) => {
    if (track.readyState !== "ended" && !existingTrackIds.has(track.id)) {
      pc.addTrack(track, stream);
    }
  });
}

export function setManagedAudioEnabled(stream, enabled) {
  if (!stream) return;

  const audioTracks = [
    ...stream.getAudioTracks(),
    ...((stream[AUDIO_SOURCE_TRACKS_KEY] || []).filter(Boolean)),
  ];
  const seenTrackIds = new Set();

  audioTracks.forEach((track) => {
    if (!track || seenTrackIds.has(track.id)) return;
    seenTrackIds.add(track.id);
    track.enabled = enabled;
  });
}

async function applySpeechTrackSettings(track) {
  if (!track) return;

  try {
    track.contentHint = "speech";
  } catch {
    // contentHint is best-effort and not supported everywhere.
  }

  try {
    await track.applyConstraints?.(speechAudioConstraints);
  } catch {
    // Some mobile browsers expose limited audio constraints; keep the stream alive.
  }
}

function attachStreamCleanup(stream, cleanup, audioSourceTracks = []) {
  try {
    Object.defineProperty(stream, STREAM_CLEANUP_KEY, {
      configurable: true,
      writable: true,
      value: cleanup,
    });
    Object.defineProperty(stream, AUDIO_SOURCE_TRACKS_KEY, {
      configurable: true,
      writable: true,
      value: audioSourceTracks,
    });
  } catch {
    stream[STREAM_CLEANUP_KEY] = cleanup;
    stream[AUDIO_SOURCE_TRACKS_KEY] = audioSourceTracks;
  }
}

async function createSpeechOptimizedStream(rawStream) {
  const audioTracks = rawStream.getAudioTracks();
  if (audioTracks.length === 0 || typeof window === "undefined") return rawStream;

  await Promise.all(audioTracks.map(applySpeechTrackSettings));

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return rawStream;

  try {
    const audioContext = new AudioContextConstructor({
      latencyHint: "interactive",
      sampleRate: 48000,
    });
    const source = audioContext.createMediaStreamSource(new MediaStream(audioTracks));
    const highPass = audioContext.createBiquadFilter();
    const lowPass = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const destination = audioContext.createMediaStreamDestination();

    highPass.type = "highpass";
    highPass.frequency.value = 120;
    highPass.Q.value = 0.7;

    lowPass.type = "lowpass";
    lowPass.frequency.value = 7800;
    lowPass.Q.value = 0.7;

    compressor.threshold.value = -42;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(compressor);
    compressor.connect(destination);

    await audioContext.resume?.().catch(() => {});

    const processedAudioTracks = destination.stream.getAudioTracks();
    processedAudioTracks.forEach((track) => {
      try {
        track.contentHint = "speech";
      } catch {
        // contentHint is best-effort.
      }
    });

    const enhancedStream = new MediaStream([
      ...rawStream.getVideoTracks(),
      ...processedAudioTracks,
    ]);

    attachStreamCleanup(enhancedStream, () => {
      audioTracks.forEach((track) => track.stop());
      audioContext.close?.().catch(() => {});
    }, audioTracks);

    return enhancedStream;
  } catch {
    return rawStream;
  }
}

export async function requestMediaStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera and microphone access.");
  }

  const preferredConstraints = {
    audio: speechAudioConstraints,
    video: {
      width: { ideal: 960, max: 1280 },
      height: { ideal: 540, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: { ideal: "user" },
    },
  };

  try {
    return await createSpeechOptimizedStream(await navigator.mediaDevices.getUserMedia(preferredConstraints));
  } catch (error) {
    if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") throw error;

    return createSpeechOptimizedStream(await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
      video: { facingMode: { ideal: "user" } },
    }));
  }
}

export async function createOffer(pc) {
  if (isClosed(pc)) throw new Error("Peer connection is already closed.");
  if (pc.signalingState !== "stable") throw new Error("Peer connection is not ready to create an offer.");

  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  if (isClosed(pc)) throw new Error("Peer connection closed before offer was applied.");
  await pc.setLocalDescription(offer);
  return pc.localDescription;
}

export async function createAnswerForOffer(pc, offer) {
  if (isClosed(pc)) throw new Error("Peer connection is already closed.");
  if (!offer || offer.type !== "offer") throw new Error("Invalid WebRTC offer.");

  if (pc.signalingState === "have-local-offer") {
    try {
      await pc.setLocalDescription({ type: "rollback" });
    } catch {
      throw new Error("Unable to rollback local offer before answering.");
    }
  }

  if (pc.signalingState !== "stable") {
    throw new Error("Peer connection is not ready for a new offer.");
  }

  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  await flushQueuedIceCandidates(pc);
  if (isClosed(pc)) throw new Error("Peer connection closed before answer was created.");

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return pc.localDescription;
}

export async function applyRemoteAnswer(pc, answer) {
  if (isClosed(pc) || pc.signalingState !== "have-local-offer") return;
  if (!answer || answer.type !== "answer") throw new Error("Invalid WebRTC answer.");

  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  await flushQueuedIceCandidates(pc);
}

export async function addRemoteIceCandidate(pc, candidate) {
  if (isClosed(pc) || !candidate) return;

  const iceCandidate = candidate instanceof RTCIceCandidate ? candidate : new RTCIceCandidate(candidate);
  if (!pc.remoteDescription) {
    if (queuedIceCandidates.length >= MAX_QUEUED_ICE_CANDIDATES) queuedIceCandidates.shift();
    queuedIceCandidates.push(iceCandidate);
    return;
  }

  if (isClosed(pc)) return;
  await pc.addIceCandidate(iceCandidate);
}

export async function flushQueuedIceCandidates(pc) {
  if (isClosed(pc) || !pc.remoteDescription || queuedIceCandidates.length === 0) return;

  const candidates = [...queuedIceCandidates];
  queuedIceCandidates = [];

  for (const candidate of candidates) {
    if (isClosed(pc)) return;
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Ignore stale candidates from a previous negotiation round.
    }
  }
}
