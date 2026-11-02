import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

describe('Card', () => {
  // feliz
  it('renders every part with its slot', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Faturamento</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
          <CardAction>
            <button type="button">Ver</button>
          </CardAction>
        </CardHeader>
        <CardContent>R$ 12.000</CardContent>
        <CardFooter>Atualizado hoje</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    expect(screen.getByText('Faturamento')).toHaveAttribute('data-slot', 'card-title');
    expect(screen.getByText('Últimos 30 dias')).toHaveAttribute('data-slot', 'card-description');
    expect(screen.getByRole('button', { name: 'Ver' }).parentElement).toHaveAttribute(
      'data-slot',
      'card-action',
    );
    expect(screen.getByText('R$ 12.000')).toHaveAttribute('data-slot', 'card-content');
    expect(screen.getByText('Atualizado hoje')).toHaveAttribute('data-slot', 'card-footer');
  });

  // triste
  it('keeps the extra class next to its own', () => {
    render(<Card className="mt-4">x</Card>);

    expect(screen.getByText('x').className).toContain('mt-4');
    expect(screen.getByText('x').className).toContain('bg-card');
  });
});
