import { Link } from 'react-router-dom'
import './LandingPage.scss'

export function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="brand-block">
          <span className="brand-mark">B</span>
          <div>
            <p className="eyebrow">Builder UI</p>
            <h1>Controle de obra em uma plataforma</h1>
          </div>
        </div>

        <nav className="landing-toolbar" aria-label="Acesso rápido">
          <Link to="/login" className="landing-action">
            <span className="landing-icon" aria-hidden="true">🔐</span>
            <span>Login</span>
          </Link>

          <Link to="/register" className="landing-action">
            <span className="landing-icon" aria-hidden="true">🧱</span>
            <span>Register</span>
          </Link>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="section-tag">Gestão moderna da construção</p>
          <h2>Centralize empresas, equipes, materiais e cronogramas da obra.</h2>
          <p className="hero-description">
            Acompanhe cada etapa com um sistema pensado para builder companies, gestão de
            projetos e execução de obra em tempo real.
          </p>

          <div className="cta-row">
            <Link to="/register" className="primary-button">
              Criar conta
            </Link>
            <Link to="/login" className="secondary-button">
              Entrar
            </Link>
          </div>
        </div>

        <div className="hero-card" aria-label="Resumo do sistema">
          <div className="mini-stat">
            <span>Projetos ativos</span>
            <strong>128</strong>
          </div>
          <div className="mini-stat">
            <span>Equipes em obra</span>
            <strong>24</strong>
          </div>
          <div className="mini-stat">
            <span>Indicadores</span>
            <strong>+18%</strong>
          </div>
        </div>
      </section>
    </main>
  )
}
