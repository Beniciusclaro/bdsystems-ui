import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './themeContext';

function ThemeProbe() {
  const { mode, resolvedTheme, toggleTheme } = useTheme();

  return (
    <div>
      <span>{`${mode}:${resolvedTheme}`}</span>
      <button type="button" onClick={toggleTheme}>
        Alternar tema
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('uses the stored theme and persists a manual toggle', async () => {
    localStorage.setItem('builder-ui:theme', 'dark');

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('dark:dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    await userEvent.click(screen.getByRole('button', { name: 'Alternar tema' }));

    expect(screen.getByText('light:light')).toBeInTheDocument();
    expect(localStorage.getItem('builder-ui:theme')).toBe('light');
  });
});
