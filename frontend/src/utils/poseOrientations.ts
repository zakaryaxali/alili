import type { Orientation } from '../types/pose';

/**
 * Required camera orientations for each pose.
 * Must match backend POSE_ORIENTATIONS in pose_recognition.py
 */
export const POSE_ORIENTATIONS: Record<string, Orientation[]> = {
  // Side view poses
  'Downward Dog': ['side_left', 'side_right'],
  'Plank': ['side_left', 'side_right'],
  'Reverse Table Top': ['side_left', 'side_right'],

  // Front view poses
  'Mountain Pose': ['front'],
  'Warrior II Left': ['front'],
  'Warrior II Right': ['front'],
  'Tree Pose Left': ['front'],
  'Tree Pose Right': ['front'],
  'Easy Seat': ['front'],
  'Seated Hands Behind Back Stretch': ['front'],
  'Gomukasana Legs Fold': ['front'],

  // Supine poses
  'Supine Bound Angle': ['front', 'supine'],
  'Hug the Knees': ['front', 'supine'],
  'Supine Bent Knees': ['front', 'supine'],

  // Any orientation works
  'Janu Sirsasana Twist Left': ['front', 'side_left', 'side_right'],
  'Janu Sirsasana Twist Right': ['front', 'side_left', 'side_right'],
  'Janu Sirsasana Revolved Left': ['front', 'side_left', 'side_right'],
  'Janu Sirsasana Revolved Right': ['front', 'side_left', 'side_right'],
};

export type OrientationLabel = 'Front View' | 'Side View' | 'Any View';

/**
 * Get user-friendly label for the required orientation of a pose.
 */
export function getRequiredOrientationLabel(poseName: string): OrientationLabel {
  const orientations = POSE_ORIENTATIONS[poseName];

  if (!orientations) {
    return 'Front View'; // Default
  }

  // If any orientation works (has 3+ options), show "Any View"
  if (orientations.length >= 3) {
    return 'Any View';
  }

  // Check if side view is required
  if (orientations.includes('side_left') || orientations.includes('side_right')) {
    return 'Side View';
  }

  return 'Front View';
}

/**
 * Check if the current orientation matches the required orientation for a pose.
 */
export function isOrientationValid(poseName: string, currentOrientation: Orientation): boolean {
  const required = POSE_ORIENTATIONS[poseName];
  if (!required) return true;
  return required.includes(currentOrientation);
}
