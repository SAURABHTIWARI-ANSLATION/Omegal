import { rtcConfig } from "../utils/rtcConfig.js";

let peerConnection = null;
let queuedIceCandidates = [];

export function getActivePeerConnection() {
  return peerConnection;
}

export function createManagedPeerConnection(handlers = {}) {
  closePeerConnection();

  const pc = new RTCPeerConnection(rtcConfig);
  peerConnection = pc;

  pc.onicecandidate = (event) => {
    if (event.candidate) handlers.onIceCandidate?.(event.candidate);
  };
  pc.ontrack = (event) => handlers.onTrack?.(event);
  pc.onconnectionstatechange = () => handlers.onConnectionStateChange?.(pc.connectionState);
  pc.oniceconnectionstatechange = () => handlers.onIceConnectionStateChange?.(pc.iceConnectionState);
  pc.onsignalingstatechange = () => handlers.onSignalingStateChange?.(pc.signalingState);

  return pc;
}

export function closePeerConnection() {
  if (!peerConnection) return;

  peerConnection.onicecandidate = null;
  peerConnection.ontrack = null;
  peerConnection.onconnectionstatechange = null;
  peerConnection.oniceconnectionstatechange = null;
  peerConnection.onsignalingstatechange = null;

  peerConnection.getSenders().forEach((sender) => {
    if (sender.track) peerConnection.removeTrack(sender);
  });
  peerConnection.close();
  peerConnection = null;
  queuedIceCandidates = [];
}

export function addLocalTracks(pc, stream) {
  if (!pc || !stream) return;

  const existingTrackIds = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
  stream.getTracks().forEach((track) => {
    if (!existingTrackIds.has(track.id)) {
      pc.addTrack(track, stream);
    }
  });
}

export async function requestMediaStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera and microphone access.");
  }

  const preferredConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      width: { ideal: 960, max: 1280 },
      height: { ideal: 540, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: { ideal: "user" },
    },
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") throw error;

    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: { ideal: "user" } },
    });
  }
}

export async function createOffer(pc) {
  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  return pc.localDescription;
}

export async function createAnswerForOffer(pc, offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  await flushQueuedIceCandidates(pc);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return pc.localDescription;
}

export async function applyRemoteAnswer(pc, answer) {
  if (!pc || pc.signalingState === "closed" || pc.signalingState === "stable") return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  await flushQueuedIceCandidates(pc);
}

export async function addRemoteIceCandidate(pc, candidate) {
  if (!pc || !candidate) return;

  const iceCandidate = candidate instanceof RTCIceCandidate ? candidate : new RTCIceCandidate(candidate);
  if (!pc.remoteDescription) {
    queuedIceCandidates.push(iceCandidate);
    return;
  }

  await pc.addIceCandidate(iceCandidate);
}

export async function flushQueuedIceCandidates(pc) {
  if (!pc || !pc.remoteDescription || queuedIceCandidates.length === 0) return;

  const candidates = [...queuedIceCandidates];
  queuedIceCandidates = [];
  await Promise.all(candidates.map((candidate) => pc.addIceCandidate(candidate)));
}
