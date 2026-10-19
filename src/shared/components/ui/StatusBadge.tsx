import type { ReactNode } from 'react';
import './StatusBadge.scss';

type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  tone: StatusBadgeTone;
  children: ReactNode;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`ui-status-badge ui-status-badge--${tone}`}>{children}</span>;
}
