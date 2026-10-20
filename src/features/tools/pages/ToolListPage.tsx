import { ToolDetailsDialog } from '../components/ToolDetailsDialog';
import { useToolRentalData } from '../../rentals/hooks/useToolRentalData';
import { Panel } from '../../../shared/components/ui/Panel';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable } from '../../../shared/components/ui/DataTable';
import type { DataTableColumn } from '../../../shared/components/ui/DataTable';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { activateTool, deactivateTool, getTools } from '../services/toolService';
import type { ToolFilters, ToolResponse } from '../types/tool';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import './ToolListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ToolListPage() {
  const navigate = useNavigate();

  const {
    rows: tools,
    totalElements,
    totalPages,
    page,
    pageSize,
    filters: appliedFilters,
    isLoading,
    error,
    setError,
    applyFilters,
    goToPage,
    changePageSize,
    refresh,
  } = usePaginatedResource<ToolResponse, ToolFilters>(
    getTools,
    {},
    'Não foi possível carregar as ferramentas.',
  );

  const [queryFilter, setQueryFilter] = useState('');

  const [activeFilter, setActiveFilter] = useState('');

  const [success, setSuccess] = useState<string | null>(null);

  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  const [toolToDeactivate, setToolToDeactivate] = useState<ToolResponse | null>(null);

  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const rental = useToolRentalData(tools.length);

  const {
    showRentalData,
    rentalData,
    isLoadingRentals,
    rentalError,
    toggleRentalData,
    refreshRentalData,
    retryRentalData,
    openTool,
  } = rental;

  const refreshTools = refresh;

  const searchTools = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    applyFilters({
      ...(activeFilter ? { active: activeFilter === 'true' } : {}),
      ...(queryFilter.trim() ? { q: queryFilter.trim() } : {}),
    });
  };

  const clearFilters = () => {
    setQueryFilter('');
    setActiveFilter('');
    applyFilters({});
  };

  const retryLoading = refresh;

  const changePage = goToPage;

  const changeToolStatus = async (tool: ToolResponse) => {
    setError(null);
    setSuccess(null);
    setChangingStatusId(tool.id);

    try {
      if (tool.active) {
        await deactivateTool(tool.id);
        setToolToDeactivate(null);
        setSuccess('Ferramenta desativada. Os registos de aluguer foram mantidos.');
      } else {
        await activateTool(tool.id);
        setSuccess('Ferramenta ativada com sucesso.');
      }
      refreshTools();
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : `Não foi possível ${tool.active ? 'desativar' : 'ativar'} a ferramenta.`;
      if (tool.active) {
        setDeactivateError(message);
      } else {
        setError(message);
      }
    } finally {
      setChangingStatusId(null);
    }
  };

  const toolColumns: DataTableColumn<ToolResponse>[] = [
    {
      key: 'code',
      header: 'Código',
      mobileLabel: 'Código',
      renderCell: (tool) => <span className="tool-code">{tool.code}</span>,
    },
    {
      key: 'name',
      header: 'Ferramenta',
      mobileLabel: 'Ferramenta',
      renderCell: (tool) => <span className="tool-name">{tool.name}</span>,
    },
    {
      key: 'active',
      header: 'Estado',
      mobileLabel: 'Estado',
      renderCell: (tool) => (
        <StatusBadge tone={tool.active ? 'success' : 'neutral'}>
          {tool.active ? 'Ativa' : 'Inativa'}
        </StatusBadge>
      ),
    },
    ...(showRentalData
      ? [
          {
            key: 'rentals',
            header: 'Registos de aluguer',
            mobileLabel: 'Registos de aluguer',
            renderCell: (tool: ToolResponse) => {
              if (isLoadingRentals) {
                return <span className="tool-rental-indicator">A carregar...</span>;
              }
              if (rentalError) {
                return <span className="tool-rental-indicator">Indisponível</span>;
              }
              const count = rentalData?.filter((rental) => rental.toolId === tool.id).length ?? 0;
              return (
                <StatusBadge tone={count > 0 ? 'info' : 'neutral'}>
                  {count > 0 ? `${count} ${count === 1 ? 'registo' : 'registos'}` : 'Sem alugueres'}
                </StatusBadge>
              );
            },
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'tool-actions-heading',
      cellClassName: 'tool-actions-cell',
      renderCell: (tool) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${tool.name}`}
            variant="accent"
            onClick={() => navigate(`/tools/${tool.id}/edit`)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9" />
              <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z" />
            </svg>
          </IconActionButton>
          <IconActionButton
            label={`${tool.active ? 'Desativar' : 'Ativar'} ${tool.name}`}
            variant={tool.active ? 'danger' : 'default'}
            onClick={() => {
              if (tool.active) {
                setDeactivateError(null);
                setToolToDeactivate(tool);
              } else {
                void changeToolStatus(tool);
              }
            }}
            disabled={changingStatusId === tool.id}
          >
            {tool.active ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 10v6M14 10v6" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12h16" />
              </svg>
            )}
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  return (
    <section className="dashboard-content tool-list-page">
      <PageHeader
        eyebrow="Cadastros"
        title="Ferramentas"
        action={
          <span className="tool-total">
            {totalElements} {totalElements === 1 ? 'ferramenta' : 'ferramentas'}
          </span>
        }
      />

      {success ? (
        <p className="message success tool-page-message" role="status">
          {success}
        </p>
      ) : null}

      <Panel className="tool-list-card" labelledBy="tool-list-heading">
        <div className="tool-list-heading">
          <div>
            <h2 id="tool-list-heading">Lista de ferramentas</h2>
            <p className="tool-list-description">
              Consulte e mantenha o cadastro de ferramentas da sua empresa.
            </p>
          </div>
          <span className="tool-list-page-count" aria-live="polite">
            {tools.length} {tools.length === 1 ? 'ferramenta' : 'ferramentas'} nesta página
          </span>
        </div>

        <form className="tool-filters" aria-label="Filtros de ferramentas" onSubmit={searchTools}>
          <label>
            Pesquisar
            <input
              type="search"
              value={queryFilter}
              onChange={(event) => setQueryFilter(event.target.value)}
              placeholder="Código ou nome"
            />
          </label>
          <label>
            Estado
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="">Todas as ferramentas</option>
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
            </select>
          </label>
          <button type="submit" className="primary-button">
            Buscar
          </button>
          <button type="button" className="text-button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </form>

        <div className="tool-rental-toggle">
          <label className="tool-rental-checkbox">
            <input
              type="checkbox"
              checked={showRentalData}
              onChange={(event) => {
                toggleRentalData(event.target.checked);
              }}
            />
            <span>Mostrar dados de aluguer</span>
          </label>
          <p>Os registos só são consultados quando esta opção está ativada.</p>
        </div>

        {rentalError && showRentalData ? (
          <div className="message error tool-rental-load-error" role="alert">
            <span>{rentalError}</span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                retryRentalData();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        {error ? (
          <ContentState
            variant="error"
            title={error}
            action={
              <button type="button" className="text-button" onClick={retryLoading}>
                Tentar novamente
              </button>
            }
          />
        ) : isLoading ? (
          <ContentState
            variant="loading"
            title="Carregando ferramentas..."
            className="tool-list-state"
          />
        ) : tools.length === 0 &&
          totalElements === 0 &&
          Object.keys(appliedFilters).length === 0 ? (
          <ContentState
            variant="empty"
            title="Nenhuma ferramenta cadastrada"
            description="Cadastre uma ferramenta para começar a organizar os equipamentos da empresa."
            action={
              <Link to="/tools/new" className="primary-button">
                Cadastrar ferramenta
              </Link>
            }
            className="tool-list-state"
          />
        ) : tools.length === 0 ? (
          <ContentState
            variant="no-results"
            title="Nenhuma ferramenta encontrada"
            description="Altere os filtros ou limpe a pesquisa para ver outros resultados."
            action={
              <button type="button" className="secondary-button" onClick={clearFilters}>
                Limpar filtros
              </button>
            }
            className="tool-list-state"
          />
        ) : (
          <DataTable
            rows={tools}
            columns={toolColumns}
            getRowKey={(tool) => tool.id}
            getRowLabel={(tool) => `Abrir detalhes de ${tool.name}`}
            onRowActivate={(tool) => {
              openTool(tool);
            }}
            ariaLabel="Lista de ferramentas"
            className="tool-table"
            wrapperClassName="tool-table-wrap"
          />
        )}

        {!isLoading && !error && tools.length > 0 ? (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            ariaLabel="Paginação da lista de ferramentas"
            className="tool-list-controls"
          />
        ) : null}
      </Panel>
      <Link to="/tools/new" className="list-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar ferramenta
      </Link>
      <Outlet context={{ refreshTools, refreshRentalData, tools, isLoading }} />

      <ToolDetailsDialog rental={rental} />

      {toolToDeactivate ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !changingStatusId) {
              setToolToDeactivate(null);
              setDeactivateError(null);
            }
          }}
          eyebrow="Confirmar desativação"
          title="Desativar ferramenta?"
          description={
            <>
              <strong>{toolToDeactivate.name}</strong> deixará de poder ser usada em novos registos
              de aluguer. Os registos existentes serão mantidos.
            </>
          }
          error={deactivateError}
          isConfirming={Boolean(changingStatusId)}
          confirmLabel="Desativar ferramenta"
          confirmingLabel="Desativando..."
          onConfirm={() => changeToolStatus(toolToDeactivate)}
          confirmVariant="danger"
        />
      ) : null}
    </section>
  );
}
