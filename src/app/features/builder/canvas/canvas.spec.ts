import { render, screen } from '@testing-library/angular';
import { Canvas } from './canvas';

describe('Canvas', () => {
  it('renders an empty canvas region with a drop hint', async () => {
    await render(Canvas);

    expect(screen.getByRole('region', { name: 'Canvas' })).toBeTruthy();
    expect(screen.getByText('Drop elements here')).toBeTruthy();
  });
});
