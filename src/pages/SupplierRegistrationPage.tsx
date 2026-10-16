import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { SupplierForm } from '../components/supplier/SupplierForm';
import { getAuthToken } from '../lib/session';
import { createSupplier, updateSupplier } from '../services/supplierService';
import type { SupplierRequest, SupplierResponse } from '../types/supplier';
import './SupplierRegistrationPage.scss';

interface SupplierListOutletContext {
  refreshSuppliers: () => void;
  suppliers: SupplierResponse[];
  isLoading: boolean;
}

export function SupplierRegistrationPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { refreshSuppliers, suppliers, isLoading: isLoadingSuppliers } =
    useOutletContext<SupplierListOutletContext>();
  const supplier = supplierId
    ? suppliers.find((item) => item.id === supplierId)
    : undefined;
  const isEditing = Boolean(supplierId);
  const token = getAuthToken();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [navigate, token]);

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

  if (!token) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="supplier-registration-dialog"
      aria-labelledby="supplier-registration-heading"
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
      onClose={closeModal}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="supplier-registration-content">
        <header className="supplier-registration-header">
          <div>
            <p className="eyebrow">Cadastros</p>
            <h1 id="supplier-registration-heading">
              {isEditing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}
            </h1>
          </div>
          <button
            type="button"
            className="supplier-dialog-close"
            aria-label="Fechar cadastro"
            onClick={closeModal}
          >
            ×
          </button>
        </header>

        <section className="panel-card supplier-form-card">
          <p className="supplier-form-intro">
            {isEditing
              ? 'Atualize os dados comerciais e o endereço do fornecedor.'
              : 'Informe os dados comerciais e o endereço do fornecedor.'}
          </p>

          {isEditing && !supplier && isLoadingSuppliers ? (
            <p className="supplier-list-state" role="status">
              Carregando dados do fornecedor...
            </p>
          ) : null}

          {isEditing && !supplier && !isLoadingSuppliers ? (
            <div className="message error" role="alert">
              Não foi possível encontrar este fornecedor na página atual da lista.
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

          {(!isEditing || supplier) ? (
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
      </div>
    </dialog>
  );
}
