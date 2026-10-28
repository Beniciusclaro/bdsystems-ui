import { useState } from 'react';
import type { PasswordResetRequest } from '../types/auth';

interface ForgotPasswordFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: PasswordResetRequest) => Promise<void> | void;
}

export function ForgotPasswordForm({ isSubmitting, onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ email });
  };

  return (
    <form className="password-reset-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
            required
          />
        </label>
      </div>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
      </button>
    </form>
  );
}
