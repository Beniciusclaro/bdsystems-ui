import './Sidebar.scss';
import { BrandLogo } from '../brand/BrandLogo';

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
        <span className="nav-item active" aria-current="page">Visão geral</span>
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
