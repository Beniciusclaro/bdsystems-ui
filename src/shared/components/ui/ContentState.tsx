import type { ReactNode } from 'react';
import './ContentState.scss';

type ContentStateVariant = 'loading' | 'error' | 'empty' | 'no-results';

interface ContentStateProps {
  variant: ContentStateVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ContentState({
  variant,
  title,
  description,
  action,
  className = '',
}: ContentStateProps) {
  const role = variant === 'error' ? 'alert' : variant === 'loading' ? 'status' : undefined;

  const classes = ['ui-content-state', `ui-content-state--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role={role}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
