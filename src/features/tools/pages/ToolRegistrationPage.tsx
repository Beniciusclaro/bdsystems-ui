import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ToolForm } from '../components/ToolForm';
import { ToolRentalDetailsDialog } from '../../rentals/components/ToolRentalDetailsDialog';
import { ToolRentalForm } from '../../rentals/components/ToolRentalForm';
import { getAllSuppliers } from '../../suppliers/services/supplierService';
import { createToolRental, getToolRentals } from '../../rentals/services/toolRentalService';
import { createTool, getTool, updateTool } from '../services/toolService';
import type { SupplierResponse } from '../../suppliers/types/supplier';
import type { ToolRequest, ToolResponse } from '../types/tool';
import {
  EMPTY_TOOL_RENTAL_DRAFT,
  type ToolRentalDraft,
  type ToolRentalResponse,
} from '../../rentals/types/toolRental';
import './ToolRegistrationPage.scss';

interface ToolListOutletContext {
  refreshTools: () => void;
  refreshRentalData: () => void;
  tools: ToolResponse[];
  isLoading: boolean;
}

export function ToolRegistrationPage() {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const { refreshTools, refreshRentalData, tools, isLoading: isLoadingTools } =
    useOutletContext<ToolListOutletContext>();
  const toolInList = toolId ? tools.find((item) => item.id === toolId) : undefined;
  const [loadedTool, setLoadedTool] = useState<ToolResponse | null>(null);
  const tool = toolInList ?? loadedTool;
  const [createdTool, setCreatedTool] = useState<ToolResponse | null>(null);
  const isEditing = Boolean(toolId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addRentalAfterSave, setAddRentalAfterSave] = useState(false);
  const [rentalDraft, setRentalDraft] = useState<ToolRentalDraft>(EMPTY_TOOL_RENTAL_DRAFT);
  const [rentalRecords, setRentalRecords] = useState<ToolRentalResponse[] | null>(null);
  const [rentalError, setRentalError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierResponse[] | null>(null);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const pendingSuppliersRef = useRef<Promise<SupplierResponse[]> | null>(null);
  const rentalTool = isEditing ? tool : createdTool;
  const isLoadingRentals = Boolean(rentalTool && rentalRecords === null && !rentalError);
  const isLoadingTool = isEditing && !tool && !error;

  useEffect(() => {
    if (!toolId || toolInList || isLoadingTools) {
      return;
    }

    let ignore = false;
    getTool(toolId)
      .then((result) => {
        if (!ignore) {
          setLoadedTool(result);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar os dados da ferramenta.',
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [isLoadingTools, toolId, toolInList]);

  useEffect(() => {
    if (!rentalTool || rentalRecords !== null) {
      return;
    }

    let ignore = false;
    getToolRentals(rentalTool.id)
      .then((result) => {
        if (!ignore) {
          setRentalRecords(result);
          setRentalError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setRentalError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar os registos de aluguer desta ferramenta.',
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [rentalRecords, rentalTool]);

  const loadSuppliers = useCallback(async () => {
    if (suppliers !== null) {
      return;
    }

    setSupplierError(null);
    setIsLoadingSuppliers(true);
    const request = pendingSuppliersRef.current ?? getAllSuppliers();
    pendingSuppliersRef.current = request;

    try {
      setSuppliers(await request);
    } catch (requestError: unknown) {
      setSupplierError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar os fornecedores.',
      );
    } finally {
      if (pendingSuppliersRef.current === request) {
        pendingSuppliersRef.current = null;
      }
      setIsLoadingSuppliers(false);
    }
  }, [suppliers]);

  const refreshRentals = () => {
    setRentalError(null);
    setRentalRecords(null);
    refreshRentalData();
  };

  const closeModal = () => {
    navigate('/tools', { replace: true });
  };

  const handleSubmit = async (payload: ToolRequest) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (toolId) {
        await updateTool(toolId, payload);
        setSuccess('Ferramenta atualizada com sucesso.');
      } else {
        const created = await createTool(payload);
        setCreatedTool(created);
        if (addRentalAfterSave) {
          setRentalRecords([]);
          refreshTools();
          try {
            await createToolRental({
              toolId: created.id,
              supplierId: rentalDraft.supplierId,
              price: Number(rentalDraft.price),
              rentalPeriod: rentalDraft.rentalPeriod,
              rentalStartDate: rentalDraft.rentalStartDate || null,
              rentalEndDate: rentalDraft.rentalEndDate || null,
            });
            setRentalRecords(null);
            setSuccess('Ferramenta e registo de aluguer cadastrados com sucesso.');
          } catch (rentalRequestError: unknown) {
            setError(
              `A ferramenta foi cadastrada, mas não foi possível criar o registo de aluguer. ${
                rentalRequestError instanceof Error
                  ? rentalRequestError.message
                  : 'Tente cadastrar o aluguer novamente.'
              }`,
            );
          }
        } else {
          setSuccess('Ferramenta cadastrada com sucesso.');
        }
      }
      if (toolId || !addRentalAfterSave) {
        refreshTools();
      }
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isEditing
            ? 'Não foi possível atualizar a ferramenta.'
            : 'Não foi possível cadastrar a ferramenta.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationDialog
      open
      kind="tool"
      eyebrow="Cadastros"
      title={isEditing ? 'Editar ferramenta' : 'Cadastrar ferramenta'}
      onOpenChange={(open) => { if (!open) closeModal(); }}
    >
        <section className="panel-card tool-form-card">
          <p className="tool-form-intro">
            {isEditing
              ? 'Atualize o código e o nome da ferramenta.'
              : 'Informe o código e o nome para cadastrar uma ferramenta ativa.'}
          </p>

          {isEditing && isLoadingTool ? (
            <p className="tool-list-state" role="status">Carregando dados da ferramenta...</p>
          ) : null}
          {error ? <div className="message error" role="alert">{error}</div> : null}
          {success ? <div className="message success" role="status">{success}</div> : null}

          {((!isEditing && !createdTool) || (isEditing && tool)) ? (
            <ToolForm
              key={toolId ?? 'new'}
              initialValues={tool ?? undefined}
              showRentalOption={!isEditing}
              addRental={addRentalAfterSave}
              onAddRentalChange={(enabled) => {
                setAddRentalAfterSave(enabled);
                if (enabled) {
                  void loadSuppliers();
                }
              }}
              isSubmitting={isSubmitting}
              submitDisabled={
                (addRentalAfterSave &&
                  (isLoadingSuppliers ||
                    supplierError !== null ||
                    !suppliers ||
                    !suppliers.some((supplier) => supplier.active)))
              }
              submitLabel={
                isEditing
                  ? 'Atualizar ferramenta'
                  : addRentalAfterSave
                    ? 'Cadastrar ferramenta e aluguer'
                    : 'Cadastrar ferramenta'
              }
              submittingLabel={isEditing ? 'Atualizando...' : 'Cadastrando...'}
              onSubmit={handleSubmit}
            >
              {addRentalAfterSave ? (
                <fieldset className="tool-rental-draft">
                  <legend>Dados do aluguer</legend>
                  {isLoadingSuppliers ? (
                    <p className="tool-field-hint" role="status">Carregando fornecedores...</p>
                  ) : supplierError ? (
                    <p className="message error" role="alert">
                      {supplierError}{' '}
                      <button type="button" className="text-button" onClick={() => void loadSuppliers()}>
                        Tentar novamente
                      </button>
                    </p>
                  ) : suppliers ? (
                    <ToolRentalForm
                      fieldsOnly
                      suppliers={suppliers}
                      initialValues={rentalDraft}
                      isSubmitting={isSubmitting}
                      submitLabel=""
                      submittingLabel=""
                      onDraftChange={setRentalDraft}
                    />
                  ) : null}
                </fieldset>
              ) : null}
            </ToolForm>
          ) : null}

          {rentalTool && (isEditing || addRentalAfterSave) ? (
            <ToolRentalDetailsDialog
              embedded
              tool={rentalTool}
              open
              rentals={rentalRecords ?? []}
              isLoadingRentals={isLoadingRentals}
              rentalError={rentalError}
              onRetryRentals={refreshRentals}
              suppliers={suppliers}
              isLoadingSuppliers={isLoadingSuppliers}
              supplierError={supplierError}
              onLoadSuppliers={() => void loadSuppliers()}
              onRentalDataChanged={refreshRentals}
              onOpenChange={() => {}}
            />
          ) : null}
        </section>
    </RegistrationDialog>
  );
}
