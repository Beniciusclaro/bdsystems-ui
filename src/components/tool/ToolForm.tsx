import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ToolRequest, ToolResponse } from '../../types/tool';

interface ToolFormProps {
  initialValues?: ToolResponse;
  showRentalOption?: boolean;
  addRental?: boolean;
  onAddRentalChange?: (enabled: boolean) => void;
  children?: ReactNode;
  isSubmitting: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: ToolRequest) => Promise<void> | void;
}

export function ToolForm({
  initialValues,
  showRentalOption = false,
  addRental = false,
  onAddRentalChange,
  children,
  isSubmitting,
  submitDisabled = false,
  submitLabel,
  submittingLabel,
  onSubmit,
}: ToolFormProps) {
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      setValidationError('Informe o código e o nome da ferramenta.');
      return;
    }

    setValidationError(null);
    await onSubmit({ code: trimmedCode, name: trimmedName });
  };

  return (
    <form className="tool-form" onSubmit={handleSubmit}>
      {validationError ? <p className="message error" role="alert">{validationError}</p> : null}
      <div className="form-grid">
        <label>
          Código
          <input
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={50}
            autoComplete="off"
            required
          />
          <span className="tool-field-hint">Até 50 caracteres.</span>
        </label>
        <label>
          Nome
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            required
          />
          <span className="tool-field-hint">Até 150 caracteres.</span>
        </label>
      </div>
      {showRentalOption ? (
        <label className="tool-rental-checkbox">
          <input
            type="checkbox"
            checked={addRental}
            onChange={(event) => onAddRentalChange?.(event.target.checked)}
          />
          <span>Já criar um registo de aluguer</span>
        </label>
      ) : null}
      {children}
      <button
        type="submit"
        className="primary-button"
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
