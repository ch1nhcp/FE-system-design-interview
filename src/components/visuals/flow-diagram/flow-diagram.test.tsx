import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FlowDiagram } from './flow-diagram';

const steps = [
  { title: 'Action', note: 'What happened' },
  { title: 'Dispatcher' },
  { title: 'Store', note: 'Holds the state' },
];

describe('FlowDiagram', () => {
  it('lists the steps in order under an accessible name', () => {
    render(<FlowDiagram label="Flux data flow" steps={steps} />);

    const figure = screen.getByRole('figure', { name: 'Flux data flow' });
    const items = within(figure).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'ActionWhat happened',
      'Dispatcher',
      'StoreHolds the state',
    ]);
  });

  it('describes the loop back to the first step', () => {
    render(<FlowDiagram label="Flux data flow" steps={steps} loop="Views dispatch new actions" />);

    expect(screen.getByText('Views dispatch new actions')).toBeInTheDocument();
  });

  it('emphasizes the highlighted step', () => {
    render(<FlowDiagram label="Flux data flow" steps={steps} highlight={1} />);

    expect(screen.getByText('Dispatcher').parentElement).toHaveClass('bg-foreground');
    expect(screen.getByText('Action').parentElement).toHaveClass('bg-muted');
  });
});
