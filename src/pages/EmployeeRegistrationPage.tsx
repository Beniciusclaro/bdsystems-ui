import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { EmployeeForm } from '../components/employee/EmployeeForm';
import { getAuthToken } from '../lib/session';
import { createEmployee, updateEmployee } from '../services/employeeService';
import type { EmployeeRequest, EmployeeResponse } from '../types/employee';
import './EmployeeRegistrationPage.scss';

interface EmployeeListOutletContext {
  refreshEmployees: () => void;
  employees: EmployeeResponse[];
  isLoading: boolean;
}

export function EmployeeRegistrationPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { refreshEmployees, employees, isLoading: isLoadingEmployees } =
    useOutletContext<EmployeeListOutletContext>();
  const employee = employeeId
    ? employees.find((item) => item.id === employeeId)
    : undefined;
  const isEditing = Boolean(employeeId);
  const token = getAuthToken();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [navigate, token]);

  const closeModal = () => {
    navigate('/employees', { replace: true });
  };

  const handleSubmit = async (payload: EmployeeRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (employeeId) {
        await updateEmployee(employeeId, payload);
        setSuccess('Funcionário atualizado com sucesso.');
      } else {
        await createEmployee(payload);
        setSuccess('Funcionário cadastrado com sucesso.');
      }
      refreshEmployees();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isEditing
            ? 'Não foi possível atualizar o funcionário.'
            : 'Não foi possível cadastrar o funcionário.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="employee-registration-dialog"
      aria-labelledby="employee-registration-heading"
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
      onClose={closeModal}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="employee-registration-content">
        <header className="employee-registration-header">
          <div>
            <p className="eyebrow">Equipe</p>
            <h1 id="employee-registration-heading">
              {isEditing ? 'Editar funcionário' : 'Cadastrar funcionário'}
            </h1>
          </div>
          <button
            type="button"
            className="employee-dialog-close"
            aria-label="Fechar cadastro"
            onClick={closeModal}
          >
            ×
          </button>
        </header>

        <section className="panel-card employee-form-card">
          <p className="employee-form-intro">
            {isEditing
              ? 'Atualize os dados pessoais, endereço e informações profissionais do funcionário.'
              : 'Informe os dados pessoais, endereço e informações profissionais do funcionário.'}
          </p>

          {isEditing && !employee && isLoadingEmployees ? (
            <p className="employee-list-state" role="status">
              Carregando dados do funcionário...
            </p>
          ) : null}

          {isEditing && !employee && !isLoadingEmployees ? (
            <div className="message error" role="alert">
              Não foi possível encontrar este funcionário na página atual da lista.
            </div>
          ) : null}

          {error ? (
            <div className="message error" role="alert">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="message success" role="status">
              {success}
            </div>
          ) : null}

          {(!isEditing || employee) ? (
            <EmployeeForm
              key={employeeId ?? 'new'}
              initialValues={employee}
              isSubmitting={isSubmitting}
              submitLabel={isEditing ? 'Atualizar funcionário' : 'Cadastrar funcionário'}
              submittingLabel={isEditing ? 'Atualizando...' : 'Cadastrando...'}
              onSubmit={handleSubmit}
            />
          ) : null}
        </section>
      </div>
    </dialog>
  );
}
