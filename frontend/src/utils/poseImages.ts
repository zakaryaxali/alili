const POSE_IMAGES: Record<string, string> = {
  'Mountain Pose': '/poses/mountain.png',
  'Warrior II Left': '/poses/warrior.png',
  'Warrior II Right': '/poses/warrior.png',
  'Easy Seat': '/poses/easyseat.png',
  'Downward Dog': '/poses/downwarddog.png',
};

const DEFAULT_IMAGE = '/poses/mountain.png';

export function getPoseImage(poseName: string): string {
  return POSE_IMAGES[poseName] || DEFAULT_IMAGE;
}
