import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { Panel } from '../../../shared/components/ui/Panel';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import { ProjectDetailsDialog } from '../components/ProjectDetailsDialog';
import { projectStatusLabel, projectStatusTone } from '../presentation';
import { getProjectsPage } from '../services/planningService';
import type { Project, ProjectFilters } from '../types/planning';
import './Planning.scss';

export function ProjectListPage() {
  const navigate = useNavigate();

  const resource = usePaginatedResource<Project, ProjectFilters>(
    getProjectsPage,
    {},
    'Não foi possível carregar as obras.',
  );

  const [draft, setDraft] = useState({ search: '', status: '' });

  const [selected, setSelected] = useState<Project | null>(null);

  const [success, setSuccess] = useState('');

  const hasFilters = Boolean(resource.filters.search || resource.filters.status);

  const clear = () => {
    setDraft({ search: '', status: '' });
    resource.applyFilters({});
  };

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
    { key: 'period', header: 'Período planeado', mobileLabel: 'Período', renderCell: formatPeriod },
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
            {resource.totalElements} {resource.totalElements === 1 ? 'obra' : 'obras'}
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
        <form
          className="planning-filters"
          aria-label="Filtros de obras"
          onSubmit={(event) => {
            event.preventDefault();
            resource.applyFilters({
              search: draft.search.trim() || undefined,
              status: (draft.status || undefined) as Project['status'] | undefined,
            });
          }}
        >
          <label>
            Código, obra ou cliente
            <input
              type="search"
              value={draft.search}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </label>
          <label>
            Fase
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
            >
              <option value="">Todas</option>
              <option value="PLANNING">Planeamento</option>
              <option value="ACTIVE">Em execução</option>
              <option value="ON_HOLD">Suspensa</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </label>
          <button className="primary-button">Buscar</button>
          {(hasFilters || draft.search || draft.status) && (
            <button type="button" className="text-button" onClick={clear}>
              Limpar filtros
            </button>
          )}
        </form>
        {resource.error ? (
          <ContentState
            variant="error"
            title={resource.error}
            action={
              <button className="text-button" onClick={resource.refresh}>
                Tentar novamente
              </button>
            }
          />
        ) : resource.isLoading ? (
          <ContentState variant="loading" title="Carregando obras..." />
        ) : resource.rows.length === 0 ? (
          <ContentState
            variant={hasFilters ? 'no-results' : 'empty'}
            title={hasFilters ? 'Nenhuma obra encontrada' : 'Nenhuma obra gerada'}
            description={
              hasFilters ? undefined : 'As obras aparecerão aqui após a aprovação de um orçamento.'
            }
            action={
              hasFilters ? (
                <button className="text-button" onClick={clear}>
                  Limpar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            rows={resource.rows}
            columns={columns}
            getRowKey={(project) => project.id}
            getRowLabel={(project) => `Abrir detalhes de ${project.name}`}
            onRowActivate={setSelected}
            ariaLabel="Lista de obras"
          />
        )}
        {!resource.isLoading && !resource.error && resource.rows.length > 0 && (
          <Pagination
            currentPage={resource.page}
            totalPages={resource.totalPages}
            pageSize={resource.pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={resource.goToPage}
            onPageSizeChange={resource.changePageSize}
            ariaLabel="Paginação de obras"
          />
        )}
      </Panel>
      <Outlet context={{ refreshProjects: resource.refresh, notify: setSuccess }} />
      {selected ? (
        <ProjectDetailsDialog project={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}

const formatPeriod = (project: Project) =>
  `${project.plannedStartDate ?? 'A definir'} — ${project.plannedEndDate ?? 'A definir'}`;
