import { memo } from 'react';
import { getScoreClass, getScoreLabel } from '../utils/scoreClassification';
import type { Orientation } from '../types/pose';
import './PoseFeedback.css';

interface PoseFeedbackProps {
  feedback: string[];
  accuracy: number | null;
  orientation?: Orientation;
  orientationValid?: boolean;
}

// Map orientation to user-friendly label
const ORIENTATION_LABELS: Record<Orientation, string> = {
  front: 'Front view',
  side_left: 'Side view',
  side_right: 'Side view',
  supine: 'Supine',
};

const PoseFeedback: React.FC<PoseFeedbackProps> = ({
  feedback,
  accuracy,
  orientation,
  orientationValid = true,
}) => {
  // Mobile-friendly short labels (visible from distance)
  const getMobileLabel = (score: number | null, isOrientationValid: boolean): string => {
    if (!isOrientationValid) return 'REPOSITION';
    if (score === null) return 'DETECTING...';
    if (score >= 4) return 'GREAT';
    if (score >= 2) return 'KEEP GOING';
    return 'ADJUST';
  };

  // Get status bar class based on orientation validity and score
  const getStatusClass = (): string => {
    if (!orientationValid) return 'orientation-warning';
    if (accuracy === null) return 'poor';
    return getScoreClass(accuracy);
  };

  const orientationLabel = orientation ? ORIENTATION_LABELS[orientation] : undefined;

  return (
    <div className="pose-feedback">
      {/* Mobile: Simple colored status bar */}
      <div className={`mobile-status-bar ${getStatusClass()}`}>
        {getMobileLabel(accuracy, orientationValid)}
      </div>

      {/* Desktop: Full detailed view */}
      <div className="desktop-feedback">
        <h3>Form Check</h3>

        {/* Orientation indicator */}
        {orientationLabel && (
          <div className={`orientation-indicator ${orientationValid ? 'valid' : 'invalid'}`}>
            {orientationLabel}
          </div>
        )}

        {/* Score display - show --/5 when orientation invalid */}
        <div className="accuracy-score">
          <div className={`score-badge ${orientationValid ? (accuracy !== null ? getScoreClass(accuracy) : 'poor') : 'orientation-warning'}`}>
            <span className="score-number">
              {orientationValid && accuracy !== null ? accuracy : '--'}/5
            </span>
            <span className="score-label">
              {orientationValid && accuracy !== null
                ? getScoreLabel(accuracy).label
                : 'Reposition'}
            </span>
          </div>
        </div>

        {feedback && feedback.length > 0 ? (
          <div className="feedback-list">
            <ul>
              {feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : orientationValid ? (
          <p className="no-feedback">Great form! Maintain this position</p>
        ) : null}
      </div>
    </div>
  );
};

export default memo(PoseFeedback);
