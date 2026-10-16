import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContentState } from '../components/ui/ContentState';
import { DataTable } from '../components/ui/DataTable';
import type { DataTableColumn } from '../components/ui/DataTable';
import { IconActionButton, RowActions } from '../components/ui/RowActions';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { clearAuthToken, getAuthToken } from '../lib/session';
import {
  activateTool,
  deactivateTool,
  getTools,
} from '../services/toolService';
import { getAllToolRentals } from '../services/toolRentalService';
import type { ToolFilters, ToolResponse } from '../types/tool';
import type { ToolRentalResponse } from '../types/toolRental';
import './ToolListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ToolListPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [tools, setTools] = useState<ToolResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [queryFilter, setQueryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ToolFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [toolToDeactivate, setToolToDeactivate] = useState<ToolResponse | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [showRentalData, setShowRentalData] = useState(false);
  const [rentalData, setRentalData] = useState<ToolRentalResponse[] | null>(null);
  const [isLoadingRentals, setIsLoadingRentals] = useState(false);
  const [rentalError, setRentalError] = useState<string | null>(null);
  const pendingRentalsRef = useRef<Promise<ToolRentalResponse[]> | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    getTools(page, pageSize, appliedFilters)
      .then((result) => {
        if (!ignore) {
          setTools(result.content);
          setTotalElements(result.page.totalElements);
          setTotalPages(result.page.totalPages);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar as ferramentas.',
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedFilters, navigate, page, pageSize, reloadCount, token]);

  useEffect(() => {
    if (!showRentalData || rentalData !== null || tools.length === 0) {
      return;
    }

    let ignore = false;
    const request = pendingRentalsRef.current ?? getAllToolRentals();
    pendingRentalsRef.current = request;

    request
      .then((result) => {
        if (!ignore) {
          setRentalData(result);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setRentalError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar os registos de aluguer.',
          );
        }
      })
      .finally(() => {
        if (pendingRentalsRef.current === request) {
          pendingRentalsRef.current = null;
        }
        if (!ignore) {
          setIsLoadingRentals(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [rentalData, showRentalData, tools.length]);

  const refreshTools = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const refreshRentalData = () => {
    setRentalData(null);
    setRentalError(null);
    if (showRentalData) {
      setIsLoadingRentals(true);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const searchTools = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filters: ToolFilters = {
      ...(activeFilter ? { active: activeFilter === 'true' } : {}),
      ...(queryFilter.trim() ? { q: queryFilter.trim() } : {}),
    };
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setAppliedFilters(filters);
    setPage(0);
  };

  const clearFilters = () => {
    setQueryFilter('');
    setActiveFilter('');
    setAppliedFilters({});
    setError(null);
    setIsLoading(true);
    setPage(0);
  };

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const changePage = (nextPage: number) => {
    setError(null);
    setIsLoading(true);
    setPage(nextPage);
  };

  const changePageSize = (nextPageSize: number) => {
    setError(null);
    setIsLoading(true);
    setPageSize(nextPageSize);
    setPage(0);
  };

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
      const message = requestError instanceof Error
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
    ...(showRentalData ? [{
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
            {count > 0
              ? `${count} ${count === 1 ? 'registo' : 'registos'}`
              : 'Sem alugueres'}
          </StatusBadge>
        );
      },
    }] : []),
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
                <path d="M7 7h10v10H7z" />
                <path d="M4 4h16v16H4z" />
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

  if (!token) {
    return null;
  }

  return (
    <main className="dashboard-page tool-list-page">
      <Sidebar onLogout={handleLogout} />

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="dashboard-eyebrow">Cadastros</p>
            <h1>Ferramentas</h1>
          </div>
          <Link to="/tools/new" className="primary-button">Cadastrar ferramenta</Link>
        </header>

        {success ? <p className="message success tool-page-message" role="status">{success}</p> : null}

        <section className="panel-card tool-list-card" aria-labelledby="tool-list-heading">
          <div className="tool-list-heading">
            <div>
              <h2 id="tool-list-heading">Lista de ferramentas</h2>
              <p className="tool-list-description">
                Consulte e mantenha o cadastro de ferramentas da sua empresa.
              </p>
            </div>
            <span className="tool-total">
              {totalElements} {totalElements === 1 ? 'ferramenta' : 'ferramentas'}
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
            <button type="submit" className="primary-button">Buscar</button>
            <button type="button" className="text-button" onClick={clearFilters}>Limpar filtros</button>
          </form>

          <div className="tool-rental-toggle">
            <label className="tool-rental-checkbox">
              <input
                type="checkbox"
                checked={showRentalData}
                onChange={(event) => {
                  setShowRentalData(event.target.checked);
                  if (event.target.checked && rentalData === null && tools.length > 0) {
                    setIsLoadingRentals(true);
                    setRentalError(null);
                  }
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
                  setRentalData(null);
                  setRentalError(null);
                  setIsLoadingRentals(true);
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
              action={(
                <button type="button" className="text-button" onClick={retryLoading}>
                  Tentar novamente
                </button>
              )}
            />
          ) : isLoading ? (
            <ContentState
              variant="loading"
              title="Carregando ferramentas..."
              className="tool-list-state"
            />
          ) : tools.length === 0 && totalElements === 0 && Object.keys(appliedFilters).length === 0 ? (
            <ContentState
              variant="empty"
              title="Nenhuma ferramenta cadastrada"
              description="Cadastre uma ferramenta para começar a organizar os equipamentos da empresa."
              action={<Link to="/tools/new" className="primary-button">Cadastrar ferramenta</Link>}
              className="tool-list-state"
            />
          ) : tools.length === 0 ? (
            <ContentState
              variant="no-results"
              title="Nenhuma ferramenta encontrada"
              description="Altere os filtros ou limpe a pesquisa para ver outros resultados."
              action={<button type="button" className="secondary-button" onClick={clearFilters}>Limpar filtros</button>}
              className="tool-list-state"
            />
          ) : (
            <DataTable
              rows={tools}
              columns={toolColumns}
              getRowKey={(tool) => tool.id}
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
        </section>
      </section>

      <Outlet context={{ refreshTools, refreshRentalData, tools, isLoading }} />

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
          description={(
            <>
              <strong>{toolToDeactivate.name}</strong> deixará de poder ser usada em novos registos
              de aluguer. Os registos existentes serão mantidos.
            </>
          )}
          error={deactivateError}
          isConfirming={Boolean(changingStatusId)}
          confirmLabel="Desativar ferramenta"
          confirmingLabel="Desativando..."
          onConfirm={() => changeToolStatus(toolToDeactivate)}
          confirmVariant="danger"
        />
      ) : null}

    </main>
  );
}
