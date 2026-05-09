import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants.js";

class SocketService {
  socket = null;

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });

    return this.socket;
  }

  getSocket() {
    return this.connect();
  }

  emit(event, payload) {
    this.connect().emit(event, payload);
  }

  on(event, handler) {
    this.connect().on(event, handler);
  }

  off(event, handler) {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();