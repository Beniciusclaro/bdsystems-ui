import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegistrationDialog } from './RegistrationDialog';

describe('RegistrationDialog', () => {
  it('labels the dialog and asks to close it from the close button and Escape', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <RegistrationDialog
        open
        kind="tool"
        eyebrow="Cadastros"
        title="Nova ferramenta"
        onOpenChange={onOpenChange}
      >
        <p>Campos</p>
      </RegistrationDialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Nova ferramenta' });
    expect(dialog).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Fechar cadastro' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    const cancelEvent = new Event('cancel', { bubbles: true, cancelable: true });
    fireEvent(dialog, cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(false);
    fireEvent(dialog, new Event('close'));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
});
