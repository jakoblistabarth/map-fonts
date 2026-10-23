export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const rectsIntersect = (
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
  gap: number,
) =>
  a.left < b.right + gap &&
  a.right + gap > b.left &&
  a.top < b.bottom + gap &&
  a.bottom + gap > b.top;

export const shuffle = <T>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};
