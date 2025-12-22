import React from 'react';
import { render } from '@testing-library/react';

// Simple test component to verify React setup
const TestComponent: React.FC = () => {
  return <div data-testid="test-component">React Frontend Setup Complete</div>;
};

test('renders test component', () => {
  const { getByTestId } = render(<TestComponent />);
  expect(getByTestId('test-component')).toBeInTheDocument();
});

test('React environment is working', () => {
  expect(React.version).toBeDefined();
});
