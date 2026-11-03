import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedLayout } from './ProtectedLayout';
import { ThemeProvider } from '../shared/theme/ThemeProvider';

const auth = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  sessionEndReason: null as 'expired' | null,
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../shared/auth/useAuth', () => ({
  useAuth: () => ({ ...auth, startSession: vi.fn() }),
}));

beforeEach(() => {
  auth.status = 'unauthenticated';
  auth.sessionEndReason = null;
  auth.logout.mockReset().mockResolvedValue(undefined);
});

function renderRoutes() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<h1>Login</h1>} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<h1>Painel</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('ProtectedLayout', () => {
  it('waits for bootstrap before deciding whether to redirect', () => {
    auth.status = 'loading';
    renderRoutes();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando sessão');
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
  });

  it('redirects visitors without a session', () => {
    renderRoutes();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });

  it('renders the shared navigation for an authenticated visitor', () => {
    auth.status = 'authenticated';
    renderRoutes();
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação estrutural' })).toHaveTextContent(
      'Visão geral',
    );
  });

  it('persists the compact sidebar and exposes the account menu', async () => {
    auth.status = 'authenticated';
    renderRoutes();

    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));

    expect(localStorage.getItem('builder-ui:sidebar-collapsed')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: /Minha conta/ }));

    expect(screen.getByRole('menu', { name: 'Menu da conta' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Perfil/ })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: /Configurações/ })).toBeDisabled();
  });

  it('ends the local session and navigates even when logout fails', async () => {
    auth.status = 'authenticated';
    auth.logout.mockRejectedValue(new Error('offline'));
    renderRoutes();

    await userEvent.click(screen.getByRole('button', { name: /Minha conta/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(auth.logout).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });
});
