import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmployeeForm } from '../components/employee/EmployeeForm';
import { Sidebar } from '../components/sidebar/Sidebar';
import { clearAuthToken, getAuthToken } from '../lib/session';
import { createEmployee } from '../services/employeeService';
import type { EmployeeRequest } from '../types/employee';
import './EmployeeRegistrationPage.scss';

export function EmployeeRegistrationPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const handleCreateEmployee = async (payload: EmployeeRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createEmployee(payload);
      setSuccess('Funcionário cadastrado com sucesso.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
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
    <main className="dashboard-page employee-registration-page">
      <Sidebar onLogout={handleLogout} />
      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="dashboard-eyebrow">Equipe</p>
            <h1>Cadastrar funcionário</h1>
          </div>
          <Link className="secondary-button" to="/dashboard">
            Voltar ao painel
          </Link>
        </header>

        <section className="panel-card employee-form-card">
          <p className="employee-form-intro">
            Informe os dados pessoais, endereço e informações profissionais do
            funcionário.
          </p>

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

          <EmployeeForm
            isSubmitting={isSubmitting}
            onSubmit={handleCreateEmployee}
          />
        </section>
      </section>
    </main>
  );
}
