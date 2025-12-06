export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseDetectionResult {
  landmarks: Landmark[];
  poseName: string;
  confidence: number;
  feedback: string[];
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'frame' | 'result' | 'error';
  data?: any;
  error?: string;
}
