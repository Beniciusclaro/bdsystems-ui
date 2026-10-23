import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { getProject, saveProject } from '../services/planningService';
import type { Project } from '../types/planning';
import './Planning.scss';

export function ProjectRegistrationPage() {
  const { projectId } = useParams();

  const navigate = useNavigate();

  const { refreshProjects, notify } = useOutletContext<{
    refreshProjects: () => void;
    notify: (message: string) => void;
  }>();

  const [project, setProject] = useState<Project | null>(null);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState(false);

  const saving = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then(setProject)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a obra.'),
      )
      .finally(() => setLoading(false));
  }, [projectId]);

  const close = () => {
    if (!saving.current) navigate('/projects', { replace: true });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || saving.current) return;
    saving.current = true;
    setPending(true);
    setError('');
    try {
      await saveProject(
        {
          clientId: project.clientId,
          code: project.code,
          name: project.name,
          description: project.description,
          street: project.street,
          city: project.city,
          state: project.state,
          zipCode: project.zipCode,
          plannedStartDate: project.plannedStartDate,
          plannedEndDate: project.plannedEndDate,
          status: project.status,
          active: project.active,
        },
        project.id,
      );
      refreshProjects();
      notify('Obra atualizada com sucesso.');
      navigate('/projects', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a obra.');
    } finally {
      saving.current = false;
      setPending(false);
    }
  };

  return (
    <RegistrationDialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      kind="project"
      eyebrow="Planeamento"
      title="Editar obra"
      isSubmitting={pending}
    >
      {loading ? (
        <ContentState variant="loading" title="Carregando obra..." />
      ) : !project ? (
        <ContentState variant="error" title={error || 'Obra não encontrada'} />
      ) : (
        <form className="planning-form planning-sectioned-form" onSubmit={submit}>
          {error ? (
            <p role="alert" className="message error">
              {error}
            </p>
          ) : null}
          <fieldset className="planning-form-section">
            <legend>Identificação da obra</legend>
            <div className="planning-form-grid planning-form-grid--two">
              <label>
                Código
                <input value={project.code} readOnly />
              </label>
              <label>
                Cliente
                <input value={project.clientName} readOnly />
              </label>
              <label>
                Nome
                <input
                  required
                  value={project.name}
                  onChange={(event) => setProject({ ...project, name: event.target.value })}
                />
              </label>
              <label className="planning-field--full">
                Descrição
                <textarea
                  rows={3}
                  value={project.description ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, description: event.target.value || null })
                  }
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="planning-form-section">
            <legend>Localização</legend>
            <div className="planning-form-grid">
              <label className="planning-field--full">
                Morada
                <input
                  value={project.street ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, street: event.target.value || null })
                  }
                />
              </label>
              <label>
                Cidade
                <input
                  value={project.city ?? ''}
                  onChange={(event) => setProject({ ...project, city: event.target.value || null })}
                />
              </label>
              <label>
                Estado
                <input
                  value={project.state ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, state: event.target.value || null })
                  }
                />
              </label>
              <label>
                Código postal
                <input
                  value={project.zipCode ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, zipCode: event.target.value || null })
                  }
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="planning-form-section">
            <legend>Planeamento e situação</legend>
            <div className="planning-form-grid planning-form-grid--two">
              <label>
                Início planeado
                <input
                  type="date"
                  value={project.plannedStartDate ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, plannedStartDate: event.target.value || null })
                  }
                />
              </label>
              <label>
                Fim planeado
                <input
                  type="date"
                  min={project.plannedStartDate ?? undefined}
                  value={project.plannedEndDate ?? ''}
                  onChange={(event) =>
                    setProject({ ...project, plannedEndDate: event.target.value || null })
                  }
                />
              </label>
              <label>
                Fase
                <select
                  value={project.status}
                  onChange={(event) =>
                    setProject({ ...project, status: event.target.value as Project['status'] })
                  }
                >
                  <option value="PLANNING">Planeamento</option>
                  <option value="ACTIVE">Em execução</option>
                  <option value="ON_HOLD">Pausada</option>
                  <option value="COMPLETED">Concluída</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </label>
              <label className="planning-checkbox">
                <input
                  type="checkbox"
                  checked={project.active}
                  onChange={(event) => setProject({ ...project, active: event.target.checked })}
                />
                Obra ativa
              </label>
            </div>
          </fieldset>

          <div className="planning-actions planning-form-footer">
            <button type="button" onClick={close} disabled={pending}>
              Cancelar
            </button>
            <button className="primary-button" disabled={pending}>
              {pending ? 'A guardar...' : 'Salvar obra'}
            </button>
          </div>
        </form>
      )}
    </RegistrationDialog>
  );
}
