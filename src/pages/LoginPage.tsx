import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { saveAuthToken } from '../lib/session';
import { loginUser } from '../services/authService';
import type { LoginRequest } from '../types/auth';
import './LoginPage.scss';

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
                requestError instanceof Error
                ? requestError.message
                : 'Não foi possível concluir o login.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page-shell">
          <section className="auth-card">
            <div className="auth-header">
              <div className="auth-header-row">
                <p className="eyebrow">Builder UI</p>
                <button type="button" className="text-button" onClick={handleBack}>
                  ← Voltar
                </button>
              </div>
              <h1>Login</h1>
            </div>
    
            {error ? <div className="message error">{error}</div> : null}
            {success ? <div className="message success">{success}</div> : null}
    
            <LoginForm isSubmitting={isSubmitting} onSubmit={handleLogin} />
          </section>
        </main>
      );
}