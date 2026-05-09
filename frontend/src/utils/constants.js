export const EVENTS = {
  CONNECTION_SUCCESS: "connection_success",
  JOIN_QUEUE: "join_queue",
  LEAVE_QUEUE: "leave_queue",
  DISCONNECT_ROOM: "disconnect_room",
  NEXT_PARTNER: "next_partner",
  NEXT_PARTNER_WAITING: "next_partner_waiting",
  PARTNER_WAITING: "partner_waiting",
  PEER_RESET: "peer_reset",
  QUEUE_SIZE_UPDATED: "queue_size_updated",
  USER_MATCHED: "user_matched",
  MATCHED: "matched",
  SEND_OFFER: "send_offer",
  RECEIVE_OFFER: "receive_offer",
  SEND_ANSWER: "send_answer",
  RECEIVE_ANSWER: "receive_answer",
  SEND_ICE_CANDIDATE: "send_ice_candidate",
  RECEIVE_ICE_CANDIDATE: "receive_ice_candidate",
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  MESSAGE_SENT: "message_sent",
  PARTNER_DISCONNECTED: "partner_disconnected",
};

export const CHAT_MODES = {
  TEXT: "text",
  VIDEO: "video",
};

export const SESSION_STATUS = {
  IDLE: "idle",
  SEARCHING: "searching",
  MATCHED: "matched",
  PARTNER_DISCONNECTED: "partner_disconnected",
  ERROR: "error",
};

export const SOCKET_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
};

export const DEFAULT_API_URL = "https://omegal-n40p.onrender.com";

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;
