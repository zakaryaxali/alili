import './PoseFeedback.css';

interface PoseFeedbackProps {
  feedback: string[];
  accuracy: number | null;
}

const PoseFeedback: React.FC<PoseFeedbackProps> = ({ feedback, accuracy }) => {
  const getScoreClass = (score: number): string => {
    if (score >= 5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 2) return 'needs-improvement';
    return 'poor';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 2) return 'Needs Improvement';
    return 'Poor';
  };

  // Mobile-friendly short labels (visible from distance)
  const getMobileLabel = (score: number): string => {
    if (score >= 4) return 'GREAT';
    if (score >= 2) return 'KEEP GOING';
    return 'ADJUST';
  };

  return (
    <div className="pose-feedback">
      {/* Mobile: Simple colored status bar */}
      <div className={`mobile-status-bar ${accuracy !== null ? getScoreClass(accuracy) : 'poor'}`}>
        {accuracy !== null ? getMobileLabel(accuracy) : 'DETECTING...'}
      </div>

      {/* Desktop: Full detailed view */}
      <div className="desktop-feedback">
        <h3>Form Check</h3>

        {accuracy !== null && (
          <div className="accuracy-score">
            <div className={`score-badge ${getScoreClass(accuracy)}`}>
              <span className="score-number">{accuracy}/5</span>
              <span className="score-label">{getScoreLabel(accuracy)}</span>
            </div>
          </div>
        )}

        {feedback && feedback.length > 0 ? (
          <div className="feedback-list">
            <ul>
              {feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="no-feedback">Great form! Maintain this position</p>
        )}
      </div>
    </div>
  );
};

export default PoseFeedback;
