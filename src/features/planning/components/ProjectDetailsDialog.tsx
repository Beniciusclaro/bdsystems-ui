import { DetailList } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import type { Project } from '../types/planning';
import { projectStatusLabel, projectStatusTone } from '../presentation';

interface ProjectDetailsDialogProps {
  project: Project;
  onClose: () => void;
}

export function ProjectDetailsDialog({ project, onClose }: ProjectDetailsDialogProps) {
  return (
    <DetailsDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Obra"
      heading={`${project.code} · ${project.name}`}
    >
      <DetailList
        items={[
          { key: 'client', label: 'Cliente', value: project.clientName },
          {
            key: 'status',
            label: 'Fase atual',
            value: (
              <StatusBadge tone={projectStatusTone[project.status]}>
                {projectStatusLabel[project.status]}
              </StatusBadge>
            ),
          },
          { key: 'start', label: 'Início planeado', value: formatDate(project.plannedStartDate) },
          { key: 'end', label: 'Fim planeado', value: formatDate(project.plannedEndDate) },
          { key: 'address', label: 'Morada', value: project.street, wide: true },
          {
            key: 'location',
            label: 'Localidade',
            value: [project.zipCode, project.city, project.state].filter(Boolean).join(' · '),
            wide: true,
          },
          { key: 'description', label: 'Descrição', value: project.description, wide: true },
          { key: 'active', label: 'Situação', value: project.active ? 'Ativa' : 'Inativa' },
        ]}
      />
    </DetailsDialog>
  );
}

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('pt-PT').format(new Date(`${value}T00:00:00`)) : '—';
