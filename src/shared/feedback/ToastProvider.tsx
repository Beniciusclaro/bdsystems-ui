import { CheckCircle2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toastContext';
import './ToastProvider.scss';

interface ToastMessage {
  id: number;
  message: string;
}

const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const nextId = useRef(0);

  const regionRef = useRef<HTMLDivElement>(null);

  const showSuccess = useCallback((message: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message });
  }, []);

  useEffect(() => {
    const region = regionRef.current;

    if (toast) {
      region?.showPopover?.();
    } else {
      region?.hidePopover?.();
    }
  }, [toast]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), TOAST_DURATION);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      <div
        ref={regionRef}
        className="ui-toast-region"
        aria-live="polite"
        aria-atomic="true"
        popover="manual"
      >
        {toast ? (
          <div className="ui-toast ui-toast--success" role="status" key={toast.id}>
            <CheckCircle2 className="ui-toast__icon" aria-hidden="true" />
            <p>{toast.message}</p>
            <button
              type="button"
              className="ui-toast__close"
              aria-label="Fechar notificação"
              onClick={() => setToast(null)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
