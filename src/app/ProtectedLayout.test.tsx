import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedLayout } from './ProtectedLayout';

function renderRoutes() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<h1>Login</h1>} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<h1>Painel</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
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
  });
});
