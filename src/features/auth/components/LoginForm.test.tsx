import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('starts with remember me disabled and includes its value in the payload', async () => {
    const onSubmit = vi.fn();

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginForm isSubmitting={false} onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    const rememberMe = screen.getByRole('checkbox', { name: /Manter conectado/ });
    expect(rememberMe).not.toBeChecked();

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(rememberMe);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'segredo123',
      rememberMe: true,
    });
    expect(screen.queryByText(/12 horas/)).not.toBeInTheDocument();
  });
});
