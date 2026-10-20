import { useState } from 'react';
import { FormField } from '../../../shared/components/ui/FormField';
import type { Client, ClientRequest, ClientType } from '../../planning/types/planning';

interface ClientFormProps {
  initialValues?: Client;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: ClientRequest) => Promise<void> | void;
}

function toFormState(client?: Client) {
  return {
    type: client?.type ?? ('INDIVIDUAL' as ClientType),
    name: client?.name ?? '',
    document: client?.document ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    street: client?.street ?? '',
    city: client?.city ?? '',
    state: client?.state ?? '',
    zipCode: client?.zipCode ?? '',
  };
}

export function ClientForm({
  initialValues,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
}: ClientFormProps) {
  const [form, setForm] = useState(() => toFormState(initialValues));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      type: form.type,
      name: form.name.trim(),
      document: form.document.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      street: form.street.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zipCode: form.zipCode.trim() || null,
      active: initialValues?.active ?? true,
    });
  };

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <section className="client-form-section" aria-labelledby="client-data-heading">
        <h2 id="client-data-heading">Dados do cliente</h2>
        <div className="form-grid">
          <FormField label="Tipo de cliente">
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="INDIVIDUAL">Pessoa física</option>
              <option value="COMPANY">Empresa</option>
            </select>
          </FormField>

          <FormField label="Nome">
            <input
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Documento fiscal" optional>
            <input name="document" value={form.document} onChange={handleChange} />
          </FormField>

          <FormField label="Email" optional>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Telefone" optional>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </FormField>
        </div>
      </section>

      <section className="client-form-section" aria-labelledby="client-address-heading">
        <h2 id="client-address-heading">Morada</h2>
        <div className="form-grid">
          <FormField label="Rua e número" optional className="full-width">
            <input
              name="street"
              autoComplete="address-line1"
              value={form.street}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Cidade" optional>
            <input
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Distrito/estado" optional>
            <input
              name="state"
              autoComplete="address-level1"
              value={form.state}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Código postal" optional>
            <input
              name="zipCode"
              autoComplete="postal-code"
              value={form.zipCode}
              onChange={handleChange}
            />
          </FormField>
        </div>
      </section>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
