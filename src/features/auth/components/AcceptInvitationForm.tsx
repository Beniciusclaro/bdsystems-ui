import { useState } from 'react';
import type { AcceptInvitationRequest } from '../types/auth';

interface AcceptInvitationFormProps {
  token: string;
  isSubmitting: boolean;
  onSubmit: (payload: AcceptInvitationRequest) => Promise<void> | void;
}

export function AcceptInvitationForm({ token, isSubmitting, onSubmit }: AcceptInvitationFormProps) {
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
    <form className="accept-invitation-form" onSubmit={handleSubmit}>
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
            required
          />
        </label>

        <label>
          Confirmar senha
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
        {isSubmitting ? 'Definindo senha...' : 'Definir senha'}
      </button>
    </form>
  );
}
