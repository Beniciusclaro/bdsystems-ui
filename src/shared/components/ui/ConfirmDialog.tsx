import { useId, type ReactNode } from 'react';
import { Modal } from './Modal';
import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel: string;
  confirmingLabel: string;
  isConfirming: boolean;
  error?: string | null;
  eyebrow?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
  confirmingLabel,
  isConfirming,
  error,
  eyebrow,
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      closeOnBackdrop={!isConfirming}
      closeOnEscape={!isConfirming}
      size="small"
      className={`ui-confirm-dialog ui-confirm-dialog--${confirmVariant}`}
    >
      <div className="ui-confirm-dialog__content">
        {children}
        {eyebrow ? <p className="ui-confirm-dialog__eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId} className="ui-confirm-dialog__description">
          {description}
        </div>

        {error ? (
          <p className="message error ui-confirm-dialog__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="ui-confirm-dialog__actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ui-confirm-dialog__confirm ui-confirm-dialog__confirm--${confirmVariant}`}
            onClick={() => void onConfirm()}
            disabled={isConfirming}
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
