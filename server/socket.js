import { Server as SocketIOServer } from 'socket.io';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    // Join event room for seat updates
    socket.on('join_event', ({ eventId, showId }) => {
      const room = showId ? `show_${showId}` : `event_${eventId}`;
      socket.join(room);
    });

    // Leave event room
    socket.on('leave_event', ({ eventId, showId }) => {
      const room = showId ? `show_${showId}` : `event_${eventId}`;
      socket.leave(room);
    });

    // Join admin dashboard room for real-time bookings
    socket.on('join_admin', () => {
      socket.join('admin_channel');
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

/**
 * Broadcasts seat status change (HELD, AVAILABLE, BOOKED) to all users in the event/show room
 */
export const broadcastSeatUpdate = ({ eventId, showId, seats, status, heldBy, expiresAt }) => {
  if (!ioInstance) return;
  const room = showId ? `show_${showId}` : `event_${eventId}`;
  const payload = { eventId, showId, seats, status, heldBy, expiresAt };
  ioInstance.to(room).emit('seat_status_changed', payload);
  // Also notify admin
  ioInstance.to('admin_channel').emit('admin_seat_updated', payload);
};

/**
 * Broadcasts a newly confirmed booking to the admin dashboard in real time
 */
export const broadcastNewBooking = (booking) => {
  if (!ioInstance) return;
  ioInstance.to('admin_channel').emit('new_booking_created', booking);
};

export default {
  initSocket,
  getIO,
  broadcastSeatUpdate,
  broadcastNewBooking,
};
