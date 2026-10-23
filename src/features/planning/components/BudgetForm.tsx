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
    <form className="planning-form planning-sectioned-form" onSubmit={onSubmit}>
      <fieldset className="planning-form-section">
        <legend>Identificação do orçamento</legend>
        <div className="planning-form-grid planning-form-grid--identity">
          <label className="planning-field--wide">
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
          <label className="planning-field--wide">
            Título
            <input required value={value.title} onChange={field('title')} />
          </label>
        </div>
      </fieldset>

      <fieldset className="planning-form-section">
        <legend>Dados da obra</legend>
        <div className="planning-form-grid">
          <label className="planning-field--full">
            Nome provisório da obra
            <input
              required
              value={value.proposedProjectName}
              onChange={field('proposedProjectName')}
            />
          </label>
          <label className="planning-field--full">
            Descrição
            <textarea
              rows={3}
              value={value.proposedProjectDescription}
              onChange={field('proposedProjectDescription')}
            />
          </label>
          <label className="planning-field--full">
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
            <input
              value={value.proposedProjectZipCode}
              onChange={field('proposedProjectZipCode')}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="planning-form-section">
        <legend>Condições comerciais</legend>
        <div className="planning-form-grid">
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
          <label className="planning-field--full">
            Condições comerciais
            <textarea rows={3} value={value.commercialTerms} onChange={field('commercialTerms')} />
          </label>
          <label className="planning-field--full">
            Notas
            <textarea rows={3} value={value.notes} onChange={field('notes')} />
          </label>
        </div>
      </fieldset>

      <div className="planning-actions planning-form-footer">
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
