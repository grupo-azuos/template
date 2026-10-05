import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosReportExportActions } from './azuos-report-export-actions.component';

describe('AzuosReportExportActions', () => {
  // feliz
  it('offers the three formats an office person expects', () => {
    render(
      <AzuosReportExportActions
        state={{ exportingFormat: null }}
        actions={{ onExport: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Excel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeInTheDocument();
  });

  it('reports the format that was asked for', async () => {
    const onExport = vi.fn();
    render(<AzuosReportExportActions state={{ exportingFormat: null }} actions={{ onExport }} />);

    await userEvent.click(screen.getByRole('button', { name: 'PDF' }));

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('accepts a different list of formats', () => {
    render(
      <AzuosReportExportActions
        data={{ formats: [{ value: 'csv', label: 'CSV' }] }}
        state={{ exportingFormat: null }}
        actions={{ onExport: vi.fn() }}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  // triste
  /* Dois downloads simultâneos montam o relatório duas vezes no servidor, e a segunda resposta
     costuma chegar como tempo esgotado — num relatório que tinha dado certo. */
  it('blocks the other formats while one is downloading', () => {
    render(
      <AzuosReportExportActions
        state={{ exportingFormat: 'xlsx' }}
        actions={{ onExport: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Word' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeDisabled();
  });

  it('blocks a second click on the format that is already downloading', () => {
    render(
      <AzuosReportExportActions
        state={{ exportingFormat: 'xlsx' }}
        actions={{ onExport: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Baixando…' })).toBeDisabled();
  });
});
