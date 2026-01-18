import { Play, RotateCcw } from 'lucide-react';
import './Settings.css';

interface SettingsProps {
  showTips: boolean;
  sessionsCompleted: number;
  onToggleTips: () => void;
  onRewatchTutorial: () => void;
  onResetOnboarding: () => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  showTips,
  sessionsCompleted,
  onToggleTips,
  onRewatchTutorial,
  onResetOnboarding,
  onClose,
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <span className="close-icon"></span>
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Preferences</h3>
            <div className="settings-option">
              <div className="option-info">
                <span className="option-label">Show helpful tips</span>
                <span className="option-description">Display tips during sessions</span>
              </div>
              <button
                className={`toggle-switch ${showTips ? 'active' : ''}`}
                onClick={onToggleTips}
                role="switch"
                aria-checked={showTips}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Tutorial</h3>
            <button className="settings-action-button" onClick={onRewatchTutorial}>
              <Play size={20} color="#fff" />
              Re-watch tutorial
            </button>
            <button className="settings-action-button danger" onClick={onResetOnboarding}>
              <RotateCcw size={20} color="rgba(255,255,255,0.7)" />
              Reset onboarding
            </button>
          </div>

          <div className="settings-section">
            <h3>Stats</h3>
            <div className="settings-stat">
              <span className="stat-label">Sessions completed</span>
              <span className="stat-value">{sessionsCompleted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
