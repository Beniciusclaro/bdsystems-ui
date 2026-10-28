import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AcceptInvitationForm } from './AcceptInvitationForm';

describe('AcceptInvitationForm', () => {
  it('validates confirmation and submits token with the password', async () => {
    const user = userEvent.setup();

    const onSubmit = vi.fn();

    render(<AcceptInvitationForm token="invite-token" isSubmitting={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nova senha'), 'abcdefgh');
    await user.type(screen.getByLabelText('Confirmar senha'), 'abcdefghx');
    await user.click(screen.getByRole('button', { name: 'Definir senha' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Confirmar senha'));
    await user.type(screen.getByLabelText('Confirmar senha'), 'abcdefgh');
    await user.click(screen.getByRole('button', { name: 'Definir senha' }));

    expect(onSubmit).toHaveBeenCalledWith({ token: 'invite-token', password: 'abcdefgh' });
  });

  it('requires at least eight characters', () => {
    render(<AcceptInvitationForm token="invite-token" isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('minLength', '8');
    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute('minLength', '8');
  });
});
