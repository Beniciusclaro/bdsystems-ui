import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedLayout } from './ProtectedLayout';
import { ThemeProvider } from '../shared/theme/ThemeProvider';

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
  it('redirects visitors without a session', () => {
    renderRoutes();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });

  it('renders the shared navigation for an authenticated visitor', () => {
    sessionStorage.setItem('builder-ui:token', 'test-token');
    renderRoutes();
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação estrutural' })).toHaveTextContent(
      'Visão geral',
    );
  });

  it('persists the compact sidebar and exposes the account menu', async () => {
    sessionStorage.setItem('builder-ui:token', 'test-token');
    renderRoutes();

    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));

    expect(localStorage.getItem('builder-ui:sidebar-collapsed')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: /Minha conta/ }));

    expect(screen.getByRole('menu', { name: 'Menu da conta' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Perfil/ })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: /Configurações/ })).toBeDisabled();
  });
});
