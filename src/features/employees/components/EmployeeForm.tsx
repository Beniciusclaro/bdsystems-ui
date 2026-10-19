import { useRef, useState } from 'react';
import type {
  EmployeeRequest,
  EmployeeResponse,
  EmployeePaymentMethod,
  EmployeeStatus,
} from '../types/employee';

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
  paymentMethod: EmployeePaymentMethod | '';
  paymentAmount: string;
  terminationDate: string;
  status: EmployeeStatus | '';
}

type EmployeeFormTab = 'personal' | 'professional';

const professionalFieldNames = new Set([
  'employeeNumber',
  'position',
  'department',
  'admissionDate',
  'paymentMethod',
  'paymentAmount',
  'terminationDate',
  'status',
]);

function isEmployeePaymentMethod(value: string): value is EmployeePaymentMethod {
  return (
    value === 'MONTHLY' ||
    value === 'WEEKLY' ||
    value === 'DAILY' ||
    value === 'HOURLY'
  );
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
  paymentMethod: '',
  paymentAmount: '',
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
    paymentMethod: employee.paymentMethod ?? '',
    paymentAmount:
      employee.paymentAmount === null || employee.paymentAmount === undefined
        ? ''
        : String(employee.paymentAmount),
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
  const [activeTab, setActiveTab] = useState<EmployeeFormTab>('personal');
  const personalTabRef = useRef<HTMLButtonElement>(null);
  const professionalTabRef = useRef<HTMLButtonElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalidField = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input, select',
      ),
    ).find((field) => !field.validity.valid);

    if (invalidField) {
      const invalidTab = professionalFieldNames.has(invalidField.name)
        ? 'professional'
        : 'personal';
      setActiveTab(invalidTab);
      window.requestAnimationFrame(() => {
        invalidField.focus();
        invalidField.reportValidity();
      });
      return;
    }

    if (!form.status || !isEmployeePaymentMethod(form.paymentMethod)) {
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
      paymentMethod: form.paymentMethod,
      paymentAmount: Number(form.paymentAmount),
      ...(form.terminationDate ? { terminationDate: form.terminationDate } : {}),
      status: form.status,
    };

    await onSubmit(payload);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextTab: EmployeeFormTab | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      nextTab = activeTab === 'personal' ? 'professional' : 'personal';
    } else if (event.key === 'Home') {
      nextTab = 'personal';
    } else if (event.key === 'End') {
      nextTab = 'professional';
    }

    if (!nextTab) {
      return;
    }

    event.preventDefault();
    setActiveTab(nextTab);
    (nextTab === 'personal' ? personalTabRef : professionalTabRef).current?.focus();
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit} noValidate>
      <div className="employee-form-tabs" role="tablist" aria-label="Seções do cadastro">
        <button
          ref={personalTabRef}
          id="employee-personal-tab"
          className="employee-form-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'personal'}
          aria-controls="employee-personal-panel"
          tabIndex={activeTab === 'personal' ? 0 : -1}
          onClick={() => setActiveTab('personal')}
          onKeyDown={handleTabKeyDown}
        >
          Dados pessoais
        </button>
        <button
          ref={professionalTabRef}
          id="employee-professional-tab"
          className="employee-form-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'professional'}
          aria-controls="employee-professional-panel"
          tabIndex={activeTab === 'professional' ? 0 : -1}
          onClick={() => setActiveTab('professional')}
          onKeyDown={handleTabKeyDown}
        >
          Dados profissionais
        </button>
      </div>

      <div
        id="employee-personal-panel"
        className="employee-form-panel"
        role="tabpanel"
        aria-labelledby="employee-personal-tab"
        hidden={activeTab !== 'personal'}
        tabIndex={0}
      >
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
      </div>

      <div
        id="employee-professional-panel"
        className="employee-form-panel"
        role="tabpanel"
        aria-labelledby="employee-professional-tab"
        hidden={activeTab !== 'professional'}
        tabIndex={0}
      >
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
              Forma de pagamento
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="">Selecione a forma de pagamento</option>
                <option value="MONTHLY">Mensal</option>
                <option value="WEEKLY">Semanal</option>
                <option value="DAILY">Diário</option>
                <option value="HOURLY">Hora</option>
              </select>
            </label>

            <label>
              Valor (R$)
              <input
                type="number"
                name="paymentAmount"
                value={form.paymentAmount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
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
                <option value="LEASED">Locado</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
