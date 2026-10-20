import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BriefcaseBusiness, Calculator, Hammer, PackageOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { useDashboardData } from '../hooks/useDashboardData';
import { StatCard } from '../components/StatCard';
import type { DashboardMetric } from '../types/dashboard';
import './DashboardPage.scss';

const metricIcons = {
  'active-projects': BriefcaseBusiness,
  'draft-budgets': Calculator,
  materials: PackageOpen,
  tools: Hammer,
} satisfies Record<DashboardMetric['id'], typeof BriefcaseBusiness>;

const chartColors = [
  'var(--color-accent)',
  'hsl(204 86% 56%)',
  'hsl(38 88% 58%)',
  'hsl(278 65% 61%)',
  'hsl(0 72% 60%)',
];

const projectStatusLabels = {
  PLANNING: 'Planeamento',
  ACTIVE: 'Em execução',
  ON_HOLD: 'Em pausa',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
} as const;

const projectStatusTones = {
  PLANNING: 'info',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
} as const;

const currency = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function DashboardPage() {
  const { data, error, isLoading, refresh } = useDashboardData();

  return (
    <section className="dashboard-content dashboard-overview">
      <PageHeader
        eyebrow="Painel de operação"
        title="Visão geral"
        action={
          <Link to="/budgets" className="primary-button dashboard-primary-action">
            <Plus aria-hidden="true" />
            Novo orçamento
          </Link>
        }
      />

      {isLoading ? (
        <Panel>
          <ContentState variant="loading" title="Preparando o panorama da operação..." />
        </Panel>
      ) : error || !data ? (
        <Panel>
          <ContentState
            variant="error"
            title={error || 'Não foi possível carregar o dashboard.'}
            action={
              <button type="button" className="text-button" onClick={() => void refresh()}>
                Tentar novamente
              </button>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="stats-grid">
            {data.metrics.map((metric) => (
              <StatCard key={metric.id} {...metric} icon={metricIcons[metric.id]} />
            ))}
          </div>

          <div className="dashboard-chart-grid">
            <Panel className="chart-card" labelledBy="budget-chart-title">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Orçamentos recentes</p>
                  <h2 id="budget-chart-title">Custo e preço de venda</h2>
                </div>
              </div>

              {data.budgetError ? (
                <ContentState variant="error" title={data.budgetError} />
              ) : data.budgetComparison.length === 0 ? (
                <ContentState
                  variant="empty"
                  title="Ainda não há orçamentos para comparar"
                  description="Os valores aparecerão aqui após o primeiro orçamento ser criado."
                />
              ) : (
                <div className="chart-area" aria-label="Gráfico de custo e preço de venda">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.budgetComparison} margin={{ top: 8, right: 8, left: 8 }}>
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-muted)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--color-muted)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => currency.format(value)}
                        width={78}
                      />
                      <Tooltip
                        formatter={(value) => currency.format(Number(value))}
                        contentStyle={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          color: 'var(--color-ink)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="cost"
                        name="Custo"
                        fill="var(--color-accent)"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="sale"
                        name="Venda"
                        fill="hsl(204 86% 56%)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel className="chart-card" labelledBy="project-chart-title">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Portfólio</p>
                  <h2 id="project-chart-title">Obras por estado</h2>
                </div>
              </div>

              {data.projectError ? (
                <ContentState variant="error" title={data.projectError} />
              ) : data.projectStatuses.length === 0 ? (
                <ContentState
                  variant="empty"
                  title="Ainda não há obras cadastradas"
                  description="A distribuição será exibida quando existirem projetos."
                />
              ) : (
                <div
                  className="chart-area chart-area--donut"
                  aria-label="Gráfico de obras por estado"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.projectStatuses}
                        dataKey="value"
                        nameKey="label"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={3}
                      >
                        {data.projectStatuses.map((item, index) => (
                          <Cell key={item.status} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          color: 'var(--color-ink)',
                        }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <div className="dashboard-list-grid">
            <Panel className="dashboard-list-card" labelledBy="recent-projects-title">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Acompanhamento</p>
                  <h2 id="recent-projects-title">Obras recentes</h2>
                </div>
                <Link to="/planning" className="panel-link">
                  Ver todas
                </Link>
              </div>

              {data.recentProjects.length === 0 ? (
                <ContentState variant="empty" title="Nenhuma obra cadastrada" />
              ) : (
                <div className="dashboard-list">
                  {data.recentProjects.map((project) => (
                    <div key={project.id} className="dashboard-list__item">
                      <div>
                        <strong>{project.name}</strong>
                        <span>{project.clientName}</span>
                      </div>
                      <StatusBadge tone={projectStatusTones[project.status]}>
                        {projectStatusLabels[project.status]}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="dashboard-list-card" labelledBy="recent-budgets-title">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Comercial</p>
                  <h2 id="recent-budgets-title">Orçamentos recentes</h2>
                </div>
                <Link to="/budgets" className="panel-link">
                  Ver todos
                </Link>
              </div>

              {data.recentBudgets.length === 0 ? (
                <ContentState variant="empty" title="Nenhum orçamento cadastrado" />
              ) : (
                <div className="dashboard-list">
                  {data.recentBudgets.map((budget) => (
                    <div key={budget.id} className="dashboard-list__item">
                      <div>
                        <strong>{budget.title}</strong>
                        <span>{budget.clientName}</span>
                      </div>
                      <div className="dashboard-list__value">
                        <strong>{currency.format(budget.totalSalePrice)}</strong>
                        <StatusBadge tone={budget.status === 'FINALIZED' ? 'success' : 'warning'}>
                          {budget.status === 'FINALIZED' ? 'Finalizado' : 'Rascunho'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}
