import './FormField.scss';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
}

export function FormField({ label, children, hint, optional = false, className }: FormFieldProps) {
  return (
    <label className={className}>
      <span>{label}{optional ? <span className="field-optional"> (opcional)</span> : null}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
