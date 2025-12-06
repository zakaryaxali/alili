import type { PoseDetectionResult } from '../types/pose';
import './PoseFeedback.css';

interface PoseFeedbackProps {
  result: PoseDetectionResult | null;
  isConnected: boolean;
}

const PoseFeedback: React.FC<PoseFeedbackProps> = ({ result, isConnected }) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="pose-feedback">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {result ? (
        <>
          <div className="pose-info">
            <h2>{result.poseName || 'Unknown Pose'}</h2>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${result.confidence * 100}%`,
                  backgroundColor: getConfidenceColor(result.confidence)
                }}
              />
            </div>
            <p className="confidence-text">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>

          {result.feedback && result.feedback.length > 0 && (
            <div className="feedback-list">
              <h3>Feedback</h3>
              <ul>
                {result.feedback.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="no-pose">
          <p>No pose detected. Stand in front of the camera.</p>
        </div>
      )}
    </div>
  );
};

export default PoseFeedback;
