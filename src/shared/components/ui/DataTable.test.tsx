import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

const rows = [{ id: 'a', name: 'Furadeira' }];

describe('DataTable', () => {
  it('activates a row by keyboard without activating nested controls', async () => {
    const onRowActivate = vi.fn();
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: 'Nome', mobileLabel: 'Nome', renderCell: (row) => row.name },
          {
            key: 'action',
            header: 'Ação',
            mobileLabel: 'Ação',
            renderCell: () => <button onClick={onAction}>Editar</button>,
          },
        ]}
        getRowKey={(row) => row.id}
        onRowActivate={onRowActivate}
        ariaLabel="Ferramentas"
      />,
    );
    const row = screen.getByRole('row', { name: /Furadeira/ });
    row.focus();
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowActivate).toHaveBeenCalledWith(rows[0]);
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onRowActivate).toHaveBeenCalledOnce();
  });
});
