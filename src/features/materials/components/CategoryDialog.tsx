import { useState } from 'react';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { FormField } from '../../../shared/components/ui/FormField';
import { saveCategory } from '../services/materialService';
import type { MaterialCategory } from '../types/material';
export function CategoryDialog({
  categories,
  onSaved,
  onClose,
}: {
  categories: MaterialCategory[];
  onSaved: (category: MaterialCategory) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState('');

  const [name, setName] = useState('');

  const [description, setDescription] = useState('');

  const [active, setActive] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');
  return (
    <DetailsDialog
      open
      heading="Gerenciar categorias"
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <form
        className="material-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (!name.trim()) {
            setError('Informe o nome da categoria.');
            return;
          }
          setBusy(true);
          setError('');
          setSuccess('');
          try {
            const category = await saveCategory(id || undefined, {
              name: name.trim(),
              description: description.trim(),
              active,
            });
            onSaved(category);
            setId(category.id);
            setSuccess('Categoria salva com sucesso.');
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : 'Não foi possível salvar a categoria.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && (
          <p role="alert" className="message error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="message success">
            {success}
          </p>
        )}
        <FormField label="Categoria">
          <select
            disabled={busy}
            value={id}
            onChange={(e) => {
              const category = categories.find((c) => c.id === e.target.value);
              setId(e.target.value);
              setName(category?.name ?? '');
              setDescription(category?.description ?? '');
              setActive(category?.active ?? true);
              setSuccess('');
            }}
          >
            <option value="">Nova categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Nome">
          <input
            disabled={busy}
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Descrição" optional>
          <textarea
            disabled={busy}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <label className="material-checkbox">
          <input
            disabled={busy}
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Ativa
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? 'Salvando...' : 'Salvar categoria'}
        </button>
      </form>
    </DetailsDialog>
  );
}
