import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { RegisterForm } from '../components/register/RegisterForm';
import { saveAuthToken } from '../lib/session';
import { registerUser } from '../services/authService';
import type { UserRequest } from '../types/auth';
import './RegisterPage.scss';

interface RegisterPageProps {
  onBack?: () => void;
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate('/');
  };

  const handleRegister = async (payload: UserRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await registerUser(payload);

      if (response?.token) {
        saveAuthToken(response.token);
        navigate('/dashboard');
        return;
      }

      setSuccess('Cadastro realizado com sucesso.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível concluir o cadastro.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <main className="page-shell register-page">
      <section className="auth-card">
        <div className="auth-header">
            <BrandLogo />
          <div className="auth-header-row">
              <p className="eyebrow">Cadastro da empresa</p>
            <button type="button" className="text-button" onClick={handleBack}>
              ← Voltar
            </button>
          </div>
          <h1>Criar conta</h1>
          <p>Cadastre sua empresa e comece a gerenciar obras e equipes.</p>
        </div>

        {error ? <div className="message error" role="alert">{error}</div> : null}
        {success ? <div className="message success" role="status">{success}</div> : null}

        <RegisterForm isSubmitting={isSubmitting} onSubmit={handleRegister} />
      </section>
    </main>
  );
}
