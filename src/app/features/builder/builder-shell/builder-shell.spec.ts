import { render, screen, within } from '@testing-library/angular';
import { BuilderShell } from './builder-shell';

describe('BuilderShell', () => {
  it('renders the header, palette sidebar and main area landmarks', async () => {
    await render(BuilderShell);

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Element palette' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('places the palette in the sidebar and the canvas in the main area', async () => {
    await render(BuilderShell);

    const sidebar = screen.getByRole('complementary', { name: 'Element palette' });
    const main = screen.getByRole('main');

    expect(within(sidebar).getByRole('heading', { name: 'Elements' })).toBeTruthy();
    expect(within(main).getByRole('region', { name: 'Canvas' })).toBeTruthy();
  });
});
