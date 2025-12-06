import { useEffect, useRef } from 'react';
import { Landmark } from '../types/pose';
import './PoseOverlay.css';

interface PoseOverlayProps {
  landmarks: Landmark[];
  width: number;
  height: number;
}

// MediaPipe pose connections (pairs of landmark indices)
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], // Face
  [9, 10], // Mouth
  [11, 12], // Shoulders
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], // Left arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], // Right arm
  [11, 23], [12, 24], [23, 24], // Torso
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31], // Left leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32], // Right leg
];

const PoseOverlay: React.FC<PoseOverlayProps> = ({ landmarks, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    POSE_CONNECTIONS.forEach(([start, end]) => {
      if (start >= landmarks.length || end >= landmarks.length) return;

      const startLandmark = landmarks[start];
      const endLandmark = landmarks[end];

      // Only draw if both landmarks are visible
      if (startLandmark.visibility > 0.5 && endLandmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    landmarks.forEach((landmark) => {
      if (landmark.visibility > 0.5) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [landmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pose-overlay"
    />
  );
};

export default PoseOverlay;
