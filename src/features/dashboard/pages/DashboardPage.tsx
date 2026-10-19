import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
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
  return (
    <section className="dashboard-content">
        <PageHeader eyebrow="Painel de operação" title="Visão geral" action={<Link to="/employees/new" className="primary-button">Novo funcionário</Link>} />

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
  );
}
