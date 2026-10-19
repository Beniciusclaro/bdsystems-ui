import { useState } from 'react';
import type { SupplierRequest, SupplierResponse } from '../types/supplier';
import { FormField } from '../../../shared/components/ui/FormField';

interface SupplierFormProps {
  initialValues?: SupplierResponse;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: SupplierRequest) => Promise<void> | void;
}

interface SupplierFormState {
  legalName: string;
  tradeName: string;
  taxNumber: string;
  email: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

function toFormState(supplier?: SupplierResponse): SupplierFormState {
  return {
    legalName: supplier?.legalName ?? '',
    tradeName: supplier?.tradeName ?? '',
    taxNumber: supplier?.taxNumber ?? '',
    email: supplier?.email ?? '',
    phoneNumber: supplier?.phoneNumber ?? '',
    street: supplier?.address.street ?? '',
    city: supplier?.address.city ?? '',
    state: supplier?.address.state ?? '',
    zipCode: supplier?.address.zipCode ?? '',
  };
}

export function SupplierForm({
  initialValues,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
}: SupplierFormProps) {
  const [form, setForm] = useState(() => toFormState(initialValues));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: SupplierRequest = {
      legalName: form.legalName.trim(),
      tradeName: form.tradeName.trim() || null,
      taxNumber: form.taxNumber.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
      },
    };

    await onSubmit(payload);
  };

  return (
    <form className="supplier-form" onSubmit={handleSubmit}>
      <section className="supplier-form-section" aria-labelledby="supplier-data-heading">
        <h2 id="supplier-data-heading">Dados do fornecedor</h2>
        <div className="form-grid">
          <FormField label="Razão social" className="full-width">
            <input
              name="legalName"
              autoComplete="organization"
              value={form.legalName}
              onChange={handleChange}
              required
            />
          </FormField>

          <label>
            <span className="supplier-field-label">
              Nome fantasia <span className="supplier-optional">(opcional)</span>
            </span>
            <input
              name="tradeName"
              autoComplete="organization"
              value={form.tradeName}
              onChange={handleChange}
            />
          </label>

          <label>
            <span className="supplier-field-label">
              CNPJ / documento fiscal <span className="supplier-optional">(opcional)</span>
            </span>
            <input
              name="taxNumber"
              value={form.taxNumber}
              onChange={handleChange}
            />
          </label>

          <label>
            <span className="supplier-field-label">
              Email <span className="supplier-optional">(opcional)</span>
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            <span className="supplier-field-label">
              Telefone <span className="supplier-optional">(opcional)</span>
            </span>
            <input
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={handleChange}
            />
          </label>
        </div>
      </section>

      <section className="supplier-form-section" aria-labelledby="supplier-address-heading">
        <h2 id="supplier-address-heading">Endereço</h2>
        <div className="form-grid">
          <label className="full-width">
            Rua e número
            <input
              name="street"
              autoComplete="address-line1"
              value={form.street}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Cidade
            <input
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Estado
            <input
              name="state"
              autoComplete="address-level1"
              value={form.state}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            CEP
            <input
              name="zipCode"
              autoComplete="postal-code"
              value={form.zipCode}
              onChange={handleChange}
              required
            />
          </label>
        </div>
      </section>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
