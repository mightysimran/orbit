import { io } from 'socket.io-client';

// REPLACE WITH YOUR ACTUAL HOTSPOT IP
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (this.socket && this.socket.connected) {
      if (userId) this.socket.emit('join', userId);
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('🟢 Connected to Socket.io server:', this.socket.id);
      if (userId) this.socket.emit('join', userId);
    });
  }

  requestRide(rideData) {
    if (this.socket) {
      this.socket.emit('request_ride', rideData);
    }
  }

  onNewRide(callback) {
    if (this.socket) {
      // Clear old listeners to prevent double-firing
      this.socket.off('new_ride_available'); 
      
      this.socket.on('new_ride_available', (data) => {
        console.log("🎯 SOCKET SERVICE CAUGHT IT! Passing to UI...");
        callback(data); 
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

const socketService = new SocketService();
export default socketService;