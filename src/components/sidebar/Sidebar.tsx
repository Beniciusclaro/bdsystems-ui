import './Sidebar.scss';
import { BrandLogo } from '../brand/BrandLogo';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Navegação do sistema">
      <div className="sidebar-brand">
        <BrandLogo compact />
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          Visão geral
        </NavLink>
        <NavLink
          to="/employees/new"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          Funcionários
        </NavLink>
        <button type="button" className="nav-item" disabled>Empresas</button>
        <button type="button" className="nav-item" disabled>Projetos</button>
        <button type="button" className="nav-item" disabled>Máquinas</button>
        <button type="button" className="nav-item" disabled>Relatórios</button>
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        Sair
      </button>
    </aside>
  );
}
