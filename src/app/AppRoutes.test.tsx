import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './AppRoutes';

describe('public authentication routes', () => {
  it.each([
    ['/forgot-password', 'Esqueceu a senha?'],
    ['/reset-password', 'Crie uma nova senha'],
  ])('renders %s as a public route', (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
