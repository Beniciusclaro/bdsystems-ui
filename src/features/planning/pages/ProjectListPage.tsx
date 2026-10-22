import { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { ProjectDetailsDialog } from '../components/ProjectDetailsDialog';
import { projectStatusLabel, projectStatusTone } from '../presentation';
import { getProjects } from '../services/planningService';
import type { Project } from '../types/planning';
import './Planning.scss';

export function ProjectListPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);

  const [selected, setSelected] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getProjects()
      .then(setProjects)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as obras.'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Synchronize the list with the planning API on route entry.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const columns: DataTableColumn<Project>[] = [
    { key: 'code', header: 'Código', mobileLabel: 'Código', renderCell: (project) => project.code },
    {
      key: 'name',
      header: 'Obra',
      mobileLabel: 'Obra',
      renderCell: (project) => <strong>{project.name}</strong>,
    },
    {
      key: 'client',
      header: 'Cliente',
      mobileLabel: 'Cliente',
      renderCell: (project) => project.clientName,
    },
    {
      key: 'period',
      header: 'Período planeado',
      mobileLabel: 'Período',
      renderCell: (project) => formatPeriod(project),
    },
    {
      key: 'status',
      header: 'Fase',
      mobileLabel: 'Fase',
      renderCell: (project) => (
        <StatusBadge tone={projectStatusTone[project.status]}>
          {projectStatusLabel[project.status]}
        </StatusBadge>
      ),
    },
    {
      key: 'active',
      header: 'Situação',
      mobileLabel: 'Situação',
      renderCell: (project) => (
        <StatusBadge tone={project.active ? 'success' : 'neutral'}>
          {project.active ? 'Ativa' : 'Inativa'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      renderCell: (project) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${project.name}`}
            variant="accent"
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            <span aria-hidden="true">✎</span>
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  return (
    <main className="dashboard-content planning-page">
      <PageHeader
        eyebrow="Planeamento"
        title="Obras"
        action={
          <span>
            {projects.length} {projects.length === 1 ? 'obra' : 'obras'}
          </span>
        }
      />
      {success ? (
        <p className="message success" role="status">
          {success}
        </p>
      ) : null}
      <Panel labelledBy="project-list-heading">
        <div className="planning-list-heading">
          <div>
            <h2 id="project-list-heading">Lista de obras</h2>
            <p>Acompanhe a fase e os dados operacionais das obras geradas por orçamentos.</p>
          </div>
        </div>
        {error ? (
          <ContentState
            variant="error"
            title={error}
            action={
              <button className="text-button" onClick={load}>
                Tentar novamente
              </button>
            }
          />
        ) : loading ? (
          <ContentState variant="loading" title="Carregando obras..." />
        ) : projects.length === 0 ? (
          <ContentState
            variant="empty"
            title="Nenhuma obra gerada"
            description="As obras aparecerão aqui após a aprovação de um orçamento."
          />
        ) : (
          <DataTable
            rows={projects}
            columns={columns}
            getRowKey={(project) => project.id}
            getRowLabel={(project) => `Abrir detalhes de ${project.name}`}
            onRowActivate={setSelected}
            ariaLabel="Lista de obras"
          />
        )}
      </Panel>
      <Outlet context={{ refreshProjects: load, notify: setSuccess }} />
      {selected ? (
        <ProjectDetailsDialog project={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}

const formatPeriod = (project: Project) => {
  const start = project.plannedStartDate ?? 'A definir';

  const end = project.plannedEndDate ?? 'A definir';
  return `${start} — ${end}`;
};
