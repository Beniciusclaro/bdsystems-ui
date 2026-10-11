import { useState } from 'react';
import type {
  EmployeeRequest,
  EmployeeResponse,
  EmployeeStatus,
} from '../../types/employee';

interface EmployeeFormProps {
  isSubmitting: boolean;
  initialValues?: EmployeeResponse;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: (payload: EmployeeRequest) => Promise<void> | void;
}

interface EmployeeFormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  documentNumber: string;
  birthDate: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  employeeNumber: string;
  position: string;
  department: string;
  admissionDate: string;
  terminationDate: string;
  status: EmployeeStatus | '';
}

const initialForm: EmployeeFormState = {
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
  status: 'ACTIVE',
};

function toFormState(employee?: EmployeeResponse): EmployeeFormState {
  if (!employee) {
    return initialForm;
  }

  return {
    fullName: employee.fullName,
    email: employee.email,
    phoneNumber: employee.phoneNumber ?? '',
    documentNumber: employee.documentNumber ?? '',
    birthDate: employee.birthDate ?? '',
    street: employee.address.street,
    city: employee.address.city,
    state: employee.address.state,
    zipCode: employee.address.zipCode,
    employeeNumber: employee.employeeNumber,
    position: employee.position,
    department: employee.department,
    admissionDate: employee.admissionDate,
    terminationDate: employee.terminationDate ?? '',
    status: employee.status ?? '',
  };
}

export function EmployeeForm({
  isSubmitting,
  initialValues,
  submitLabel = 'Cadastrar funcionário',
  submittingLabel = 'Cadastrando...',
  onSubmit,
}: EmployeeFormProps) {
  const [form, setForm] = useState(() => toFormState(initialValues));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.status) {
      return;
    }

    const payload: EmployeeRequest = {
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
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
      status: form.status,
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
              required
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

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange} required>
                  <option value="">Selecione o status</option>
                  <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="TERMINATED">Desligado</option>
            </select>
          </label>
        </div>
      </section>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
