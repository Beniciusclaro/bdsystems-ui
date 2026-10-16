import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './RowActions.scss';

interface RowActionsProps {
  label?: string;
  children: ReactNode;
}

interface IconActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string;
  variant?: 'default' | 'accent' | 'danger';
  children: ReactNode;
}

export function RowActions({ label = 'Ações', children }: RowActionsProps) {
  return (
    <div className="ui-row-actions" role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function IconActionButton({
  label,
  variant = 'default',
  children,
  className = '',
  title,
  ...buttonProps
}: IconActionButtonProps) {
  const classes = ['ui-icon-action', `ui-icon-action--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...buttonProps}
      type="button"
      className={classes}
      aria-label={label}
      title={title ?? label}
    >
      {children}
    </button>
  );
}
