import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    // In Vite / Express unified container, connect to current origin
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
};

export const joinEventRoom = (eventId, showId) => {
  const s = getSocket();
  if (s) {
    s.emit('join_event', { eventId, showId });
  }
};

export const leaveEventRoom = (eventId, showId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave_event', { eventId, showId });
  }
};

export const joinAdminRoom = () => {
  const s = getSocket();
  if (s) {
    s.emit('join_admin');
  }
};

export default {
  getSocket,
  joinEventRoom,
  leaveEventRoom,
  joinAdminRoom,
};
