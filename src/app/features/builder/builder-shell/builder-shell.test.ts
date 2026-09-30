import { render, screen, within } from '@testing-library/angular';
import { BuilderShell } from './builder-shell';

describe(BuilderShell.name, () => {
  beforeEach(async () => render(BuilderShell));

  it('should place the palette in the sidebar', () => {
    const sidebar = screen.getByRole('complementary', { name: 'Element palette' });

    expect(within(sidebar).getByRole('heading', { name: 'Elements' })).toBeInTheDocument();
  });

  it('should place the canvas in the main area', () => {
    expect(within(screen.getByRole('main')).getByRole('region', { name: 'Canvas' })).toBeInTheDocument();
  });
});
