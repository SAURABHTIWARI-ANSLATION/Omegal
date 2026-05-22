export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function createId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function formatTime(value = Date.now()) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getSignalDescription(payload, key) {
  if (!payload) return null;
  if (payload[key]) return payload[key];
  if (payload.description) return payload.description;
  if (payload.sdp && payload.type) return payload;
  return null;
}

export function normalizeMatchPayload(payload = {}) {
  return {
    roomId: payload.roomId || payload.room || payload.room_id || null,
    partnerId: payload.partnerId || payload.partnerSocketId || payload.partner || null,
    sessionVersion: Number(payload.sessionVersion ?? payload.session_version ?? 1) || 1,
    reconnect: Boolean(payload.reconnect),
    message: payload.message || null,
  };
}

export function normalizeIncomingMessage(payload = {}, socketId) {
  const rawMessage = payload.message ?? payload.text ?? payload.content ?? "";
  const senderId = payload.senderId || payload.from || payload.socketId || null;
  const isMine = senderId && socketId && senderId === socketId;

  return {
    id: payload.id || payload.messageId || createId("msg"),
    clientMessageId: payload.clientMessageId || null,
    content: typeof rawMessage === "string" ? rawMessage : String(rawMessage),
    sender: isMine ? "me" : "partner",
    senderId,
    status: "delivered",
    timestamp: payload.timestamp || Date.now(),
  };
}

export function getMediaErrorMessage(error) {
  if (!error) return "Unable to access your camera or microphone.";

  const name = error.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera or microphone permission was denied. Allow access and try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera or microphone was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Your camera or microphone is already in use by another app.";
  }
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "Your camera does not support the requested video settings.";
  }

  return error.message || "Unable to access your camera or microphone.";
}

export function determineOfferer(socketId, partnerId) {
  if (!socketId || !partnerId) return false;
  return socketId > partnerId;
}

export function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}
