import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { SupplierForm } from '../components/SupplierForm';
import { createSupplier, getSupplier, updateSupplier } from '../services/supplierService';
import type { SupplierRequest, SupplierResponse } from '../types/supplier';
import './SupplierRegistrationPage.scss';

interface SupplierListOutletContext {
  refreshSuppliers: () => void;
  suppliers: SupplierResponse[];
}

export function SupplierRegistrationPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { refreshSuppliers, suppliers } = useOutletContext<SupplierListOutletContext>();
  const supplierInList = supplierId ? suppliers.find((item) => item.id === supplierId) : undefined;
  const [loadedSupplier, setLoadedSupplier] = useState<SupplierResponse | null>(null);
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null);
  const supplier =
    supplierInList ??
    (loadedSupplier && loadedSupplier.id === supplierId ? loadedSupplier : undefined);
  const isEditing = Boolean(supplierId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supplierId || supplierInList) return;
    let active = true;
    getSupplier(supplierId)
      .then((record) => {
        if (active) setLoadedSupplier(record);
      })
      .catch((cause: unknown) => {
        if (active)
          setLoadError({
            id: supplierId,
            message:
              cause instanceof Error ? cause.message : 'Não foi possível carregar o fornecedor.',
          });
      });
    return () => {
      active = false;
    };
  }, [supplierId, supplierInList]);

  const closeModal = () => {
    navigate('/suppliers', { replace: true });
  };

  const handleSubmit = async (payload: SupplierRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (supplierId) {
        await updateSupplier(supplierId, payload);
        setSuccess('Fornecedor atualizado com sucesso.');
      } else {
        await createSupplier(payload);
        setSuccess('Fornecedor cadastrado com sucesso.');
      }
      refreshSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isEditing
            ? 'Não foi possível atualizar o fornecedor.'
            : 'Não foi possível cadastrar o fornecedor.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationDialog
      open
      kind="supplier"
      eyebrow="Cadastros"
      title={isEditing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <section className="panel-card supplier-form-card">
        <p className="supplier-form-intro">
          {isEditing
            ? 'Atualize os dados comerciais e o endereço do fornecedor.'
            : 'Informe os dados comerciais e o endereço do fornecedor.'}
        </p>

        {isEditing && !supplier && loadError?.id !== supplierId ? (
          <p className="supplier-list-state" role="status">
            Carregando dados do fornecedor...
          </p>
        ) : null}

        {isEditing && !supplier && loadError?.id === supplierId ? (
          <div className="message error" role="alert">
            {loadError?.message}
          </div>
        ) : null}

        {error ? (
          <div className="message error" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="message success" role="status">
            {success}
          </div>
        ) : null}

        {!isEditing || supplier ? (
          <SupplierForm
            key={supplierId ?? 'new'}
            initialValues={supplier}
            isSubmitting={isSubmitting}
            submitLabel={isEditing ? 'Atualizar fornecedor' : 'Cadastrar fornecedor'}
            submittingLabel={isEditing ? 'Atualizando...' : 'Cadastrando...'}
            onSubmit={handleSubmit}
          />
        ) : null}
      </section>
    </RegistrationDialog>
  );
}
