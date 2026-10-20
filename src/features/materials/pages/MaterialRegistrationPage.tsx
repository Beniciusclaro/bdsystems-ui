import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { getAllSuppliers } from '../../suppliers/services/supplierService';
import type { SupplierResponse } from '../../suppliers/types/supplier';
import { MaterialForm } from '../components/MaterialForm';
import { CategoryDialog } from '../components/CategoryDialog';
import {
  getCategories,
  getUnits,
  getMaterial,
  getMaterialSuppliers,
  saveMaterial,
  removeMaterialSupplier,
} from '../services/materialService';
import type {
  Material,
  MaterialCategory,
  MaterialRequest,
  MaterialSupplier,
  UnitOfMeasure,
} from '../types/material';
import './MaterialRegistrationPage.scss';

interface Data {
  material?: Material;
  associations: MaterialSupplier[];
  categories: MaterialCategory[];
  units: UnitOfMeasure[];
  suppliers: SupplierResponse[];
}
export function MaterialRegistrationPage() {
  const { materialId } = useParams();
  return <MaterialRegistration key={materialId ?? 'new'} materialId={materialId} />;
}
function MaterialRegistration({ materialId }: { materialId?: string }) {
  const navigate = useNavigate();

  const { refreshMaterials, notify } = useOutletContext<{
    refreshMaterials: () => void;
    notify: (message: string) => void;
  }>();

  const [data, setData] = useState<Data | null>(null);

  const [loadError, setLoadError] = useState('');

  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const pending = useRef(false);

  const [revision, setRevision] = useState(0);

  const [manageCategories, setManageCategories] = useState(false);
  useEffect(() => {
    let current = true;
    Promise.all([
      getCategories(),
      getUnits(),
      getAllSuppliers(),
      materialId ? getMaterial(materialId) : Promise.resolve(undefined),
      materialId ? getMaterialSuppliers(materialId) : Promise.resolve([]),
    ])
      .then(([categories, units, suppliers, material, associations]) => {
        if (current)
          setData({
            categories,
            units:
              material && !units.some((u) => u.id === material.unitOfMeasure.id)
                ? [...units, material.unitOfMeasure]
                : units,
            suppliers,
            material,
            associations,
          });
      })
      .catch((cause: unknown) => {
        if (current)
          setLoadError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar o formulário.',
          );
      });
    return () => {
      current = false;
    };
  }, [materialId, revision]);
  const close = () => {
    if (!pending.current) navigate('/materials', { replace: true });
  };

  const submit = async (payload: MaterialRequest) => {
    if (pending.current || !data) return;
    pending.current = true;
    setBusy(true);
    setError('');
    let saved = false;
    try {
      const result = await saveMaterial(materialId, payload);
      saved = true;
      // PUT preserves omitted associations: remove only after a successful save.
      if (materialId) {
        for (const association of data.associations.filter(
          (a) => !payload.suppliers.some((s) => s.supplierId === a.supplierId),
        )) {
          await removeMaterialSupplier(result.id, association.id);
          setData((current) =>
            current
              ? {
                  ...current,
                  associations: current.associations.filter((a) => a.id !== association.id),
                }
              : current,
          );
        }
      }
      refreshMaterials();
      notify(materialId ? 'Material atualizado com sucesso.' : 'Material cadastrado com sucesso.');
      navigate('/materials', { replace: true });
    } catch (cause) {
      if (saved) refreshMaterials();
      setError(
        `${saved ? 'Os dados do material foram salvos, mas há vínculos que não puderam ser removidos. Salve novamente para tentar concluir. ' : ''}${cause instanceof Error ? cause.message : 'Não foi possível salvar o material.'}`,
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <RegistrationDialog
      open
      isSubmitting={busy}
      kind="material"
      eyebrow="Cadastros"
      title={materialId ? 'Editar material' : 'Cadastrar material'}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <section className="panel-card">
        {!data ? (
          loadError ? (
            <ContentState
              variant="error"
              title={loadError}
              action={
                <button
                  className="text-button"
                  onClick={() => {
                    setLoadError('');
                    setRevision((r) => r + 1);
                  }}
                >
                  Tentar novamente
                </button>
              }
            />
          ) : (
            <ContentState variant="loading" title="Carregando dados do material..." />
          )
        ) : (
          <>
            {error && (
              <p role="alert" className="message error">
                {error}
              </p>
            )}
            <MaterialForm
              material={data.material}
              associations={data.associations}
              categories={data.categories}
              units={data.units}
              suppliers={data.suppliers}
              busy={busy}
              onSubmit={submit}
              onCancel={close}
              onManageCategories={() => setManageCategories(true)}
            />
            {manageCategories && (
              <CategoryDialog
                categories={data.categories}
                onClose={() => setManageCategories(false)}
                onSaved={(category) =>
                  setData((current) =>
                    current
                      ? {
                          ...current,
                          categories: [
                            ...current.categories.filter((c) => c.id !== category.id),
                            category,
                          ],
                        }
                      : current,
                  )
                }
              />
            )}
          </>
        )}
      </section>
    </RegistrationDialog>
  );
}
