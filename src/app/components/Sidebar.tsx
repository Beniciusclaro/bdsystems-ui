import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '../../shared/components/brand/BrandLogo';
import { navigationItems } from '../navigation';
import './Sidebar.scss';

interface SidebarProps {
  collapsed: boolean;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  collapsed,
  isDrawerOpen,
  onCloseDrawer,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${isDrawerOpen ? ' sidebar--open' : ''}`}
      aria-label="Navegação do sistema"
    >
      <div className="sidebar-brand">
        <BrandLogo compact={collapsed} />
        <button
          type="button"
          className="sidebar-close"
          aria-label="Fechar menu"
          onClick={onCloseDrawer}
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {navigationItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onCloseDrawer}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-collapse"
        aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        onClick={onToggleCollapsed}
      >
        {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        <span>Recolher menu</span>
      </button>
    </aside>
  );
}
