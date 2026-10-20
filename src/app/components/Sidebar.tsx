import './Sidebar.scss';
import { BrandLogo } from '../../shared/components/brand/BrandLogo';
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
          to="/employees"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          Funcionários
        </NavLink>
        <NavLink
          to="/suppliers"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          Fornecedores
        </NavLink>
        <NavLink to="/tools" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          Ferramentas
        </NavLink>
        <NavLink
          to="/materials"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          Materiais
        </NavLink>
        <button type="button" className="nav-item" disabled>
          Empresas
        </button>
        <button type="button" className="nav-item" disabled>
          Projetos
        </button>
        <button type="button" className="nav-item" disabled>
          Máquinas
        </button>
        <button type="button" className="nav-item" disabled>
          Relatórios
        </button>
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        Sair
      </button>
    </aside>
  );
}
