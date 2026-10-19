import './RegistrationDialog.scss';
import { useId, type ReactNode } from 'react';
import { Modal } from './Modal';

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'employee' | 'supplier' | 'tool';
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function RegistrationDialog({
  open, onOpenChange, kind, eyebrow, title, children,
}: RegistrationDialogProps) {
  const headingId = useId();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy={headingId}
      className={`ui-registration-dialog ${kind}-registration-dialog`}
      size="large"
    >
      <div className={`ui-registration-dialog__content ${kind}-registration-content`}>
        <header className={`ui-registration-dialog__header ${kind}-registration-header`}>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 id={headingId}>{title}</h1>
          </div>
          <button
            type="button"
            className={`ui-registration-dialog__close ${kind}-dialog-close`}
            aria-label="Fechar cadastro"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </Modal>
  );
}
