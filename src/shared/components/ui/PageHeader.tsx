import './PageHeader.scss';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="dashboard-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}
