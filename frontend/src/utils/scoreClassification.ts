export interface ScoreLabel {
  label: string;
  className: string;
}

export const getScoreLabel = (score: number): ScoreLabel => {
  if (score >= 4) return { label: 'Excellent', className: 'excellent' };
  if (score >= 3) return { label: 'Good', className: 'good' };
  if (score >= 2) return { label: 'Fair', className: 'fair' };
  return { label: 'Needs Work', className: 'needs-work' };
};

export const getScoreClass = (score: number): string => getScoreLabel(score).className;
