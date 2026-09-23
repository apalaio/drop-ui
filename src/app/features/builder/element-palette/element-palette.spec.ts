import { render, screen } from '@testing-library/angular';
import { ElementPalette } from './element-palette';

describe('ElementPalette', () => {
  it('renders the elements heading', async () => {
    await render(ElementPalette);

    expect(screen.getByRole('heading', { name: 'Elements' })).toBeTruthy();
  });
});
