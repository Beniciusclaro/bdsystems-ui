import { useMemo, useState } from 'react';
import type { UserRequest } from '../../types/auth';
import './RegisterForm.scss';

interface RegisterFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: UserRequest) => Promise<void> | void;
}

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'ADMIN',
  companyName: '',
  street: '',
  city: '',
  state: '',
  zipcode: '',
};

export function RegisterForm({ isSubmitting, onSubmit }: RegisterFormProps) {
  const [form, setForm] = useState(initialState);

  const payload = useMemo<UserRequest>(
    () => ({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      companyName: form.companyName,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        zipcode: form.zipcode,
      },
      company: {
        name: form.companyName,
      },
    }),
    [form],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(payload);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Nome completo
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ex: Benicius Alves"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="usuario@empresa.com"
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </label>

        <label>
          Papel
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
          </select>
        </label>

        <label className="full-width">
          Nome da empresa
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="BD Systems"
            required
          />
        </label>

        <label className="full-width">
          Rua
          <input
            name="street"
            value={form.street}
            onChange={handleChange}
            placeholder="Rua Exemplo, 123"
            required
          />
        </label>

        <label>
          Cidade
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Porto"
            required
          />
        </label>

        <label>
          Estado
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="Porto"
            required
          />
        </label>

        <label>
          CEP
          <input
            name="zipcode"
            value={form.zipcode}
            onChange={handleChange}
            placeholder="4000-123"
            required
          />
        </label>
      </div>

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
      </button>
    </form>
  );
}
