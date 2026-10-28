import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AcceptInvitationForm } from './AcceptInvitationForm';

describe('AcceptInvitationForm', () => {
  it('validates confirmation and submits token with the password', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    render(<AcceptInvitationForm token="invite-token" isSubmitting={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nova senha'), 'abc');
    await user.type(screen.getByLabelText('Confirmar senha'), 'xyz');
    await user.click(screen.getByRole('button', { name: 'Definir senha' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Confirmar senha'));
    await user.type(screen.getByLabelText('Confirmar senha'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Definir senha' }));

    expect(onSubmit).toHaveBeenCalledWith({ token: 'invite-token', password: 'abc' });
  });
});
