export const formatBodyPartName = (part: string): string => {
  return part.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};
