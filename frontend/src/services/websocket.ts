import { io, Socket } from 'socket.io-client';
import type { PoseDetectionResult } from '../types/pose';

export class PoseWebSocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string = 'http://localhost:8000') {
    this.url = url;
  }

  connect(
    onResult: (result: PoseDetectionResult) => void,
    onError: (error: string) => void
  ): void {
    this.socket = io(this.url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('pose_result', (data: PoseDetectionResult) => {
      onResult(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      onError(error.message || 'WebSocket error occurred');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
      onError('Failed to connect to server');
    });
  }

  sendFrame(imageData: string): void {
    if (this.socket && this.socket.connected) {
      // Remove the data:image/jpeg;base64, prefix
      const base64Data = imageData.split(',')[1];
      this.socket.emit('video_frame', { image: base64Data });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
