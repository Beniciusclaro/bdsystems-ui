import { useEffect, useState } from 'react';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { getMaterialSuppliers } from '../services/materialService';
import type { Material, MaterialSupplier } from '../types/material';
const money = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export function MaterialDetailsDialog({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<MaterialSupplier[] | null>(null);

  const [error, setError] = useState('');

  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    getMaterialSuppliers(material.id)
      .then((result) => {
        if (current) setRows(result);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os fornecedores.',
          );
      });
    return () => {
      current = false;
    };
  }, [material.id, revision]);
  return (
    <DetailsDialog
      open
      heading={material.name}
      eyebrow={material.code}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div className="material-form">
        <p>{material.description || 'Sem descrição.'}</p>
        <p>
          Categoria: {material.category?.name ?? 'Sem categoria'} · Unidade:{' '}
          {material.unitOfMeasure.name} ({material.unitOfMeasure.symbol}) ·{' '}
          {material.active ? 'Ativo' : 'Inativo'}
        </p>
        <h3>Fornecedores do material</h3>
        {error ? (
          <div role="alert" className="message error">
            {error}
            <button
              className="text-button"
              onClick={() => {
                setError('');
                setRevision((r) => r + 1);
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : rows === null ? (
          <p role="status">Carregando fornecedores...</p>
        ) : rows.length === 0 ? (
          <p>Nenhum fornecedor associado.</p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                {row.supplierName} · {row.supplierCode || 'Sem código'} ·{' '}
                {row.referencePrice == null
                  ? 'Preço não informado'
                  : money.format(row.referencePrice)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DetailsDialog>
  );
}
