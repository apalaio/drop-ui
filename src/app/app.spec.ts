import { render, screen } from '@testing-library/angular';
import { App } from './app';

describe('App', () => {
  it('renders the builder shell', async () => {
    await render(App);

    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByText('DropUI')).toBeTruthy();
  });
});
