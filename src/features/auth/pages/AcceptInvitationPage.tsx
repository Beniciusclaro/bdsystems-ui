import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../../shared/components/brand/BrandLogo';
import { AcceptInvitationForm } from '../components/AcceptInvitationForm';
import { acceptInvitation } from '../services/authService';
import type { AcceptInvitationRequest } from '../types/auth';
import './AuthPage.scss';

export function AcceptInvitationPage() {
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

  const handleAcceptInvitation = async (payload: AcceptInvitationRequest) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await acceptInvitation(payload);
      setIsComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível aceitar o convite.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell login-page invitation-page">
      <section className="auth-showcase" aria-label="Apresentação da plataforma">
        <BrandLogo />
        <div className="auth-showcase__content">
          <p className="auth-showcase__eyebrow">O seu acesso começa aqui</p>
          <h1>Junte-se à equipa com segurança.</h1>
          <p>Defina a sua senha para concluir o convite e aceder à plataforma.</p>
          <ul>
            <li>
              <ShieldCheck aria-hidden="true" /> Convite pessoal e de uso único
            </li>
            <li>
              <KeyRound aria-hidden="true" /> A senha é definida apenas por si
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-form-side">
        <section className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Convite de acesso</p>
            <h1>{isComplete ? 'Acesso ativado' : 'Defina a sua senha'}</h1>
            <p>
              {isComplete
                ? 'A sua senha foi definida. Já pode entrar no sistema.'
                : 'Escolha uma senha segura para concluir a criação da sua conta.'}
            </p>
          </div>

          {!token ? (
            <div className="message error" role="alert">
              O link do convite está incompleto. Solicite um novo convite ao administrador.
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
            <AcceptInvitationForm
              token={token}
              isSubmitting={isSubmitting}
              onSubmit={handleAcceptInvitation}
            />
          ) : (
            <Link to="/login" className="primary-button invitation-login-link">
              Voltar ao login
            </Link>
          )}
        </section>
      </section>
    </main>
  );
}
