export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type Orientation = 'front' | 'side_left' | 'side_right' | 'supine';

export interface PoseDetectionResult {
  landmarks: Landmark[];
  poseName: string;
  confidence: number | null; // null when orientation is invalid and can't score
  orientation: Orientation;
  orientationValid: boolean;
  feedback: string[];
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'frame' | 'result' | 'error';
  data?: PoseDetectionResult | string;
  error?: string;
}
