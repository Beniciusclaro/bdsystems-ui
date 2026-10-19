import { useId } from 'react';
import './Pagination.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  ariaLabel: string;
  pageSizeLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  ariaLabel,
  pageSizeLabel = 'Itens por página',
  disabled = false,
  className = '',
}: PaginationProps) {
  const pageSizeId = useId();
  const classes = ['ui-pagination', className].filter(Boolean).join(' ');
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className={classes}>
      <label className="ui-pagination__page-size" htmlFor={pageSizeId}>
        {pageSizeLabel}
        <select
          id={pageSizeId}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          disabled={disabled}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>

      {totalPages > 1 ? (
        <nav className="ui-pagination__navigation" aria-label={ariaLabel}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={disabled || isFirstPage}
          >
            Anterior
          </button>
          <span aria-live="polite">Página {currentPage + 1} de {totalPages}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={disabled || isLastPage}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </div>
  );
}
