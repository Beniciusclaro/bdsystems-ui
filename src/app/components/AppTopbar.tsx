import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Home, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../shared/theme/themeContext';
import { getNavigationItem } from '../navigation';
import './AppTopbar.scss';

interface AppTopbarProps {
  isDrawerOpen: boolean;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function AppTopbar({ isDrawerOpen, onMenuClick, onLogout }: AppTopbarProps) {
  const { pathname } = useLocation();

  const { resolvedTheme, toggleTheme } = useTheme();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const currentPage = getNavigationItem(pathname);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="app-topbar">
      <div className="app-topbar__location">
        <button
          type="button"
          className="app-topbar__menu"
          aria-label={isDrawerOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isDrawerOpen}
          onClick={onMenuClick}
        >
          {isDrawerOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav aria-label="Navegação estrutural" className="app-breadcrumb">
          <Link to="/dashboard" aria-label="Ir para o dashboard">
            <Home aria-hidden="true" />
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{currentPage.label}</span>
        </nav>
      </div>

      <div className="app-topbar__actions">
        <button
          type="button"
          className="icon-button"
          aria-label={resolvedTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          onClick={toggleTheme}
        >
          {resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>

        <div className="profile-menu" ref={profileRef}>
          <button
            ref={profileButtonRef}
            type="button"
            className="profile-menu__trigger"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((open) => !open)}
          >
            <span className="profile-menu__avatar">
              <UserRound aria-hidden="true" />
            </span>
            <span className="profile-menu__copy">
              <strong>Minha conta</strong>
              <small>Administrador</small>
            </span>
            <ChevronDown aria-hidden="true" />
          </button>

          {isProfileOpen ? (
            <div className="profile-menu__popover" role="menu" aria-label="Menu da conta">
              <button type="button" role="menuitem" disabled>
                Perfil <span>Em breve</span>
              </button>
              <button type="button" role="menuitem" disabled>
                Configurações <span>Em breve</span>
              </button>
              <button type="button" role="menuitem" onClick={onLogout}>
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
