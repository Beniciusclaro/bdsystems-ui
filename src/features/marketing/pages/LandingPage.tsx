import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../../shared/components/brand/BrandLogo';
import './LandingPage.scss';

type Feature = { title: string; description: string; icon: ReactNode };

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

// TODO: ajuste os textos para as funcionalidades reais do sistema.
const features: Feature[] = [
  {
    title: 'Projetos organizados',
    description: 'Cada obra com suas etapas, prazos e responsáveis reunidos num só lugar.',
    icon: (
      <svg {...iconProps}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    ),
  },
  {
    title: 'Equipes conectadas',
    description: 'Quem está em campo e quem está no escritório enxergam a mesma informação.',
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M17 14c2.4 0 4 1.7 4 4.2" />
      </svg>
    ),
  },
  {
    title: 'Informações acessíveis',
    description: 'Consulte o andamento de qualquer lugar, pelo celular ou pelo computador.',
    icon: (
      <svg {...iconProps}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
];

const steps = [
  { title: 'Crie sua conta', description: 'Cadastre-se com seus dados básicos.' },
  { title: 'Cadastre sua obra', description: 'Adicione o projeto, as etapas e a equipe.' },
  {
    title: 'Acompanhe o andamento',
    description: 'Veja o progresso de cada etapa em um painel único.',
  },
];

const previewStages = [
  { name: 'Fundação', progress: 100 },
  { name: 'Estrutura', progress: 72 },
  { name: 'Acabamento', progress: 18 },
];

function HeroIllustration() {
  return (
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
      <path d="M195 354V95L367 36V354" className="building-accent building-accent--soft" />
      <circle cx="367" cy="36" r="5" className="building-point" />
      <path d="M392 94H452M422 80V107M452 94V207" className="building-crane" />
      <path d="M382 104L452 94L478 101" className="building-crane" />
    </svg>
  );
}

function AppPreview() {
  return (
    <div className="app-preview">
      <div className="app-preview__head">
        <div>
          <small>Obra</small>
          <strong>Residencial Jardim das Acácias</strong>
        </div>
        <span className="app-preview__status">Em andamento</span>
      </div>

      <div className="app-preview__overall">
        <span>Andamento geral</span>
        <strong>63%</strong>
        <div className="preview-bar">
          <span style={{ width: '63%' }} />
        </div>
      </div>

      <ul className="app-preview__stages">
        {previewStages.map((stage) => (
          <li key={stage.name}>
            <span>{stage.name}</span>
            <div className="preview-bar">
              <span style={{ width: `${stage.progress}%` }} />
            </div>
            <em>{stage.progress}%</em>
          </li>
        ))}
      </ul>

      <div className="app-preview__foot">
        <div className="avatars">
          <span>MR</span>
          <span>JS</span>
          <span>AL</span>
        </div>
        12 pessoas em campo hoje
      </div>
      <p className="app-preview__note">Exemplo ilustrativo</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header__inner">
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

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-container landing-hero__inner">
            <div className="hero-copy">
              <h1 id="landing-title">
                Sua obra em cada etapa.
                <span>Tudo em um só lugar.</span>
              </h1>
              <p className="hero-description">
                Acompanhe projetos, equipes e andamento de cada etapa em um painel simples, pelo
                celular ou pelo computador.
              </p>

              <div className="cta-row">
                <Link to="/register" className="primary-button">
                  Criar minha conta
                </Link>
                <a href="#como-funciona" className="secondary-button">
                  Ver como funciona
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-visual__grid" />
              <HeroIllustration />
              <AppPreview />
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="landing-section" aria-labelledby="features-title">
          <div className="landing-container">
            <div className="section-heading">
              <h2 id="features-title">O essencial para acompanhar sua operação</h2>
              <p>Menos planilhas e mensagens soltas, mais clareza sobre o que está acontecendo.</p>
            </div>
            <ul className="feature-list">
              {features.map((feature) => (
                <li key={feature.title}>
                  <span className="feature-icon">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="como-funciona"
          className="landing-section landing-section--alt"
          aria-labelledby="steps-title"
        >
          <div className="landing-container">
            <div className="section-heading">
              <h2 id="steps-title">Comece em três passos</h2>
            </div>
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div className="landing-container">
            <div className="landing-cta__panel">
              <div>
                <h2 id="cta-title">Pronto para organizar sua obra?</h2>
                <p>Crie sua conta e cadastre seu primeiro projeto.</p>
              </div>
              <Link to="/register" className="primary-button">
                Criar minha conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <span>© {new Date().getFullYear()} Edificações B&amp;D</span>
          <nav aria-label="Acesso">
            <Link to="/login">Entrar</Link>
            <Link to="/register">Criar conta</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
