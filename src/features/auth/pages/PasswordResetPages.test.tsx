import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { confirmPasswordReset, requestPasswordReset } from '../services/authService';

vi.mock('../services/authService', () => ({
  loginUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

const requestPasswordResetMock = vi.mocked(requestPasswordReset);

const confirmPasswordResetMock = vi.mocked(confirmPasswordReset);

beforeEach(() => vi.resetAllMocks());

function renderRoute(route: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('password reset pages', () => {
  it('links the login to the public recovery route', () => {
    renderRoute('/login', <LoginPage />);

    expect(screen.getByRole('link', { name: 'Esqueceu a senha?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('shows the same neutral confirmation after a reset request', async () => {
    requestPasswordResetMock.mockResolvedValue();

    const user = userEvent.setup();

    renderRoute('/forgot-password', <ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'inexistente@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    expect(requestPasswordResetMock).toHaveBeenCalledWith({ email: 'inexistente@example.com' });
    expect(
      await screen.findByText('Se existir uma conta ativa para este email', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('O link é válido por uma hora');
  });

  it('does not render the reset form without a token', () => {
    renderRoute('/reset-password', <ResetPasswordPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('link de recuperação está incompleto');
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('shows invalid or expired token errors returned by the service', async () => {
    confirmPasswordResetMock.mockRejectedValue(
      new Error('Este link expirou. Solicite uma nova recuperação de senha.'),
    );

    const user = userEvent.setup();

    renderRoute('/reset-password?token=expired-token', <ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha1');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha1');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este link expirou');
    expect(confirmPasswordResetMock).toHaveBeenCalledWith({
      token: 'expired-token',
      password: 'novaSenha1',
    });
  });

  it('shows success and provides an immediate login action', async () => {
    confirmPasswordResetMock.mockResolvedValue();

    const user = userEvent.setup();

    renderRoute('/reset-password?token=valid-token', <ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha1');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha1');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
  });
});
