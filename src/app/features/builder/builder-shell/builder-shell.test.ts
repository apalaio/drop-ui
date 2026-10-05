import { render, screen, within } from '@testing-library/angular';
import { BuilderShell } from './builder-shell';

describe(BuilderShell.name, () => {
  beforeEach(async () => render(BuilderShell));

  it('should place the theme picker in the header', () => {
    const header = screen.getByRole('banner');

    expect(within(header).getByRole('button', { name: 'Change theme' })).toBeInTheDocument();
  });

  it('should place the palette in the sidebar', () => {
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });

    expect(within(sidebar).getByRole('heading', { name: 'Elements' })).toBeInTheDocument();
  });

  it('should place the layout panel above the palette in the sidebar', () => {
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    const headings = within(sidebar)
      .getAllByRole('heading')
      .map((heading) => heading.textContent?.trim());

    expect(headings).toEqual(['Layout', 'Elements']);
  });

  it('should place the grid rows and columns inputs in the sidebar', () => {
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    const inputs = within(sidebar)
      .getAllByRole('spinbutton')
      .map((input) => input.getAttribute('aria-label'));

    expect(inputs).toEqual(['Grid rows', 'Grid columns']);
  });

  it('should place the canvas in the main area', () => {
    expect(within(screen.getByRole('main')).getByRole('region', { name: 'Canvas' })).toBeInTheDocument();
  });
});
