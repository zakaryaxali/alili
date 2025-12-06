import { useState, useEffect } from 'react';
import { SessionService } from '../services/sessionService';
import './BodyPartSelector.css';

interface BodyPartSelectorProps {
  onComplete: (painAreas: string[], improvementAreas: string[]) => void;
}

const BodyPartSelector: React.FC<BodyPartSelectorProps> = ({ onComplete }) => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [painAreas, setPainAreas] = useState<Set<string>>(new Set());
  const [improvementAreas, setImprovementAreas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadBodyParts();
  }, []);

  const loadBodyParts = async () => {
    try {
      const parts = await SessionService.getBodyParts();
      setBodyParts(parts);
      setLoading(false);
    } catch (err) {
      setError('Failed to load body parts');
      setLoading(false);
    }
  };

  const togglePain = (part: string) => {
    const newPain = new Set(painAreas);
    if (newPain.has(part)) {
      newPain.delete(part);
    } else {
      newPain.add(part);
      // Remove from improvement if in pain
      const newImprovement = new Set(improvementAreas);
      newImprovement.delete(part);
      setImprovementAreas(newImprovement);
    }
    setPainAreas(newPain);
  };

  const toggleImprovement = (part: string) => {
    const newImprovement = new Set(improvementAreas);
    if (newImprovement.has(part)) {
      newImprovement.delete(part);
    } else {
      newImprovement.add(part);
      // Remove from pain if in improvement
      const newPain = new Set(painAreas);
      newPain.delete(part);
      setPainAreas(newPain);
    }
    setImprovementAreas(newImprovement);
  };

  const handleContinue = () => {
    onComplete(Array.from(painAreas), Array.from(improvementAreas));
  };

  const formatBodyPartName = (part: string): string => {
    return part.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <div className="body-part-selector loading">Loading body parts...</div>;
  }

  if (error) {
    return <div className="body-part-selector error">{error}</div>;
  }

  return (
    <div className="body-part-selector">
      <h2>What would you like to work on today?</h2>
      <p className="subtitle">Select body parts that hurt or that you want to improve</p>

      <div className="selection-columns">
        <div className="column pain-column">
          <h3>😣 What hurts?</h3>
          <div className="body-parts-grid">
            {bodyParts.map(part => (
              <button
                key={`pain-${part}`}
                className={`body-part-btn ${painAreas.has(part) ? 'selected pain' : ''}`}
                onClick={() => togglePain(part)}
              >
                {formatBodyPartName(part)}
              </button>
            ))}
          </div>
        </div>

        <div className="column improvement-column">
          <h3>💪 What to improve?</h3>
          <div className="body-parts-grid">
            {bodyParts.map(part => (
              <button
                key={`improve-${part}`}
                className={`body-part-btn ${improvementAreas.has(part) ? 'selected improve' : ''}`}
                onClick={() => toggleImprovement(part)}
              >
                {formatBodyPartName(part)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="selection-summary">
        {painAreas.size > 0 && (
          <div className="summary-item">
            <strong>Pain areas:</strong> {Array.from(painAreas).map(formatBodyPartName).join(', ')}
          </div>
        )}
        {improvementAreas.size > 0 && (
          <div className="summary-item">
            <strong>Improvement areas:</strong> {Array.from(improvementAreas).map(formatBodyPartName).join(', ')}
          </div>
        )}
      </div>

      <button
        className="continue-btn"
        onClick={handleContinue}
        disabled={painAreas.size === 0 && improvementAreas.size === 0}
      >
        Continue to Session Setup
      </button>
    </div>
  );
};

export default BodyPartSelector;
