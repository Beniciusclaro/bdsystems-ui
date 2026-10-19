import { useId, type ReactNode } from 'react';
import { Modal } from './Modal';
import './DetailsDialog.scss';

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  heading: string;
  closeLabel?: string;
  children: ReactNode;
}

export function DetailsDialog({
  open,
  onOpenChange,
  eyebrow,
  heading,
  closeLabel = 'Fechar detalhes',
  children,
}: DetailsDialogProps) {
  const headingId = useId();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy={headingId}
      size="large"
      className="ui-details-dialog"
    >
      <header className="ui-details-dialog__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId}>{heading}</h2>
        </div>
        <button
          type="button"
          className="ui-details-dialog__close"
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
      </header>
      {children}
    </Modal>
  );
}
