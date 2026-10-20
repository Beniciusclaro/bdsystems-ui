import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { RowActions, IconActionButton } from '../../../shared/components/ui/RowActions';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import { getCategories, getMaterials, setMaterialStatus } from '../services/materialService';
import { MaterialDetailsDialog } from '../components/MaterialDetailsDialog';
import type { Material, MaterialCategory, MaterialFilters } from '../types/material';
import './MaterialListPage.scss';
export function MaterialListPage() {
  const navigate = useNavigate();

  const resource = usePaginatedResource<Material, MaterialFilters>(
    getMaterials,
    {},
    'Não foi possível carregar os materiais.',
  );

  const [draft, setDraft] = useState({
    name: '',
    code: '',
    categoryId: '',
    active: '',
    sort: 'name,asc',
  });

  const [categories, setCategories] = useState<MaterialCategory[]>([]);

  const [categoryError, setCategoryError] = useState('');

  const [categoryRevision, setCategoryRevision] = useState(0);

  const [success, setSuccess] = useState('');

  const [selected, setSelected] = useState<Material | null>(null);

  const [deactivate, setDeactivate] = useState<Material | null>(null);

  const [statusError, setStatusError] = useState('');

  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    getCategories()
      .then((result) => {
        if (current) setCategories(result);
      })
      .catch((cause: unknown) => {
        if (current)
          setCategoryError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar categorias.',
          );
      });
    return () => {
      current = false;
    };
  }, [categoryRevision]);
  const clear = () => {
    setDraft({ name: '', code: '', categoryId: '', active: '', sort: 'name,asc' });
    resource.applyFilters({});
  };

  const hasFilters = Object.entries(resource.filters).some(
    ([key, value]) => key !== 'sort' && value !== undefined && value !== '',
  );

  const changeStatus = async (material: Material) => {
    if (busy) return;
    setBusy(true);
    setStatusError('');
    setSuccess('');
    try {
      await setMaterialStatus(material.id, !material.active);
      setDeactivate(null);
      resource.refresh();
      setSuccess(`Material ${material.active ? 'desativado' : 'ativado'} com sucesso.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível alterar o status.';
      if (material.active) setStatusError(message);
      else resource.setError(message);
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<Material>[] = [
    { key: 'code', header: 'Código', mobileLabel: 'Código', renderCell: (m) => m.code },
    {
      key: 'name',
      header: 'Material',
      mobileLabel: 'Material',
      renderCell: (m) => <strong>{m.name}</strong>,
    },
    {
      key: 'category',
      header: 'Categoria',
      mobileLabel: 'Categoria',
      renderCell: (m) => m.category?.name ?? 'Sem categoria',
    },
    {
      key: 'unit',
      header: 'Unidade',
      mobileLabel: 'Unidade',
      renderCell: (m) => m.unitOfMeasure.symbol,
    },
    {
      key: 'active',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (m) => (
        <StatusBadge tone={m.active ? 'success' : 'neutral'}>
          {m.active ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      renderCell: (m) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${m.name}`}
            variant="accent"
            onClick={() => navigate(`/materials/${m.id}/edit`)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m16 3 5 5-12 12-6 1 1-6L16 3Z" />
            </svg>
          </IconActionButton>
          <IconActionButton
            label={`${m.active ? 'Desativar' : 'Ativar'} ${m.name}`}
            disabled={busy}
            variant={m.active ? 'danger' : 'default'}
            onClick={() => {
              if (m.active) {
                setStatusError('');
                setDeactivate(m);
              } else void changeStatus(m);
            }}
          >
            {m.active ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 10v6M14 10v6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v16M4 12h16" />
              </svg>
            )}
          </IconActionButton>
        </RowActions>
      ),
    },
  ];
  return (
    <section className="dashboard-content material-list-page">
      <PageHeader
        eyebrow="Cadastros"
        title="Materiais"
        action={
          <span className="material-total">
            {resource.totalElements} {resource.totalElements === 1 ? 'material' : 'materiais'}
          </span>
        }
      />
      {success && (
        <p role="status" className="message success">
          {success}
        </p>
      )}
      <Panel className="material-list-card" labelledBy="material-list-heading">
        <div className="material-list-heading">
          <div>
            <h2 id="material-list-heading">Lista de materiais</h2>
            <p>Gerencie os materiais utilizados nos orçamentos das suas obras.</p>
          </div>
          <span aria-live="polite">
            {resource.rows.length} {resource.rows.length === 1 ? 'material' : 'materiais'} nesta
            página
          </span>
        </div>
        {categoryError && (
          <div className="message error" role="alert">
            {categoryError}
            <button
              className="text-button"
              onClick={() => {
                setCategoryError('');
                setCategoryRevision((r) => r + 1);
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}
        <form
          className="material-filters"
          aria-label="Filtros de materiais"
          onSubmit={(e) => {
            e.preventDefault();
            resource.applyFilters({
              name: draft.name.trim() || undefined,
              code: draft.code.trim() || undefined,
              categoryId: draft.categoryId || undefined,
              active: draft.active === '' ? undefined : draft.active === 'true',
              sort: draft.sort,
            });
          }}
        >
          <label>
            Nome
            <input
              type="search"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Código
            <input
              type="search"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </label>
          <label>
            Categoria
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </label>
          <label>
            Ordenação
            <select
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: e.target.value })}
            >
              <option value="name,asc">Nome crescente</option>
              <option value="name,desc">Nome decrescente</option>
              <option value="code,asc">Código</option>
              <option value="createdAt,desc">Mais recentes</option>
            </select>
          </label>
          <button className="primary-button">Buscar</button>
          {(hasFilters || Object.values(draft).some((v) => v && v !== 'name,asc')) && (
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
          <ContentState variant="loading" title="Carregando materiais..." />
        ) : resource.rows.length === 0 ? (
          <ContentState
            variant={hasFilters ? 'no-results' : 'empty'}
            title={hasFilters ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
            action={
              hasFilters ? (
                <button className="text-button" onClick={clear}>
                  Limpar filtros
                </button>
              ) : (
                <Link className="primary-button" to="/materials/new">
                  Novo material
                </Link>
              )
            }
          />
        ) : (
          <DataTable
            rows={resource.rows}
            columns={columns}
            getRowKey={(m) => m.id}
            getRowLabel={(m) => `Abrir detalhes de ${m.name}`}
            onRowActivate={setSelected}
            ariaLabel="Lista de materiais"
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
            ariaLabel="Paginação de materiais"
            className="material-list-controls"
          />
        )}
      </Panel>
      <Link className="list-create-fab" to="/materials/new">
        <span aria-hidden="true">+</span>
        Cadastrar material
      </Link>
      <Outlet context={{ refreshMaterials: resource.refresh, notify: setSuccess }} />
      {selected && (
        <MaterialDetailsDialog
          key={selected.id}
          material={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {deactivate && (
        <ConfirmDialog
          open
          title="Desativar material?"
          description={`${deactivate.name} ficará inativo no catálogo.`}
          onOpenChange={(open) => {
            if (!open && !busy) setDeactivate(null);
          }}
          onConfirm={() => changeStatus(deactivate)}
          confirmLabel="Desativar material"
          confirmingLabel="Desativando..."
          isConfirming={busy}
          error={statusError}
        />
      )}
    </section>
  );
}
