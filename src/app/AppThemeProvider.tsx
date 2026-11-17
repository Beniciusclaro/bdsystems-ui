import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeProvider';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/accept-invitation',
  '/forgot-password',
  '/reset-password',
]);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const isPublicPage = PUBLIC_PATHS.has(pathname);

  return <ThemeProvider forcedTheme={isPublicPage ? 'light' : undefined}>{children}</ThemeProvider>;
}
