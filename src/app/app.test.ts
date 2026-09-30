import { render, screen } from '@testing-library/angular';
import { App } from './app';

describe(App.name, () => {
  it('should render the builder shell', async () => {
    await render(App);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
