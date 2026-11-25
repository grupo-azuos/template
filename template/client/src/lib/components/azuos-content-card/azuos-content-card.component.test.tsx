import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2, Pencil } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setPeopleDirectory } from '../../utils/people-directory.util';
import { alertCountLabel, AzuosContentCard, metricColumnsOf } from './azuos-content-card.component';

/* O `Avatar` do Radix lê `complete`/`naturalWidth` num `new Image()` próprio; sem o stub, o jsdom
   nunca marca a foto como carregada. */
class InstantLoadImage {
  complete = false;
  naturalWidth = 0;

  addEventListener() {}
  removeEventListener() {}

  set src(_value: string) {
    this.complete = true;
    this.naturalWidth = 1;
  }
}

const DATA = {
  label: 'Abrir Padaria Bom Dia',
  title: 'Padaria Bom Dia',
  code: '12.345.678/0001-90',
  meta: 'Simples Nacional',
  status: { label: 'Ativa', tone: 'green' as const },
  tags: [{ label: 'Matriz' }],
  metrics: [
    { key: 'open', label: 'Abertos', value: '3', tone: 'blue' as const },
    { key: 'late', label: 'Atrasados', value: '0', tone: 'red' as const, isOn: false },
  ],
  footer: {
    title: 'Wellington Queiroz',
    subtitle: 'Responsável',
    person: { id: 'wq', name: 'Wellington Queiroz' },
  },
  openLabel: 'Abrir',
};

describe('AzuosContentCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setPeopleDirectory([]);
  });

  // feliz
  it('shows the record at a glance and opens it with a click anywhere', async () => {
    const onOpen = vi.fn();
    render(
      <AzuosContentCard
        data={DATA}
        ui={{ icon: Building2, iconTone: 'blue' }}
        actions={{ onOpen }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Padaria Bom Dia' })).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Abertos')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir Padaria Bom Dia' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  // feliz
  /* Regra do grupo: a pessoa do rodapé aparece com a FOTO, achada no diretório pelo id. */
  it('shows the photo of the person in the footer, found by the id', async () => {
    vi.stubGlobal('Image', InstantLoadImage);
    setPeopleDirectory([
      { id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://example.com/wq.jpg' },
    ]);

    const { container } = render(<AzuosContentCard data={DATA} />);

    const image = await vi.waitUntil(() => container.querySelector('[data-slot="avatar-image"]'));
    expect(image).toHaveAttribute('src', 'https://example.com/wq.jpg');
  });

  // feliz
  it('tells the screen which menu action was chosen', async () => {
    const onMenuSelect = vi.fn();
    render(
      <AzuosContentCard
        data={{
          ...DATA,
          menu: {
            label: 'Ações da empresa',
            items: [{ id: 'edit', label: 'Editar', icon: Pencil }],
          },
        }}
        actions={{ onMenuSelect }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ações da empresa' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }));

    expect(onMenuSelect).toHaveBeenCalledWith('edit');
  });

  // feliz
  it('shows the pending seal with the count cut at 99', () => {
    render(
      <AzuosContentCard data={{ ...DATA, alert: { count: 120, message: '120 pendências' } }} />,
    );

    expect(screen.getByRole('img', { name: '120 pendências' })).toHaveTextContent('99+');
  });

  // triste
  it('without footer, menu, status or pending, draws only the header', () => {
    const { container } = render(
      <AzuosContentCard
        data={{ label: 'X', title: 'Sem nada', alert: { count: 0, message: '' } }}
      />,
    );

    expect(container.querySelector('[data-slot="content-card-strip"]')).toBeNull();
    expect(container.querySelector('[data-slot="content-card-footer"]')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // triste
  it('keeps the metric grid between one and four columns', () => {
    expect(metricColumnsOf(0)).toBe('grid-cols-1');
    expect(metricColumnsOf(9)).toBe('grid-cols-4');
    expect(alertCountLabel(7)).toBe('7');
  });

  // feliz
  /* O card de painel é o mesmo card: o número grande abaixo do cabeçalho, e clicável vira filtro. */
  it('works as the dashboard card: the big number, the filter and the chosen state', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      <AzuosContentCard
        data={{
          label: 'Abertos 12: filtrar a lista',
          title: 'Abertos',
          highlight: { value: 12, hint: 'exclui 3 arquivados' },
        }}
        ui={{ icon: Building2, iconTone: 'blue' }}
        state={{ isSelected: true }}
        actions={{ onOpen }}
      />,
    );

    expect(container.querySelector('[data-slot="content-card-highlight"]')).toHaveTextContent(
      '12exclui 3 arquivados',
    );
    expect(screen.getByRole('group', { name: 'Abertos 12: filtrar a lista' })).toHaveAttribute(
      'data-selected',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abertos 12: filtrar a lista' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  // feliz
  it('works as the content block: free body and the tools in the corner', () => {
    render(
      <AzuosContentCard
        data={{ label: 'Receitas por mês', title: 'Receitas por mês', meta: 'Os últimos 12 meses' }}
        ui={{ body: <p>gráfico</p>, tools: <button type="button">Semana</button> }}
      />,
    );

    expect(screen.getByText('gráfico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semana' })).toBeInTheDocument();
  });

  // triste
  it('shows the skeleton instead of the number while it loads, and does not open', () => {
    const { container } = render(
      <AzuosContentCard
        data={{ label: 'Abertos', title: 'Abertos', highlight: { value: 12 } }}
        state={{ isLoading: true }}
        actions={{ onOpen: vi.fn() }}
      />,
    );

    expect(container.querySelector('[data-slot="content-card-highlight"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Abertos' })).toBeDisabled();
  });
});
