import { useState } from 'react';
import { FormField } from '../../../shared/components/ui/FormField';
import type { SupplierResponse } from '../../suppliers/types/supplier';
import type {
  Material,
  MaterialCategory,
  MaterialRequest,
  MaterialSupplier,
  UnitOfMeasure,
} from '../types/material';

interface Props {
  material?: Material;
  associations: MaterialSupplier[];
  categories: MaterialCategory[];
  units: UnitOfMeasure[];
  suppliers: SupplierResponse[];
  busy: boolean;
  onSubmit: (payload: MaterialRequest) => Promise<void>;
  onCancel: () => void;
  onManageCategories: () => void;
}
export function MaterialForm({
  material,
  associations,
  categories,
  units,
  suppliers,
  busy,
  onSubmit,
  onCancel,
  onManageCategories,
}: Props) {
  const [code, setCode] = useState(material?.code ?? '');

  const [name, setName] = useState(material?.name ?? '');

  const [description, setDescription] = useState(material?.description ?? '');

  const [categoryId, setCategoryId] = useState(material?.category?.id ?? '');

  const [unitId, setUnitId] = useState(material?.unitOfMeasure.id ?? '');

  const [active, setActive] = useState(material?.active ?? true);

  const [rows, setRows] = useState(() =>
    associations.map((row) => ({
      key: row.id,
      supplierId: row.supplierId,
      supplierCode: row.supplierCode ?? '',
      price: row.referencePrice == null ? '' : String(row.referencePrice),
    })),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateRow = (key: string, patch: Partial<(typeof rows)[number]>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  return (
    <form
      className="material-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const next: Record<string, string> = {};
        if (!code.trim()) next.code = 'Informe o código.';
        if (!name.trim()) next.name = 'Informe o nome.';
        if (!unitId) next.unit = 'Selecione a unidade.';
        rows.forEach((row) => {
          if (!row.supplierId) next[row.key] = 'Selecione um fornecedor.';
          else if (rows.filter((item) => item.supplierId === row.supplierId).length > 1)
            next[row.key] = 'Este fornecedor já foi selecionado.';
          else if (
            row.price !== '' &&
            (!Number.isFinite(Number(row.price)) ||
              Number(row.price) < 0 ||
              Number(row.price) > 9999999999.99 ||
              !/^\d+(\.\d{1,2})?$/.test(row.price))
          )
            next[row.key] = 'Informe um preço entre 0 e 9999999999,99 com até duas casas decimais.';
        });
        setErrors(next);
        if (Object.keys(next).length) return;
        await onSubmit({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          unitOfMeasureId: unitId,
          active,
          suppliers: rows.map((row) => ({
            supplierId: row.supplierId,
            supplierCode: row.supplierCode.trim(),
            referencePrice: row.price === '' ? null : Number(row.price),
          })),
        });
      }}
      noValidate
    >
      <fieldset disabled={busy} className="material-fields">
        <legend>Dados do material</legend>
        <div className="form-grid">
          <FormField label="Código">
            <input
              required
              maxLength={50}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? 'material-code-error' : undefined}
            />
            {errors.code && (
              <span id="material-code-error" role="alert">
                {errors.code}
              </span>
            )}
          </FormField>
          <FormField label="Nome">
            <input
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'material-name-error' : undefined}
            />
            {errors.name && (
              <span id="material-name-error" role="alert">
                {errors.name}
              </span>
            )}
          </FormField>
          <FormField label="Categoria" optional>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categories
                .filter((c) => c.active || c.id === categoryId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active ? ' (inativa)' : ''}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Unidade de medida">
            <select
              required
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              aria-invalid={!!errors.unit}
              aria-describedby={errors.unit ? 'material-unit-error' : undefined}
            >
              <option value="">Selecione uma unidade</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
            {errors.unit && (
              <span id="material-unit-error" role="alert">
                {errors.unit}
              </span>
            )}
          </FormField>
          <FormField label="Descrição" optional className="full-width">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </div>
        <button type="button" className="text-button" onClick={onManageCategories}>
          Gerenciar categorias
        </button>
        <label className="material-checkbox">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Ativo
        </label>
      </fieldset>
      <fieldset disabled={busy} className="material-fields">
        <legend>Fornecedores do material</legend>
        <p>Associe fornecedores a este material e informe os respectivos preços de referência.</p>
        {suppliers.length === 0 && (
          <p>Nenhum fornecedor cadastrado. Cadastre fornecedores no menu Fornecedores.</p>
        )}
        {rows.map((row, index) => (
          <div className="material-supplier-row" key={row.key}>
            <FormField label={`Fornecedor ${index + 1}`}>
              <select
                value={row.supplierId}
                onChange={(e) => updateRow(row.key, { supplierId: e.target.value })}
                aria-invalid={!!errors[row.key]}
                aria-describedby={errors[row.key] ? `supplier-error-${row.key}` : undefined}
              >
                <option value="">Selecione</option>
                {!suppliers.some((s) => s.id === row.supplierId) && row.supplierId && (
                  <option value={row.supplierId}>
                    {associations.find((a) => a.supplierId === row.supplierId)?.supplierName ??
                      'Fornecedor associado'}
                  </option>
                )}
                {suppliers.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={rows.some((r) => r.key !== row.key && r.supplierId === s.id)}
                  >
                    {s.tradeName || s.legalName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Código do fornecedor" optional>
              <input
                maxLength={100}
                value={row.supplierCode}
                onChange={(e) => updateRow(row.key, { supplierCode: e.target.value })}
              />
            </FormField>
            <FormField label="Preço de referência (EUR)" optional>
              <input
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={row.price}
                onChange={(e) => updateRow(row.key, { price: e.target.value })}
                aria-invalid={!!errors[row.key]}
                aria-describedby={errors[row.key] ? `supplier-error-${row.key}` : undefined}
              />
            </FormField>
            <button
              type="button"
              className="text-button"
              aria-label={`Remover fornecedor ${index + 1}`}
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              Remover
            </button>
            {errors[row.key] && (
              <p className="full-width" id={`supplier-error-${row.key}`} role="alert">
                {errors[row.key]}
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          className="secondary-button"
          disabled={!suppliers.length}
          onClick={() =>
            setRows((current) => [
              ...current,
              { key: crypto.randomUUID(), supplierId: '', supplierCode: '', price: '' },
            ])
          }
        >
          + Adicionar fornecedor
        </button>
      </fieldset>
      <div className="material-form-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" disabled={busy}>
          {busy ? 'Salvando...' : 'Salvar material'}
        </button>
      </div>
    </form>
  );
}
