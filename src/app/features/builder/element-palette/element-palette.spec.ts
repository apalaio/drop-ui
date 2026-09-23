import { render, screen } from '@testing-library/angular';
import { ElementPalette } from './element-palette';

describe('ElementPalette', () => {
  it('renders the elements heading', async () => {
    await render(ElementPalette);

    expect(screen.getByRole('heading', { name: 'Elements' })).toBeTruthy();
  });

  it('renders the palette as a drop zone', async () => {
    await render(ElementPalette);

    expect(screen.getByRole('list').classList).toContain('cdk-drop-list');
  });

  it('renders a draggable div item tagged with its uid', async () => {
    await render(ElementPalette);

    const [item] = screen.getAllByRole('listitem');

    expect(item.textContent).toContain('Div');
    expect(item.classList).toContain('cdk-drag');
    expect(item.dataset['uid']).toBeTruthy();
  });
});
