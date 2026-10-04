import './Sidebar.scss';

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">B</span>
        <div>
          <p className="eyebrow">Builder UI</p>
          <strong>Builder OS</strong>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button type="button" className="nav-item active">Dashboard</button>
        <button type="button" className="nav-item">Empresas</button>
        <button type="button" className="nav-item">Projetos</button>
        <button type="button" className="nav-item">Máquinas</button>
        <button type="button" className="nav-item">Relatórios</button>
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        Sair
      </button>
    </aside>
  );
}
