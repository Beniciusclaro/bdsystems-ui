import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LoginRequest } from '../types/auth';
import './LoginForm.scss';

interface LoginProps {
  isSubmitting: boolean;
  onSubmit: (payload: LoginRequest) => Promise<void> | void;
}

const initialState = {
  email: '',
  password: '',
  rememberMe: false,
};

export function LoginForm({ isSubmitting, onSubmit }: LoginProps) {
  const [form, setForm] = useState(initialState);

  const payload = useMemo<LoginRequest>(
    () => ({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe,
    }),
    [form],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;

    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;

    setForm((current) => ({ ...current, [name]: nextValue }));
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
          Senha
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <div className="login-form__options">
          <label className="remember-session">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
            />
            <span>Manter conectado</span>
          </label>

          <Link className="forgot-password-link" to="/forgot-password">
            Esqueceu a senha?
          </Link>
        </div>
      </div>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
