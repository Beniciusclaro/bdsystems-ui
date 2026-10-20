import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaterialListPage } from './MaterialListPage';
import { getCategories, getMaterials } from '../services/materialService';
vi.mock('../services/materialService', () => ({
  getCategories: vi.fn(),
  getMaterials: vi.fn(),
  setMaterialStatus: vi.fn(),
}));
function renderPage() {
  render(
    <MemoryRouter initialEntries={['/materials']}>
      <Routes>
        <Route path="/materials" element={<MaterialListPage />}>
          <Route path="new" element={<p>Cadastro aberto</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCategories).mockResolvedValue([]);
});
const empty = { content: [], page: { number: 0, size: 10, totalElements: 0, totalPages: 0 } };
describe('MaterialListPage', () => {
  it('shows loading, an empty state and navigates to registration', async () => {
    let resolve!: (value: typeof empty) => void;
    vi.mocked(getMaterials).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderPage();
    expect(screen.getByText('Carregando materiais...')).toBeInTheDocument();
    resolve(empty);
    expect(await screen.findByText('Nenhum material cadastrado')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('link', { name: 'Novo material' })[0]);
    expect(screen.getByText('Cadastro aberto')).toBeInTheDocument();
  });
  it('applies combined filters on the server and distinguishes no results', async () => {
    vi.mocked(getMaterials).mockResolvedValue(empty);
    renderPage();
    await screen.findByText('Nenhum material cadastrado');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nome'), 'Cimento');
    await user.type(screen.getByLabelText('Código'), 'MAT');
    await user.selectOptions(screen.getByLabelText('Status'), 'false');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Nenhum material encontrado')).toBeInTheDocument();
    expect(getMaterials).toHaveBeenLastCalledWith(
      0,
      10,
      expect.objectContaining({ name: 'Cimento', code: 'MAT', active: false }),
    );
  });
  it('recovers from a failed request', async () => {
    vi.mocked(getMaterials)
      .mockRejectedValueOnce(new Error('Falha na API'))
      .mockResolvedValue(empty);
    renderPage();
    expect(await screen.findByText('Falha na API')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByText('Nenhum material cadastrado')).toBeInTheDocument());
  });
});
