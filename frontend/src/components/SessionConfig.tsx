import { useState, useEffect } from 'react';
import { SessionService } from '../services/sessionService';
import { formatBodyPartName } from '../utils/formatting';
import type { YogaSession, SessionPreview } from '../types/session';
import './SessionConfig.css';

interface SessionConfigProps {
  painAreas: string[];
  improvementAreas: string[];
  onStart: (session: YogaSession) => void;
  onBack: () => void;
}

const SessionConfig: React.FC<SessionConfigProps> = ({
  painAreas,
  improvementAreas,
  onStart,
  onBack
}) => {
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [preview, setPreview] = useState<SessionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const previewData = await SessionService.previewSession({
          pain_areas: painAreas,
          improvement_areas: improvementAreas,
          duration_minutes: durationMinutes
        });
        setPreview(previewData);
      } catch (err) {
        console.error('Failed to load preview:', err);
      }
    };
    loadPreview();
  }, [painAreas, improvementAreas, durationMinutes]);

  const handleStartSession = async () => {
    setLoading(true);
    setError('');

    try {
      const session = await SessionService.generateSession({
        pain_areas: painAreas,
        improvement_areas: improvementAreas,
        duration_minutes: durationMinutes
      });

      onStart(session);
    } catch {
      setError('Failed to generate session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="session-config">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="config-card">
        <div className="duration-selector">
          <label htmlFor="duration-slider">
            <h3>Session Duration</h3>
            <span className="duration-value">{durationMinutes} minutes</span>
          </label>

          <input
            id="duration-slider"
            type="range"
            min="10"
            max="60"
            step="5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="duration-slider"
          />

          <div className="duration-labels">
            <span>10 min</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>

        {preview && (
          <div className="session-preview">
            <h3>Session Preview</h3>
            <div className="preview-stats">
              <div className="stat">
                <div className="stat-value">{preview.estimated_poses}</div>
                <div className="stat-label">Poses</div>
              </div>
              <div className="stat">
                <div className="stat-value">{durationMinutes}</div>
                <div className="stat-label">Minutes</div>
              </div>
              <div className="stat">
                <div className="stat-value">~{Math.floor(durationMinutes * 60 / preview.estimated_poses)}s</div>
                <div className="stat-label">Per Pose (avg)</div>
              </div>
            </div>

            <div className="preview-tags">
              {painAreas.map(part => (
                <span key={`pain-${part}`} className="tag pain-tag">
                  {formatBodyPartName(part)} relief
                </span>
              ))}
              {improvementAreas.map(part => (
                <span key={`improve-${part}`} className="tag improvement-tag">
                  {formatBodyPartName(part)} strengthening
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        <button
          className="start-session-btn"
          onClick={handleStartSession}
          disabled={loading}
        >
          {loading ? 'Generating Session...' : 'Start Session'}
        </button>
      </div>
    </div>
  );
};

export default SessionConfig;
