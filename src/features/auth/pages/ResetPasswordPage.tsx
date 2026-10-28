import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../../shared/components/brand/BrandLogo';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { confirmPasswordReset } from '../services/authService';
import type { PasswordResetConfirmRequest } from '../types/auth';
import './AuthPage.scss';

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get('token')?.trim() ?? '';

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const redirect = window.setTimeout(() => navigate('/login', { replace: true }), 2500);

    return () => window.clearTimeout(redirect);
  }, [isComplete, navigate]);

  const handleReset = async (payload: PasswordResetConfirmRequest) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await confirmPasswordReset(payload);
      setIsComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível redefinir a senha.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell login-page password-recovery-page">
      <section className="auth-showcase" aria-label="Redefinição segura de senha">
        <BrandLogo />
        <div className="auth-showcase__content">
          <p className="auth-showcase__eyebrow">Nova senha</p>
          <h1>Proteja o seu acesso com uma nova senha.</h1>
          <p>Escolha uma senha com pelo menos 8 caracteres para concluir a recuperação.</p>
          <ul>
            <li>
              <KeyRound aria-hidden="true" /> Link pessoal e de uso único
            </li>
            <li>
              <ShieldCheck aria-hidden="true" /> Redefinição protegida e confidencial
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-form-side">
        <section className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Redefinição de senha</p>
            <h1>{isComplete ? 'Senha redefinida' : 'Crie uma nova senha'}</h1>
            <p>
              {isComplete
                ? 'A sua senha foi atualizada. Já pode entrar no sistema.'
                : 'Use pelo menos 8 caracteres e confirme a nova senha.'}
            </p>
          </div>

          {!token ? (
            <div className="message error" role="alert">
              O link de recuperação está incompleto. Solicite uma nova recuperação de senha.
            </div>
          ) : null}

          {error ? (
            <div className="message error" role="alert">
              {error}
            </div>
          ) : null}

          {isComplete ? (
            <div className="invitation-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              <p>Redirecionando para o login...</p>
              <Link to="/login" className="primary-button">
                Ir para o login
              </Link>
            </div>
          ) : token ? (
            <ResetPasswordForm token={token} isSubmitting={isSubmitting} onSubmit={handleReset} />
          ) : (
            <Link to="/forgot-password" className="primary-button invitation-login-link">
              Solicitar novo link
            </Link>
          )}
        </section>
      </section>
    </main>
  );
}
