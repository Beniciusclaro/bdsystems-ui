import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmployeeForm } from './EmployeeForm';

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome completo'), 'Ana Silva');
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Telefone'), '912345678');
  await user.type(screen.getByLabelText('Rua e número'), 'Rua Central, 1');
  await user.type(screen.getByLabelText('Cidade'), 'Lisboa');
  await user.type(screen.getByLabelText('Estado'), 'Lisboa');
  await user.type(screen.getByLabelText('CEP'), '1000-001');
  await user.click(screen.getByRole('tab', { name: 'Dados profissionais' }));
  await user.type(screen.getByLabelText('Matrícula'), 'EMP-1');
  await user.type(screen.getByLabelText('Cargo'), 'Engenheira');
  await user.type(screen.getByLabelText('Departamento'), 'Obras');
  await user.type(screen.getByLabelText('Data de admissão'), '2026-10-20');
  await user.selectOptions(screen.getByLabelText('Forma de pagamento'), 'MONTHLY');
  await user.type(screen.getByLabelText('Valor (R$)'), '3500');
}

describe('EmployeeForm user access', () => {
  it('omits userRole when system access is not selected', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    render(<EmployeeForm isSubmitting={false} allowUserAccess onSubmit={onSubmit} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar funcionário' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ userRole: expect.anything() }),
    );
  });

  it('defaults to USER and submits the selected role', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    render(<EmployeeForm isSubmitting={false} allowUserAccess onSubmit={onSubmit} />);
    await fillRequiredFields(user);
    await user.click(screen.getByLabelText('Criar usuário do sistema'));

    expect(screen.getByLabelText('Perfil de acesso')).toHaveValue('USER');
    await user.selectOptions(screen.getByLabelText('Perfil de acesso'), 'ADMIN');
    await user.click(screen.getByRole('button', { name: 'Cadastrar funcionário' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ userRole: 'ADMIN' }));
  });

  it('does not offer user creation while editing', () => {
    render(<EmployeeForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText('Criar usuário do sistema')).not.toBeInTheDocument();
  });
});
