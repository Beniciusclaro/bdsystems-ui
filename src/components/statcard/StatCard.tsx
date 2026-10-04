import './StatCard.scss';

interface StatCardProps {
  label: string;
  value: string;
  accent: 'blue' | 'purple' | 'green';
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <article className={`stat-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
