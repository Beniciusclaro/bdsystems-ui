import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import './LandingPage.scss'

const highlights = ['Projetos organizados', 'Equipes conectadas', 'Informações acessíveis']

export function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-header__inner">
          <BrandLogo />
          <nav className="landing-nav" aria-label="Navegação principal">
            <Link to="/login" className="landing-nav__login">
              Entrar
            </Link>
            <Link to="/register" className="landing-nav__register">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__inner">
          <div className="hero-copy">
            <p className="section-tag">Gestão de obras, sem complicação</p>
            <h1 id="landing-title">
              Sua obra em cada etapa.
              <span>Tudo em um só lugar.</span>
            </h1>
            <p className="hero-description">
              Projetos, equipes e informações reunidos para você acompanhar sua operação com mais
              clareza.
            </p>

            <div className="cta-row">
              <Link to="/register" className="primary-button">
                Começar agora
              </Link>
              <Link to="/login" className="secondary-button">
                Já tenho uma conta
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual__grid" />
            <svg className="hero-visual__building" viewBox="0 0 520 430" fill="none">
              <path d="M70 354H466" className="building-ground" />
              <path d="M104 354V222L214 166V354" className="building-outline" />
              <path d="M214 354V112L353 64V354" className="building-outline building-outline--strong" />
              <path d="M353 354V173L431 207V354" className="building-outline" />
              <path d="M214 112L353 64L431 99V207" className="building-roof" />
              <path d="M104 222L214 166" className="building-roof" />
              <path d="M241 145V354M272 134V354M303 123V354M333 112V354" className="building-detail" />
              <path d="M237 185H337M237 224H337M237 263H337M237 302H337" className="building-detail" />
              <path d="M130 242V270M166 224V252M130 295V323M166 277V305" className="building-detail" />
              <path d="M379 220V249M405 231V260M379 273V302M405 284V313" className="building-detail" />
              <path d="M93 354V202H225" className="building-accent" />
              <path d="M195 354V95L367 36V354" className="building-accent building-accent--soft" />
              <circle cx="367" cy="36" r="5" className="building-point" />
              <path d="M195 95L367 36" className="building-accent" />
              <path d="M392 94H452M422 80V107M452 94V207" className="building-crane" />
              <path d="M382 104L452 94L478 101" className="building-crane" />
            </svg>
            <div className="hero-visual__label hero-visual__label--top">
              <span className="hero-visual__label-dot" />
              Planejamento
            </div>
            <div className="hero-visual__label hero-visual__label--bottom">
              <span className="hero-visual__label-mark">b&amp;d</span>
              <span>
                <strong>Uma visão completa</strong>
                <small>Da equipe ao projeto</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-highlights" aria-label="O que você encontra na plataforma">
        <p>O essencial para acompanhar sua operação</p>
        <ul>
          {highlights.map((highlight) => (
            <li key={highlight}>
              <span aria-hidden="true" />
              {highlight}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
