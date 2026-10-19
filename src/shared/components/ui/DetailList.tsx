import type { ReactNode } from 'react';
import './DetailList.scss';

export interface DetailItem {
  key: string;
  label: string;
  value: ReactNode;
  wide?: boolean;
}

export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="ui-detail-list">
      {items.map(({ key, label, value, wide }) => (
        <div key={key} className={wide ? 'ui-detail-list__wide' : undefined}>
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
