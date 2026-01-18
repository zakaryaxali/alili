import { memo } from 'react';

interface SessionControlsProps {
  isPaused: boolean;
  voiceEnabled: boolean;
  canSkip: boolean;
  isConnected: boolean;
  onPause: () => void;
  onSkip: () => void;
  onVoiceToggle: () => void;
  onExit: () => void;
  className?: string;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  isPaused,
  voiceEnabled,
  canSkip,
  isConnected,
  onPause,
  onSkip,
  onVoiceToggle,
  onExit,
  className,
}) => {
  return (
    <div className={`session-controls ${className || ''}`}>
      <button
        onClick={onPause}
        className="control-btn pause-btn"
        aria-label={isPaused ? 'Resume session' : 'Pause session'}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button
        onClick={onSkip}
        className="control-btn skip-btn"
        aria-label="Skip to next pose"
        disabled={!canSkip}
      >
        Skip
      </button>
      <button
        onClick={onVoiceToggle}
        className={`control-btn voice-btn ${voiceEnabled ? 'voice-on' : 'voice-off'}`}
        aria-label={voiceEnabled ? 'Disable voice guidance' : 'Enable voice guidance'}
        title={voiceEnabled ? 'Mute voice guidance' : 'Enable voice guidance'}
      >
        {voiceEnabled ? 'Voice' : 'Muted'}
      </button>
      <button
        onClick={onExit}
        className="control-btn exit-btn"
        aria-label="Exit session"
      >
        Exit
      </button>
      {!isConnected && (
        <div className="connection-status disconnected">
          <div className="status-indicator disconnected" />
          <span>Disconnected</span>
        </div>
      )}
    </div>
  );
};

export default memo(SessionControls);
