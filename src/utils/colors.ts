const PALETTE = [
  '#FF4757', '#FF6348', '#FFA502', '#ECCC68', '#F9CA24',
  '#6AB04C', '#2ED573', '#1E90FF', '#70A1FF', '#5352ED',
  '#A29BFE', '#FD79A8', '#E84393', '#00CEC9', '#00B894',
  '#FDCB6E', '#E17055', '#6C5CE7',
];

export function getDayColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
