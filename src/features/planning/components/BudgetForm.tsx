import type { ChangeEvent, FormEvent } from 'react';
import type { BudgetFormValue } from '../budgetFormModel';
import type { Client } from '../types/planning';

interface BudgetFormProps {
  value: BudgetFormValue;
  clients: Client[];
  onChange: (value: BudgetFormValue) => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function BudgetForm({
  value,
  clients,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  onCancel,
}: BudgetFormProps) {
  const field =
    (key: keyof BudgetFormValue) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...value, [key]: event.target.value });

  return (
    <form className="planning-form" onSubmit={onSubmit}>
      <label>
        Cliente
        <select required value={value.clientId} onChange={field('clientId')}>
          <option value="">Selecione</option>
          {clients
            .filter((client) => client.active || client.id === value.clientId)
            .map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Número
        <input required value={value.number} onChange={field('number')} />
      </label>
      <label>
        Título
        <input required value={value.title} onChange={field('title')} />
      </label>
      <label>
        Nome provisório da obra
        <input required value={value.proposedProjectName} onChange={field('proposedProjectName')} />
      </label>
      <label>
        Descrição
        <textarea
          value={value.proposedProjectDescription}
          onChange={field('proposedProjectDescription')}
        />
      </label>
      <label>
        Morada
        <input value={value.proposedProjectStreet} onChange={field('proposedProjectStreet')} />
      </label>
      <label>
        Cidade
        <input value={value.proposedProjectCity} onChange={field('proposedProjectCity')} />
      </label>
      <label>
        Estado
        <input value={value.proposedProjectState} onChange={field('proposedProjectState')} />
      </label>
      <label>
        Código postal
        <input value={value.proposedProjectZipCode} onChange={field('proposedProjectZipCode')} />
      </label>
      <label>
        Validade
        <input type="date" value={value.validUntil} onChange={field('validUntil')} />
      </label>
      <label>
        Imposto (%)
        <input
          min="0"
          step="0.01"
          type="number"
          value={value.taxPercent}
          onChange={field('taxPercent')}
        />
      </label>
      <label>
        Margem (%)
        <input
          min="0"
          step="0.01"
          type="number"
          value={value.marginPercent}
          onChange={field('marginPercent')}
        />
      </label>
      <label>
        Condições comerciais
        <textarea value={value.commercialTerms} onChange={field('commercialTerms')} />
      </label>
      <label>
        Notas
        <textarea value={value.notes} onChange={field('notes')} />
      </label>
      <div className="planning-actions">
        <button type="button" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
        <button className="primary-button" disabled={pending}>
          {pending ? 'A guardar...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
