import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  autoConnect: false,
  withCredentials:true
});

export default socket;
