export type CompletenessLevel = 'UNSET' | 'PACKED' | 'BUSY' | 'MODERATE' | 'OPEN';

export interface CompletenessConfig {
  label: string;
  color: string;
}

export const COMPLETENESS: Record<CompletenessLevel, CompletenessConfig> = {
  UNSET:    { label: 'Unset',    color: '' },
  PACKED:   { label: 'Packed',   color: '#ef4444' },
  BUSY:     { label: 'Busy',     color: '#f97316' },
  MODERATE: { label: 'Moderate', color: '#eab308' },
  OPEN:     { label: 'Open',     color: '#22c55e' },
};

export const COMPLETENESS_LEVELS: CompletenessLevel[] = ['PACKED', 'BUSY', 'MODERATE', 'OPEN'];
