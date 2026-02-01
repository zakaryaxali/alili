import { memo } from 'react';
import { getRequiredOrientationLabel, type OrientationLabel } from '../utils/poseOrientations';
import './OrientationBadge.css';

interface OrientationBadgeProps {
  poseName: string;
  isValid?: boolean;
}

const ICONS: Record<OrientationLabel, string> = {
  'Front View': '👤',
  'Side View': '🧍',
  'Any View': '↔️',
};

const OrientationBadge: React.FC<OrientationBadgeProps> = ({ poseName, isValid = true }) => {
  const label = getRequiredOrientationLabel(poseName);
  const icon = ICONS[label];

  return (
    <span className={`orientation-badge ${isValid ? 'valid' : 'invalid'}`}>
      <span className="orientation-badge-icon">{icon}</span>
      <span className="orientation-badge-label">{label}</span>
    </span>
  );
};

export default memo(OrientationBadge);
