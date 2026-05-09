const turnUrls = (import.meta.env.VITE_TURN_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const turnServer =
  turnUrls.length > 0
    ? {
        urls: turnUrls,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL,
      }
    : null;

export const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    ...(turnServer ? [turnServer] : []),
  ],
  iceCandidatePoolSize: 10,
};
