import { render, screen } from '@testing-library/react';
import { Paperclip } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { AzuosFileLinks } from './azuos-file-links.component';

const FILE = {
  fileName: 'Atestado médico.pdf',
  viewUrl: '/api/employees/7/medical-certificates/1/file?mode=view',
  downloadUrl: '/api/employees/7/medical-certificates/1/file',
};

describe('AzuosFileLinks', () => {
  // feliz
  it('opens the file in a new tab, without asking the browser to save it', () => {
    render(<AzuosFileLinks data={FILE} />);
    const open = screen.getByRole('link', { name: 'Abrir Atestado médico.pdf' });

    expect(open).toHaveAttribute('href', FILE.viewUrl);
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).not.toHaveAttribute('download');
    expect(open).toHaveTextContent('Abrir');
  });

  // feliz
  it('downloads the file with its original name from the icon beside it', () => {
    render(<AzuosFileLinks data={FILE} />);
    const download = screen.getByRole('link', { name: 'Baixar Atestado médico.pdf' });

    expect(download).toHaveAttribute('href', FILE.downloadUrl);
    expect(download).toHaveAttribute('download', 'Atestado médico.pdf');
  });

  // feliz
  it('shows the given label and icon on the open link', () => {
    const { container } = render(
      <AzuosFileLinks
        data={{ ...FILE, openLabel: 'Atestado médico.pdf' }}
        ui={{ openIcon: Paperclip }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Abrir Atestado médico.pdf' })).toHaveTextContent(
      'Atestado médico.pdf',
    );
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });

  // triste
  /* O endereço assinado não pode viajar como referência para o site que o arquivo abrir. */
  it('does not leak the signed address as referrer on either link', () => {
    render(<AzuosFileLinks data={FILE} />);

    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  });
});
