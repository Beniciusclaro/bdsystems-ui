import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { clearAuthToken, getAuthToken } from '../shared/auth/session';
import './ProtectedLayout.scss';

export function ProtectedLayout() {
  const navigate = useNavigate();

  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  return (
    <main className="dashboard-page">
      <Sidebar onLogout={handleLogout} />
      <Outlet />
    </main>
  );
}
