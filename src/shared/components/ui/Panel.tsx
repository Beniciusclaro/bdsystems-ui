import './Panel.scss';
import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  labelledBy?: string;
}

export function Panel({ children, className = '', labelledBy, ...props }: PanelProps) {
  return (
    <section
      className={['panel-card', className].filter(Boolean).join(' ')}
      aria-labelledby={labelledBy}
      {...props}
    >
      {children}
    </section>
  );
}
