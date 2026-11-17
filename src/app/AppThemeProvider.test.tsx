import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from '../shared/theme/themeContext';
import { AppThemeProvider } from './AppThemeProvider';

function ThemeProbe() {
  const { resolvedTheme } = useTheme();

  return <span>{resolvedTheme}</span>;
}

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>
    </MemoryRouter>,
  );
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    localStorage.setItem('builder-ui:theme', 'dark');
  });

  it.each([
    '/',
    '/login',
    '/register',
    '/accept-invitation',
    '/forgot-password',
    '/reset-password',
  ])('forces the light theme on the public route %s', (pathname) => {
    renderAt(pathname);

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).toHaveStyle({ colorScheme: 'light' });
    expect(localStorage.getItem('builder-ui:theme')).toBe('dark');
  });

  it('uses the saved theme on authenticated routes', () => {
    renderAt('/dashboard');

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
