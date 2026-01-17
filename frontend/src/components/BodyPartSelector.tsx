import { useState, useEffect, useRef } from 'react';
import { SessionService } from '../services/sessionService';
import { formatBodyPartName } from '../utils/formatting';
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
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const parts = await SessionService.getBodyParts();
        setBodyParts(parts);
        setLoading(false);
      } catch {
        setError('Failed to load body parts');
        setLoading(false);
      }
    };
    loadBodyParts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    };

    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup]);

  const handleBodyPartClick = (part: string) => {
    setActivePopup(activePopup === part ? null : part);
  };

  const handleSelection = (part: string, type: 'pain' | 'improve') => {
    const newPain = new Set(painAreas);
    const newImprovement = new Set(improvementAreas);

    if (type === 'pain') {
      if (newPain.has(part)) {
        newPain.delete(part);
      } else {
        newPain.add(part);
        newImprovement.delete(part);
      }
    } else {
      if (newImprovement.has(part)) {
        newImprovement.delete(part);
      } else {
        newImprovement.add(part);
        newPain.delete(part);
      }
    }

    setPainAreas(newPain);
    setImprovementAreas(newImprovement);
    setActivePopup(null);
  };

  const getButtonClass = (part: string): string => {
    if (painAreas.has(part)) return 'body-part-btn selected pain';
    if (improvementAreas.has(part)) return 'body-part-btn selected improve';
    return 'body-part-btn';
  };

  const handleContinue = () => {
    onComplete(Array.from(painAreas), Array.from(improvementAreas));
  };

  if (loading) {
    return <div className="body-part-selector loading">Loading body parts...</div>;
  }

  if (error) {
    return <div className="body-part-selector error">{error}</div>;
  }

  return (
    <div className="body-part-selector">
      <p className="subtitle">Select areas for relief or improvement</p>

      <div className="body-parts-grid">
        {bodyParts.map(part => (
          <div key={part} className="body-part-wrapper">
            <button
              className={getButtonClass(part)}
              onClick={() => handleBodyPartClick(part)}
            >
              {formatBodyPartName(part)}
            </button>
            {activePopup === part && (
              <div className="selection-popup" ref={popupRef}>
                <button
                  className={`popup-btn pain ${painAreas.has(part) ? 'active' : ''}`}
                  onClick={() => handleSelection(part, 'pain')}
                >
                  😣 Hurts
                </button>
                <button
                  className={`popup-btn improve ${improvementAreas.has(part) ? 'active' : ''}`}
                  onClick={() => handleSelection(part, 'improve')}
                >
                  💪 Improve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="continue-btn"
        onClick={handleContinue}
      >
        Continue to Session Setup
      </button>
    </div>
  );
};

export default BodyPartSelector;
