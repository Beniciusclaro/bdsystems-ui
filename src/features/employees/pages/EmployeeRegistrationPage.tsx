import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { EmployeeForm } from '../components/EmployeeForm';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <RegistrationDialog
      open
      kind="employee"
      eyebrow="Equipe"
      title={isEditing ? 'Editar funcionário' : 'Cadastrar funcionário'}
      onOpenChange={(open) => { if (!open) closeModal(); }}
    >
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
    </RegistrationDialog>
  );
}
