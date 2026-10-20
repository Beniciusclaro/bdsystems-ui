import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../../shared/components/brand/BrandLogo';
import { LoginForm } from '../components/LoginForm';
import { saveAuthToken } from '../../../shared/auth/session';
import { loginUser } from '../services/authService';
import type { LoginRequest } from '../types/auth';
import { BarChart3, CheckCircle2, HardHat } from 'lucide-react';
import './AuthPage.scss';

interface LoginPageProps {
  onBack?: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
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

  const handleLogin = async (payload: LoginRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const response = await loginUser(payload);
      if (response?.token) {
        saveAuthToken(response.token);
        navigate('/dashboard');
        return;
      }

      setSuccess('Login realizado com sucesso.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Não foi possível concluir o login.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell login-page">
      <section className="auth-showcase" aria-label="Apresentação da plataforma">
        <BrandLogo />
        <div className="auth-showcase__content">
          <p className="auth-showcase__eyebrow">Gestão de obras em um só lugar</p>
          <h1>Decisões mais claras para cada etapa da construção.</h1>
          <p>Planeie equipas, materiais e orçamentos com uma visão integrada da sua operação.</p>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" /> Indicadores operacionais em tempo real
            </li>
            <li>
              <HardHat aria-hidden="true" /> Obras, recursos e equipas organizados
            </li>
            <li>
              <BarChart3 aria-hidden="true" /> Custos e orçamentos sob controlo
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-form-side">
        <section className="auth-card">
          <div className="auth-header">
            <div className="auth-header-row">
              <p className="eyebrow">Acesso ao sistema</p>
              <button type="button" className="text-button" onClick={handleBack}>
                ← Voltar
              </button>
            </div>
            <h1>Bem-vindo de volta</h1>
            <p>Entre com as suas credenciais para continuar.</p>
          </div>

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

          <LoginForm isSubmitting={isSubmitting} onSubmit={handleLogin} />
          <p className="auth-switch">
            Ainda não tem uma conta? <Link to="/register">Criar conta</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
