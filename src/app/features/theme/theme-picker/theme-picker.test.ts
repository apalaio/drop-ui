import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { DEFAULT_THEME, THEMES } from '../state/theme-store';
import { ThemePicker } from './theme-picker';

describe(ThemePicker.name, () => {
  const triggerLabel = 'Change theme';
  const otherTheme = 'dracula';

  function openList(): void {
    fireEvent.click(screen.getByRole('button', { name: triggerLabel }));
  }

  beforeEach(async () => render(ThemePicker));

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('should apply the starting theme to the whole document', async () => {
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', DEFAULT_THEME),
    );
  });

  describe('before the button is clicked', () => {
    it('should not render the theme list', () => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should not render any theme', () => {
      expect(screen.queryAllByRole('menuitemradio').length).toBe(0);
    });
  });

  describe('when the button is clicked', () => {
    beforeEach(() => openList());

    it('should render the theme list', async () => {
      expect(await screen.findByRole('menu', { name: 'Themes' })).toBeInTheDocument();
    });

    it('should list every daisyUI theme', async () => {
      const themes = (await screen.findAllByRole('menuitemradio')).map((theme) =>
        theme.textContent?.trim(),
      );

      expect(themes).toEqual(THEMES);
    });

    it('should mark the current theme as checked', async () => {
      expect(await screen.findByRole('menuitemradio', { name: DEFAULT_THEME })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should mark only the current theme as checked', async () => {
      await screen.findByRole('menu');

      expect(screen.getAllByRole('menuitemradio', { checked: true }).length).toBe(1);
    });

    it('should focus the current theme', async () => {
      const current = await screen.findByRole('menuitemradio', { name: DEFAULT_THEME });

      await waitFor(() => expect(current).toHaveFocus());
    });
  });

  describe('when a theme is picked', () => {
    beforeEach(async () => {
      openList();
      fireEvent.click(await screen.findByRole('menuitemradio', { name: otherTheme }));
    });

    it('should apply the theme to the whole document', async () => {
      await waitFor(() =>
        expect(document.documentElement).toHaveAttribute('data-theme', otherTheme),
      );
    });

    it('should close the theme list', async () => {
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('should mark the picked theme as checked when the list is reopened', async () => {
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      openList();

      expect(await screen.findByRole('menuitemradio', { name: otherTheme })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should no longer mark the previous theme as checked when the list is reopened', async () => {
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      openList();

      expect(await screen.findByRole('menuitemradio', { name: DEFAULT_THEME })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  });
});
