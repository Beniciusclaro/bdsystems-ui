import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { StatCard } from '../components/statcard/StatCard';
import { clearAuthToken, getAuthToken } from '../lib/session';
import './DashboardPage.scss';

const stats = [
  { label: 'Projetos ativos', value: '128' },
  { label: 'Equipes em obra', value: '24' },
  { label: 'Indicadores', value: '+18%' },
] as const;

const workItems = [
  { title: 'Obra Residencial Alpha', status: 'Em andamento', meta: '12% concluído' },
  { title: 'Edifício Comercial Beta', status: 'Planejamento', meta: '3 pendências' },
  { title: 'Ampliação Industrial', status: 'Aguardando materiais', meta: '2 fornecedores' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  if (!token) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <Sidebar onLogout={handleLogout} />

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="dashboard-eyebrow">Painel de operação</p>
            <h1>Visão geral</h1>
          </div>
          <button type="button" className="primary-button" disabled title="Funcionalidade não disponível">
            Nova obra
          </button>
        </header>

        <div className="stats-grid">
          {stats.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        <div className="panel-grid">
          <section className="panel-card">
            <div className="panel-header">
              <h2>Obras recentes</h2>
              <button type="button" className="panel-link">Ver todas</button>
            </div>

            <div className="list">
              {workItems.map((item) => (
                <div key={item.title} className="list-item">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.meta}</p>
                  </div>
                  <span className="status-badge">{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-header">
              <h2>Atividade recente</h2>
            </div>

            <ul className="activity-list">
              <li><span className="dot blue" /> Entrega de materiais programada para hoje</li>
              <li><span className="dot green" /> Revisão de cronograma concluída</li>
              <li><span className="dot purple" /> 3 pendências de segurança aguardando resposta</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
