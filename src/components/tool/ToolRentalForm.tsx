import { useState } from 'react';
import type { SupplierResponse } from '../../types/supplier';
import type { ToolResponse } from '../../types/tool';
import {
  EMPTY_TOOL_RENTAL_DRAFT,
  type RentalPeriod,
  type ToolRentalDraft,
  type ToolRentalRequest,
  type ToolRentalResponse,
} from '../../types/toolRental';

interface ToolRentalFormProps {
  tool?: ToolResponse;
  suppliers: SupplierResponse[];
  initialValues?: ToolRentalResponse | ToolRentalDraft;
  fieldsOnly?: boolean;
  onDraftChange?: (draft: ToolRentalDraft) => void;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit?: (payload: ToolRentalRequest) => Promise<void> | void;
  onCancel?: () => void;
}

const periodOptions: Array<{ value: RentalPeriod; label: string }> = [
  { value: 'HOUR', label: 'Hora' },
  { value: 'DAY', label: 'Dia' },
  { value: 'WEEK', label: 'Semana' },
  { value: 'MONTH', label: 'Mês' },
];

export function ToolRentalForm({
  tool,
  suppliers,
  initialValues,
  fieldsOnly = false,
  onDraftChange,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: ToolRentalFormProps) {
  const [draft, setDraft] = useState<ToolRentalDraft>(() => (
    initialValues
      ? {
          supplierId: initialValues.supplierId,
          price: String(initialValues.price),
          rentalPeriod: initialValues.rentalPeriod,
          rentalStartDate: initialValues.rentalStartDate ?? '',
          rentalEndDate: initialValues.rentalEndDate ?? '',
        }
      : EMPTY_TOOL_RENTAL_DRAFT
  ));
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeSuppliers = suppliers.filter((supplier) => supplier.active);
  const updateDraft = (changes: Partial<ToolRentalDraft>) => {
    const nextDraft = { ...draft, ...changes };
    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = Number(draft.price);

    if (!draft.supplierId) {
      setValidationError('Selecione um fornecedor ativo.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setValidationError('Informe um preço igual ou superior a zero.');
      return;
    }
    if (
      draft.rentalStartDate &&
      draft.rentalEndDate &&
      draft.rentalEndDate < draft.rentalStartDate
    ) {
      setValidationError('A data de fim não pode ser anterior à data de início.');
      return;
    }
    if (!tool) {
      setValidationError('Salve a ferramenta antes de cadastrar o aluguer.');
      return;
    }
    if (!onSubmit) {
      setValidationError('Não foi possível enviar o registo de aluguer.');
      return;
    }

    setValidationError(null);
    await onSubmit({
      toolId: tool.id,
      supplierId: draft.supplierId,
      price: numericPrice,
      rentalPeriod: draft.rentalPeriod,
      rentalStartDate: draft.rentalStartDate || null,
      rentalEndDate: draft.rentalEndDate || null,
    });
  };

  const fields = (
    <>
      {validationError ? <p className="message error" role="alert">{validationError}</p> : null}
      {tool ? (
        <label>
          Ferramenta
          <input value={`${tool.code} — ${tool.name}`} readOnly aria-readonly="true" />
        </label>
      ) : null}
      <label>
        Fornecedor
        <select
          value={draft.supplierId}
          onChange={(event) => updateDraft({ supplierId: event.target.value })}
          required
          disabled={isSubmitting || activeSuppliers.length === 0}
        >
          <option value="">Selecione um fornecedor</option>
          {activeSuppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.tradeName || supplier.legalName}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Preço
          <input
            type="number"
            min="0"
            step="any"
            value={draft.price}
            onChange={(event) => updateDraft({ price: event.target.value })}
            required
          />
        </label>
        <label>
          Período
          <select
            value={draft.rentalPeriod}
            onChange={(event) => {
              const selected = periodOptions.find((period) => period.value === event.target.value);
              if (selected) {
                updateDraft({ rentalPeriod: selected.value });
              }
            }}
            required
          >
            {periodOptions.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </label>
        <label>
          Data de início <span className="tool-field-hint">(opcional)</span>
          <input
            type="date"
            value={draft.rentalStartDate}
            onChange={(event) => updateDraft({ rentalStartDate: event.target.value })}
          />
        </label>
        <label>
          Data de fim <span className="tool-field-hint">(opcional)</span>
          <input
            type="date"
            value={draft.rentalEndDate}
            min={draft.rentalStartDate || undefined}
            onChange={(event) => updateDraft({ rentalEndDate: event.target.value })}
          />
        </label>
      </div>
      {activeSuppliers.length === 0 ? (
        <p className="tool-field-hint" role="status">
          Cadastre e ative um fornecedor antes de criar um registo de aluguer.
        </p>
      ) : null}
    </>
  );

  if (fieldsOnly) {
    return <div className="tool-form tool-rental-form">{fields}</div>;
  }

  return (
    <form className="tool-form tool-rental-form" onSubmit={handleSubmit}>
      {fields}
      <div className="tool-form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting || activeSuppliers.length === 0}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
