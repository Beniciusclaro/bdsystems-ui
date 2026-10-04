import { useMemo, useState } from 'react';
import type { LoginRequest } from '../../types/auth';
import './LoginForm.scss';

interface LoginProps {
  isSubmitting: boolean;
  onSubmit: (payload: LoginRequest) => Promise<void> | void;
}

const initialState = {
  email: '',
  password: '',
};

export function LoginForm({ isSubmitting, onSubmit }: LoginProps) {
  const [form, setForm] = useState(initialState);   

    const payload = useMemo<LoginRequest>(
    () => ({
      email: form.email,
      password: form.password,
    }),
    [form],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(payload);
    };

    return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
