import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.scss';
import App from './app/AppRoutes.tsx';
import { AppThemeProvider } from './app/AppThemeProvider.tsx';
import { AuthProvider } from './shared/auth/AuthProvider.tsx';
import { ToastProvider } from './shared/feedback/ToastProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
