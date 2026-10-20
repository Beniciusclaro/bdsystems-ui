import type { LucideIcon } from 'lucide-react';
import './StatCard.scss';

interface StatCardProps {
  label: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
  error?: string;
}

export function StatCard({ label, value, hint, icon: Icon, error }: StatCardProps) {
  return (
    <article className={`stat-card${error ? ' stat-card--error' : ''}`}>
      <div className="stat-card__header">
        <span>{label}</span>
        <span className="stat-card__icon">
          <Icon aria-hidden="true" />
        </span>
      </div>
      <strong>{error ? '—' : (value ?? 0).toLocaleString('pt-PT')}</strong>
      <small title={error}>{error ?? hint}</small>
    </article>
  );
}
