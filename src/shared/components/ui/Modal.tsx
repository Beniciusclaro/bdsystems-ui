import { useEffect, useRef, type ReactNode } from 'react';
import './Modal.scss';

type ModalSize = 'small' | 'medium' | 'large';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabelledBy: string;
  ariaDescribedBy?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  size?: ModalSize;
  className?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = 'medium',
  className = '',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const classes = ['ui-modal', `ui-modal--${size}`, className].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (!closeOnEscape) {
          event.preventDefault();
        }
      }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
    >
      {children}
    </dialog>
  );
}
