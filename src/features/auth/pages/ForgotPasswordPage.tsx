import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../../shared/components/brand/BrandLogo';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { requestPasswordReset } from '../services/authService';
import type { PasswordResetRequest } from '../types/auth';
import './AuthPage.scss';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isComplete, setIsComplete] = useState(false);

  const handleRequest = async (payload: PasswordResetRequest) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(payload);
      setIsComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível enviar as instruções de recuperação.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell login-page password-recovery-page">
      <section className="auth-showcase" aria-label="Recuperação segura de acesso">
        <BrandLogo />
        <div className="auth-showcase__content">
          <p className="auth-showcase__eyebrow">Recupere o seu acesso</p>
          <h1>Volte à sua operação com segurança.</h1>
          <p>Enviaremos instruções para redefinir a senha, caso exista uma conta ativa.</p>
          <ul>
            <li>
              <MailCheck aria-hidden="true" /> Instruções enviadas diretamente ao seu email
            </li>
            <li>
              <ShieldCheck aria-hidden="true" /> Resposta segura que protege os seus dados
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-form-side">
        <section className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Recuperação de senha</p>
            <h1>{isComplete ? 'Verifique o seu email' : 'Esqueceu a senha?'}</h1>
            <p>
              {isComplete
                ? 'Se existir uma conta ativa para este email, enviaremos um link de recuperação.'
                : 'Informe o email da sua conta para receber as instruções.'}
            </p>
          </div>

          {error ? (
            <div className="message error" role="alert">
              {error}
            </div>
          ) : null}

          {isComplete ? (
            <div className="invitation-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              <p>O link é válido por uma hora. Verifique também a pasta de spam.</p>
              <Link to="/login" className="primary-button">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <ForgotPasswordForm isSubmitting={isSubmitting} onSubmit={handleRequest} />
          )}

          {!isComplete ? (
            <p className="auth-switch">
              Lembrou a senha? <Link to="/login">Voltar ao login</Link>
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
