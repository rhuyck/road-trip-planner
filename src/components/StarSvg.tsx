'use client';
import { useId } from 'react';

const STAR_POINTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

export function StarSvg({ fillMode, size = 20 }: { fillMode: 'empty' | 'half' | 'full'; size?: number }) {
  const clipId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {fillMode === 'half' && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}
      <polygon
        points={STAR_POINTS}
        fill="none"
        stroke="#6b7280"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {fillMode !== 'empty' && (
        <polygon
          points={STAR_POINTS}
          fill="#f59e0b"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinejoin="round"
          clipPath={fillMode === 'half' ? `url(#${clipId})` : undefined}
        />
      )}
    </svg>
  );
}

export function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarSvg
          key={i}
          size={size}
          fillMode={value >= i ? 'full' : value >= i - 0.5 ? 'half' : 'empty'}
        />
      ))}
    </span>
  );
}
