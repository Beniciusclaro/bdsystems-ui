import type { KeyboardEvent, Key, MouseEvent, ReactNode } from 'react';
import './DataTable.scss';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  mobileLabel: string;
  renderCell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => Key;
  ariaLabel: string;
  onRowActivate?: (row: T) => void;
  getRowLabel?: (row: T) => string;
  className?: string;
  wrapperClassName?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  ariaLabel,
  onRowActivate,
  getRowLabel,
  className = '',
  wrapperClassName = '',
}: DataTableProps<T>) {
  const tableClassName = ['ui-data-table', className].filter(Boolean).join(' ');
  const wrapperClasses = ['ui-data-table-wrap', wrapperClassName].filter(Boolean).join(' ');

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (
      !onRowActivate ||
      (event.target instanceof Element &&
        event.target.closest('button, a, input, select, textarea, [role="button"], [role="link"]'))
    ) {
      return;
    }

    onRowActivate(row);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (
      !onRowActivate ||
      event.target !== event.currentTarget ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return;
    }

    event.preventDefault();
    onRowActivate(row);
  };

  return (
    <div className={wrapperClasses}>
      <table className={tableClassName} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.headerClassName}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              tabIndex={onRowActivate ? 0 : undefined}
              aria-label={getRowLabel?.(row)}
              onClick={onRowActivate ? (event) => handleRowClick(event, row) : undefined}
              onKeyDown={onRowActivate ? (event) => handleRowKeyDown(event, row) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.mobileLabel}
                  className={column.cellClassName}
                >
                  {column.renderCell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
