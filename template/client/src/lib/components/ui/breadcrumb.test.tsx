import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';

describe('Breadcrumb', () => {
  // feliz
  it('renders the trail with links, an ellipsis and the current page', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#inicio">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button">Clientes</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Ana</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clientes' })).toHaveAttribute('data-slot', 'breadcrumb-link');
    expect(screen.getByText('Ana')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="breadcrumb-ellipsis"]')).toHaveTextContent('More');
  });

  // triste
  it('hides the separators from the screen reader', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(document.querySelector('[data-slot="breadcrumb-separator"]')).toHaveAttribute('aria-hidden', 'true');
  });
});
