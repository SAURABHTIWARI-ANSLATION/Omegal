import { rtcConfig } from "../utils/rtcConfig.js";

let peerConnection = null;

const MAX_QUEUED_ICE_CANDIDATES = 80;
const STREAM_CLEANUP_KEY = "__omegalCleanup";
const AUDIO_SOURCE_TRACKS_KEY = "__omegalAudioSourceTracks";
const AUDIO_RESUME_KEY = "__omegalResumeAudio";

const speechAudioConstraints = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
};

const fallbackAudioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const preferredVideoConstraints = {
  width: { ideal: 960, max: 1280 },
  height: { ideal: 540, max: 720 },
  frameRate: { ideal: 24, max: 30 },
  facingMode: { ideal: "user" },
};

const fallbackVideoConstraints = {
  facingMode: { ideal: "user" },
};

export function optimizeAudioSdp(sdp) {
  if (!sdp || typeof sdp !== "string") return sdp;

  // Enforce Opus parameters: in-band Forward Error Correction (useinbandfec=1)
  // and disable discontinuous transmission (usedtx=0) to prevent speech cut-offs.
  return sdp.replace(/a=fmtp:(\d+)\s+([^\r\n]+)/g, (match, pt, params) => {
    if (params.includes("opus") || sdp.includes(`a=rtpmap:${pt} opus/48000`)) {
      let updatedParams = params;
      if (!updatedParams.includes("useinbandfec=")) {
        updatedParams += ";useinbandfec=1";
      } else {
        updatedParams = updatedParams.replace(/useinbandfec=\d/, "useinbandfec=1");
      }
      if (!updatedParams.includes("usedtx=")) {
        updatedParams += ";usedtx=0";
      } else {
        updatedParams = updatedParams.replace(/usedtx=\d/, "usedtx=0");
      }
      if (!updatedParams.includes("maxaveragebitrate=")) {
        updatedParams += ";maxaveragebitrate=128000";
      }
      return `a=fmtp:${pt} ${updatedParams}`;
    }
    return match;
  });
}

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
  pc._queuedCandidates = [];
  peerConnection = pc;

  // NOTE: Do NOT pre-seed transceivers with addTransceiver() here.
  // addTrack() in addLocalTracks() will create correct sendrecv transceivers
  // automatically. Pre-seeding with empty transceivers causes a
  // direction negotiation mismatch (sendrecv vs recvonly) on the answerer
  // side in Safari and certain Chrome versions, resulting in one-way video.

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

  peerConnection = null;
  if (pc._queuedCandidates) {
    pc._queuedCandidates = [];
  }

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

  resumeManagedAudioProcessing(stream);

  const existingTrackIds = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
  stream.getTracks().forEach((track) => {
    if (track.readyState !== "ended" && !existingTrackIds.has(track.id)) {
      pc.addTrack(track, stream);
    }
  });
}

export function setManagedAudioEnabled(stream, enabled) {
  if (!stream) return;

  if (enabled) resumeManagedAudioProcessing(stream);

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

export function resumeManagedAudioProcessing(stream) {
  if (!stream || typeof stream[AUDIO_RESUME_KEY] !== "function") return;
  stream[AUDIO_RESUME_KEY]();
}

async function applySpeechTrackSettings(track) {
  if (!track) return;

  try {
    track.contentHint = "speech";
  } catch {
    // contentHint is best-effort and not supported everywhere.
  }
}

function attachStreamLifecycle(stream, { cleanup }) {
  try {
    Object.defineProperty(stream, STREAM_CLEANUP_KEY, {
      configurable: true,
      writable: true,
      value: cleanup,
    });
  } catch {
    stream[STREAM_CLEANUP_KEY] = cleanup;
  }
}

function createSpeechOptimizedStream(rawStream) {
  if (!rawStream) return rawStream;

  const audioTracks = rawStream.getAudioTracks();
  if (audioTracks.length > 0) {
    audioTracks.forEach(applySpeechTrackSettings);
  }

  const cleanup = () => {
    rawStream.getTracks().forEach((track) => track.stop());
  };

  attachStreamLifecycle(rawStream, { cleanup });

  return rawStream;
}

function isPermissionDenied(error) {
  return error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
}

export async function requestMediaStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera and microphone access.");
  }

  const mediaAttempts = [
    {
      audio: speechAudioConstraints,
      video: preferredVideoConstraints,
    },
    {
      audio: fallbackAudioConstraints,
      video: fallbackVideoConstraints,
    },
    {
      audio: true,
      video: fallbackVideoConstraints,
    },
  ];

  let lastError = null;
  for (const constraints of mediaAttempts) {
    try {
      return await createSpeechOptimizedStream(await navigator.mediaDevices.getUserMedia(constraints));
    } catch (error) {
      if (isPermissionDenied(error)) throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to access your camera or microphone.");
}

export async function createOffer(pc) {
  if (isClosed(pc)) throw new Error("Peer connection is already closed.");
  if (pc.signalingState !== "stable") throw new Error("Peer connection is not ready to create an offer.");

  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  if (isClosed(pc)) throw new Error("Peer connection closed before offer was applied.");

  const modifiedSdp = optimizeAudioSdp(offer.sdp);
  const modifiedOffer = new RTCSessionDescription({ type: offer.type, sdp: modifiedSdp });

  await pc.setLocalDescription(modifiedOffer);
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

  const modifiedRemoteSdp = optimizeAudioSdp(offer.sdp);
  await pc.setRemoteDescription(new RTCSessionDescription({ type: offer.type, sdp: modifiedRemoteSdp }));
  await flushQueuedIceCandidates(pc);
  if (isClosed(pc)) throw new Error("Peer connection closed before answer was created.");

  const answer = await pc.createAnswer();
  const modifiedAnswerSdp = optimizeAudioSdp(answer.sdp);
  const modifiedAnswer = new RTCSessionDescription({ type: answer.type, sdp: modifiedAnswerSdp });

  await pc.setLocalDescription(modifiedAnswer);
  return pc.localDescription;
}

export async function applyRemoteAnswer(pc, answer) {
  if (isClosed(pc) || pc.signalingState !== "have-local-offer") return;
  if (!answer || answer.type !== "answer") throw new Error("Invalid WebRTC answer.");

  const modifiedAnswerSdp = optimizeAudioSdp(answer.sdp);
  await pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: modifiedAnswerSdp }));
  await flushQueuedIceCandidates(pc);
}

export async function addRemoteIceCandidate(pc, candidate) {
  if (isClosed(pc) || !candidate) return;

  const iceCandidate = candidate instanceof RTCIceCandidate ? candidate : new RTCIceCandidate(candidate);
  if (!pc.remoteDescription) {
    if (!pc._queuedCandidates) pc._queuedCandidates = [];
    if (pc._queuedCandidates.length >= MAX_QUEUED_ICE_CANDIDATES) pc._queuedCandidates.shift();
    pc._queuedCandidates.push(iceCandidate);
    return;
  }

  if (isClosed(pc)) return;
  await pc.addIceCandidate(iceCandidate);
}

export async function flushQueuedIceCandidates(pc) {
  if (isClosed(pc) || !pc.remoteDescription || !pc._queuedCandidates || pc._queuedCandidates.length === 0) return;

  const candidates = [...pc._queuedCandidates];
  pc._queuedCandidates = [];

  for (const candidate of candidates) {
    if (isClosed(pc)) return;
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Ignore stale candidates from a previous negotiation round.
    }
  }
}

export function stopLocalMedia(stream) {
  if (!stream) return;

  if (typeof stream[STREAM_CLEANUP_KEY] === "function") {
    try {
      stream[STREAM_CLEANUP_KEY]();
    } finally {
      stream[STREAM_CLEANUP_KEY] = null;
      stream[AUDIO_RESUME_KEY] = null;
      stream[AUDIO_SOURCE_TRACKS_KEY] = [];
    }
  }

  stream.getTracks().forEach((track) => track.stop());
}

export function detachRemoteMedia(audioElement, videoElement) {
  if (audioElement) {
    try {
      audioElement.pause();
    } catch {
      // Ignore pause errors
    }
    audioElement.srcObject = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

export async function getPeerConnectionStats(pc, localStream = null, remoteStream = null) {
  if (isClosed(pc)) return null;

  try {
    const stats = await pc.getStats();
    const localAudioTrack = localStream?.getAudioTracks?.()[0] || null;
    const localVideoTrack = localStream?.getVideoTracks?.()[0] || null;
    const remoteAudioTrack = remoteStream?.getAudioTracks?.()[0] || null;
    const remoteVideoTrack = remoteStream?.getVideoTracks?.()[0] || null;
    const audioSender = pc.getSenders?.().find((s) => s.track?.kind === "audio") || null;
    const videoSender = pc.getSenders?.().find((s) => s.track?.kind === "video") || null;

    const result = {
      localMedia: {
        localStreamId: localStream?.id || null,
        localAudioTrackId: localAudioTrack?.id || null,
        localVideoTrackId: localVideoTrack?.id || null,
        videoSenderTrackId: videoSender?.track?.id || null,
        audioSenderTrackId: audioSender?.track?.id || null,
        videoTrackVerified: Boolean(localVideoTrack && videoSender && localVideoTrack.id === videoSender.track?.id),
        audioTrackVerified: Boolean(localAudioTrack && audioSender && localAudioTrack.id === audioSender.track?.id),
        videoTrackReadyState: localVideoTrack?.readyState || null,
        videoTrackEnabled: localVideoTrack?.enabled ?? null,
      },
      remoteMedia: {
        remoteStreamId: remoteStream?.id || null,
        remoteAudioTrackId: remoteAudioTrack?.id || null,
        remoteVideoTrackId: remoteVideoTrack?.id || null,
        remoteVideoTrackReadyState: remoteVideoTrack?.readyState || null,
        remoteVideoTrackMuted: remoteVideoTrack?.muted ?? null,
      },
      transceivers: pc.getTransceivers?.().map((t) => ({
        mid: t.mid,
        direction: t.direction,
        currentDirection: t.currentDirection,
        senderTrackKind: t.sender?.track?.kind || null,
        receiverTrackKind: t.receiver?.track?.kind || null,
        stopped: t.stopped,
      })) || [],
      inboundAudio: { packetsReceived: 0, packetsLost: 0, jitter: 0, audioLevel: 0, concealedSamples: 0 },
      outboundAudio: { packetsSent: 0, audioLevel: 0 },
      inboundVideo: { packetsReceived: 0, packetsLost: 0, framesReceived: 0, framesDecoded: 0, framesDropped: 0, frameWidth: 0, frameHeight: 0, framesPerSecond: 0, jitter: 0 },
      outboundVideo: { packetsSent: 0, bytesSent: 0, framesEncoded: 0, framesSent: 0, frameWidth: 0, frameHeight: 0, framesPerSecond: 0 },
      connection: { rtt: 0, candidateType: "unknown" },
    };

    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        result.inboundAudio.packetsReceived = report.packetsReceived || 0;
        result.inboundAudio.packetsLost = report.packetsLost || 0;
        result.inboundAudio.jitter = report.jitter || 0;
        result.inboundAudio.audioLevel = report.audioLevel || 0;
        result.inboundAudio.concealedSamples = report.concealedSamples || 0;
      } else if (report.type === "outbound-rtp" && report.kind === "audio") {
        result.outboundAudio.packetsSent = report.packetsSent || 0;
      } else if (report.type === "media-source" && report.kind === "audio") {
        result.outboundAudio.audioLevel = report.audioLevel || 0;
      } else if (report.type === "inbound-rtp" && report.kind === "video") {
        result.inboundVideo.packetsReceived = report.packetsReceived || 0;
        result.inboundVideo.packetsLost = report.packetsLost || 0;
        result.inboundVideo.framesReceived = report.framesReceived || 0;
        result.inboundVideo.framesDecoded = report.framesDecoded || 0;
        result.inboundVideo.framesDropped = report.framesDropped || 0;
        result.inboundVideo.frameWidth = report.frameWidth || 0;
        result.inboundVideo.frameHeight = report.frameHeight || 0;
        result.inboundVideo.framesPerSecond = report.framesPerSecond || 0;
        result.inboundVideo.jitter = report.jitter || 0;
      } else if (report.type === "outbound-rtp" && report.kind === "video") {
        result.outboundVideo.packetsSent = report.packetsSent || 0;
        result.outboundVideo.bytesSent = report.bytesSent || 0;
        result.outboundVideo.framesEncoded = report.framesEncoded || 0;
        result.outboundVideo.framesSent = report.framesSent || 0;
        result.outboundVideo.frameWidth = report.frameWidth || 0;
        result.outboundVideo.frameHeight = report.frameHeight || 0;
        result.outboundVideo.framesPerSecond = report.framesPerSecond || 0;
      } else if (report.type === "candidate-pair" && report.state === "succeeded") {
        result.connection.rtt = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0;
      }
    });

    return result;
  } catch {
    return null;
  }
}

export function restartPeerIce(pc) {
  if (isClosed(pc) || typeof pc.restartIce !== "function") return false;
  try {
    pc.restartIce();
    return true;
  } catch {
    return false;
  }
}



