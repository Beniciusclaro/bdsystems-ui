import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { clearAuthToken, getAuthToken } from '../shared/auth/session';
import { AppTopbar } from './components/AppTopbar';
import { Sidebar } from './components/Sidebar';
import './ProtectedLayout.scss';

const SIDEBAR_KEY = 'builder-ui:sidebar-collapsed';

export function ProtectedLayout() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDrawerOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />

      {isDrawerOpen ? (
        <button
          type="button"
          className="app-shell__backdrop"
          aria-label="Fechar menu"
          onClick={() => setIsDrawerOpen(false)}
        />
      ) : null}

      <div className="app-shell__main">
        <AppTopbar
          isDrawerOpen={isDrawerOpen}
          onMenuClick={() => setIsDrawerOpen((open) => !open)}
          onLogout={handleLogout}
        />
        <Outlet />
      </div>
    </div>
  );
}
