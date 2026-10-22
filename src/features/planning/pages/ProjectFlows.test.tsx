import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectListPage } from './ProjectListPage';
import { ProjectRegistrationPage } from './ProjectRegistrationPage';
import * as service from '../services/planningService';
import type { Project } from '../types/planning';

vi.mock('../services/planningService', () => ({
  getProjects: vi.fn(),
  getProject: vi.fn(),
  saveProject: vi.fn(),
}));

const project: Project = {
  id: 'project-1',
  clientId: 'client-1',
  clientName: 'Cliente Um',
  code: 'OBR-1',
  name: 'Casa Azul',
  description: 'Renovação',
  street: 'Rua A',
  city: 'Lisboa',
  state: 'Lisboa',
  zipCode: '1000-001',
  plannedStartDate: null,
  plannedEndDate: null,
  status: 'PLANNING',
  active: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getProjects).mockResolvedValue([project]);
  vi.mocked(service.getProject).mockResolvedValue(project);
  vi.mocked(service.saveProject).mockResolvedValue(project);
});

describe('project flows', () => {
  it('opens project details from the row and has no manual registration', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProjectListPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('row', { name: 'Abrir detalhes de Casa Azul' }));
    expect(within(screen.getByRole('dialog')).getByText('Planeamento')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Nova obra/i })).not.toBeInTheDocument();
  });

  it('edits operational data while keeping code and client read-only', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/projects/project-1/edit']}>
        <Routes>
          <Route path="/projects" element={<ProjectListPage />}>
            <Route path=":projectId/edit" element={<ProjectRegistrationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Código')).toHaveAttribute('readonly');
    expect(within(dialog).getByLabelText('Cliente')).toHaveAttribute('readonly');
    await user.selectOptions(within(dialog).getByLabelText('Fase'), 'ACTIVE');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar obra' }));
    expect(service.saveProject).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', code: 'OBR-1', clientId: 'client-1' }),
      'project-1',
    );
  });
});
