import { useState } from 'react';
import type { PasswordResetConfirmRequest } from '../types/auth';

interface ResetPasswordFormProps {
  token: string;
  isSubmitting: boolean;
  onSubmit: (payload: PasswordResetConfirmRequest) => Promise<void> | void;
}

export function ResetPasswordForm({ token, isSubmitting, onSubmit }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');

  const [confirmation, setConfirmation] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (password.length < 8) {
      setValidationError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmation) {
      setValidationError('As senhas não coincidem.');
      return;
    }

    await onSubmit({ token, password });
  };

  return (
    <form className="password-reset-form" onSubmit={handleSubmit}>
      {validationError ? (
        <div className="message error" role="alert">
          {validationError}
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          Nova senha
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            autoFocus
            required
          />
        </label>

        <label>
          Confirmar nova senha
          <input
            type="password"
            name="passwordConfirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={8}
            required
          />
        </label>
      </div>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
