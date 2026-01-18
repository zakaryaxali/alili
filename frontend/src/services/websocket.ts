import { io, Socket } from 'socket.io-client';
import type { PoseDetectionResult } from '../types/pose';
import { getWsUrl } from './api';

export class PoseWebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private connectionReadyPromise: Promise<void> | null = null;
  private connectionReadyResolve: (() => void) | null = null;
  private onConnectionStateChange: ((connected: boolean) => void) | null = null;

  constructor(url: string = getWsUrl()) {
    this.url = url;
  }

  connect(
    onResult: (result: PoseDetectionResult) => void,
    onError: (error: string) => void,
    onConnectionChange?: (connected: boolean) => void
  ): Promise<void> {
    // Create a promise that resolves when connection is ready
    this.connectionReadyPromise = new Promise((resolve) => {
      this.connectionReadyResolve = resolve;
    });

    // Store the connection state change callback
    this.onConnectionStateChange = onConnectionChange || null;

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],  // WebSocket first, polling fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(true);
      }
    });

    // Listen for backend's connect_response to confirm readiness
    this.socket.on('connect_response', (data: { status: string; message?: string }) => {
      console.log('Backend confirmed connection:', data);
      if (this.connectionReadyResolve) {
        this.connectionReadyResolve();
        this.connectionReadyResolve = null;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(false);
      }
    });

    this.socket.on('pose_result', (data: PoseDetectionResult) => {
      onResult(data);
    });

    this.socket.on('error', (error: { message?: string }) => {
      console.error('WebSocket error:', error);
      onError(error.message || 'WebSocket error occurred');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      onError('Failed to connect to server');
    });

    return this.connectionReadyPromise;
  }

  sendFrame(imageData: string, targetPose?: string): void {
    if (this.socket && this.socket.connected) {
      // Remove the data:image/jpeg;base64, prefix
      const base64Data = imageData.split(',')[1];
      const payload: { image: string; target_pose?: string } = { image: base64Data };

      // Include target_pose if provided
      if (targetPose) {
        payload.target_pose = targetPose;
      }

      this.socket.emit('video_frame', payload);
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
