import { useState } from 'react';
import type { EmployeeRequest } from '../../types/employee';

interface EmployeeFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: EmployeeRequest) => Promise<void> | void;
}

const initialForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  documentNumber: '',
  birthDate: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  employeeNumber: '',
  position: '',
  department: '',
  admissionDate: '',
  terminationDate: '',
};

export function EmployeeForm({ isSubmitting, onSubmit }: EmployeeFormProps) {
  const [form, setForm] = useState(initialForm);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: EmployeeRequest = {
      fullName: form.fullName,
      email: form.email,
      ...(form.phoneNumber ? { phoneNumber: form.phoneNumber } : {}),
      ...(form.documentNumber ? { documentNumber: form.documentNumber } : {}),
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
      },
      employeeNumber: form.employeeNumber,
      position: form.position,
      department: form.department,
      admissionDate: form.admissionDate,
      ...(form.terminationDate ? { terminationDate: form.terminationDate } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <section className="employee-form-section" aria-labelledby="employee-personal-heading">
        <h2 id="employee-personal-heading">Dados pessoais</h2>
        <div className="form-grid">
          <label>
            Nome completo
            <input
              name="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </label>

          <label>
            Telefone
            <input
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              maxLength={255}
            />
          </label>

          <label>
            Documento
            <input
              name="documentNumber"
              value={form.documentNumber}
              onChange={handleChange}
              maxLength={255}
            />
          </label>

          <label>
            Data de nascimento
            <input
              type="date"
              name="birthDate"
              autoComplete="bday"
              value={form.birthDate}
              onChange={handleChange}
            />
          </label>
        </div>
      </section>

      <section className="employee-form-section" aria-labelledby="employee-address-heading">
        <h2 id="employee-address-heading">Endereço</h2>
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

      <section className="employee-form-section" aria-labelledby="employee-work-heading">
        <h2 id="employee-work-heading">Dados profissionais</h2>
        <div className="form-grid">
          <label>
            Matrícula
            <input
              name="employeeNumber"
              value={form.employeeNumber}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </label>

          <label>
            Cargo
            <input
              name="position"
              value={form.position}
              onChange={handleChange}
              maxLength={150}
              required
            />
          </label>

          <label>
            Departamento
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              maxLength={150}
              required
            />
          </label>

          <label>
            Data de admissão
            <input
              type="date"
              name="admissionDate"
              value={form.admissionDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Data de desligamento
            <input
              type="date"
              name="terminationDate"
              value={form.terminationDate}
              onChange={handleChange}
            />
          </label>
        </div>
      </section>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Cadastrando...' : 'Cadastrar funcionário'}
      </button>
    </form>
  );
}
