import { useEffect, useRef } from 'react';
import { getScoreLabel } from '../utils/scoreClassification';
import type { YogaSession } from '../types/session';
import type { PoseScore } from './ActiveSession';
import './SessionComplete.css';

interface SessionCompleteProps {
  session: YogaSession | null;
  poseScores: PoseScore[];
  onNewSession: () => void;
  onSessionComplete?: () => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ session, poseScores, onNewSession, onSessionComplete }) => {
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (onSessionComplete && !hasCalledRef.current) {
      hasCalledRef.current = true;
      onSessionComplete();
    }
  }, [onSessionComplete]);
  const getScoreLabelForDisplay = (score: number) => {
    const rounded = Math.round(score * 5);
    return getScoreLabel(rounded);
  };

  const getOverallScore = (): number => {
    if (poseScores.length === 0) return 0;
    const total = poseScores.reduce((sum, p) => sum + p.averageScore, 0);
    return total / poseScores.length;
  };

  return (
    <div className="session-complete">
      <div className="complete-content">
        <h1>Session Complete!</h1>
        <p className="complete-message">Great work! You've completed your yoga session.</p>

        {session && (
          <div className="complete-stats">
            <div className="stat-card">
              <div className="stat-value">{session.num_poses}</div>
              <div className="stat-label">Poses Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{session.total_duration}</div>
              <div className="stat-label">Minutes</div>
            </div>
            {poseScores.length > 0 && (
              <div className="stat-card">
                <div className={`stat-value score-${getScoreLabelForDisplay(getOverallScore()).className}`}>
                  {Math.round(getOverallScore() * 100)}%
                </div>
                <div className="stat-label">Overall Score</div>
              </div>
            )}
          </div>
        )}

        {poseScores.length > 0 && (
          <div className="pose-scores-section">
            <h2>Per-Pose Breakdown</h2>
            <div className="pose-scores-list">
              {poseScores.map((poseScore, index) => {
                const { label, className } = getScoreLabelForDisplay(poseScore.averageScore);
                return (
                  <div key={index} className={`pose-score-item score-${className}`}>
                    <span className="pose-score-name">{poseScore.poseName}</span>
                    <span className="pose-score-value">
                      {Math.round(poseScore.averageScore * 100)}% - {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="new-session-btn" onClick={onNewSession}>
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default SessionComplete;
