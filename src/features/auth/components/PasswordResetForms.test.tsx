import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('password reset forms', () => {
  it('submits the email request and exposes its loading state', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    const { rerender } = render(<ForgotPasswordForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@example.com' });

    rerender(<ForgotPasswordForm isSubmitting onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled();
  });

  it('validates minimum length and confirmation before submitting a new password', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    render(<ResetPasswordForm token="reset-token" isSubmitting={false} onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('minLength', '8');

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha1');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outraSenha1');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Confirmar nova senha'));
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha1');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(onSubmit).toHaveBeenCalledWith({ token: 'reset-token', password: 'novaSenha1' });
  });

  it('uses the same eight-character minimum in public registration', () => {
    render(<RegisterForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('minLength', '8');
    expect(screen.getByLabelText('Confirmar Senha')).toHaveAttribute('minLength', '8');
  });
});
