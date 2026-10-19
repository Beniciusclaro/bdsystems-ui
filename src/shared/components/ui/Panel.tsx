import './Panel.scss';
import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}

export function Panel({ children, className = '', labelledBy }: PanelProps) {
  return (
    <section className={['panel-card', className].filter(Boolean).join(' ')} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
