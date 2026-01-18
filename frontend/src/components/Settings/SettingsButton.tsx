import './SettingsButton.css';

interface SettingsButtonProps {
  onClick: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button className="settings-button" onClick={onClick} aria-label="Open settings">
      <span className="gear-icon"></span>
    </button>
  );
};

export default SettingsButton;
