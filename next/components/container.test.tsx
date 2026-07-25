import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { Container } from './container';

test('renders its children', () => {
  render(<Container>page content</Container>);
  expect(screen.getByText('page content')).toBeInTheDocument();
});

test('applies a caller-provided className to the wrapper', () => {
  const { container } = render(
    <Container className="custom-class">content</Container>
  );
  expect(container.firstChild).toHaveClass('custom-class');
});
