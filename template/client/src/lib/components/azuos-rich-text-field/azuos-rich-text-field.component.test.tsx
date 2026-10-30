import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosRichTextField } from './azuos-rich-text-field.component';

const data = { label: 'Senha', name: 'password', value: 'senha-secreta' };

describe('AzuosRichTextField', () => {
  it('ties the label to the input', () => {
    render(<AzuosRichTextField data={{ label: 'E-mail', name: 'email', value: '' }} />);

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('reports every keystroke', async () => {
    const onChange = vi.fn();
    render(
      <AzuosRichTextField
        data={{ label: 'E-mail', name: 'email', value: '' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.type(screen.getByLabelText('E-mail'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  /* O erro precisa existir para quem NÃO vê a tela: sem `aria-invalid` e `role="alert"` a
     mensagem está lá e o leitor de tela não a anuncia. */
  it('announces the error to assistive technology', () => {
    render(
      <AzuosRichTextField
        data={data}
        state={{ error: 'A senha precisa ter ao menos 8 caracteres' }}
      />,
    );

    const input = screen.getByLabelText('Senha');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A senha precisa ter ao menos 8 caracteres',
    );
    expect(input).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
  });

  it('does not describe the input by an error that is not there', () => {
    render(<AzuosRichTextField data={data} />);

    expect(screen.getByLabelText('Senha')).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  /* Trocar o `type` é o que mantém o gerenciador de senhas do navegador reconhecendo o
     campo; esconder por CSS quebraria isso em silêncio. */
  it('reveals the password by changing the input type', async () => {
    render(<AzuosRichTextField data={data} ui={{ type: 'password' }} />);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
  });

  it('shows no reveal button on a field that is not a password', () => {
    render(
      <AzuosRichTextField
        data={{ label: 'E-mail', name: 'email', value: '' }}
        ui={{ type: 'email' }}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks a required field with an asterisk and tells assistive technology', () => {
    render(
      <AzuosRichTextField
        data={{ label: 'Nome completo', name: 'name', value: '' }}
        state={{ isRequired: true }}
      />,
    );

    expect(screen.getByLabelText(/Nome completo/)).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the hint and describes the input by it', () => {
    render(
      <AzuosRichTextField
        data={{
          ...data,
          hint: { text: 'Calculado: 45 dias a partir do início.', tone: 'calculated' },
        }}
      />,
    );

    const hint = screen.getByText('Calculado: 45 dias a partir do início.');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-describedby', hint.id);
  });

  /* A lupa é desenho: a lista filtra enquanto se digita, e ela não rouba o clique do campo. */
  it('draws the search icon inside the field, out of the way of the screen reader', () => {
    const { container } = render(
      <AzuosRichTextField
        data={{ label: 'Buscar colaborador', name: 'search', value: '' }}
        ui={{ icon: Search }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.getAttribute('class')).toContain('pointer-events-none');
    expect(screen.getByLabelText('Buscar colaborador')).toHaveClass('pl-9');
  });

  /* O Enter e o clique na lupa são o gesto de "terminei de digitar". */
  it('searches on Enter and on the magnifier click', async () => {
    const onSubmit = vi.fn();
    render(
      <AzuosRichTextField
        data={{ label: 'Buscar colaborador', name: 'search', value: 'ana' }}
        ui={{ icon: Search }}
        actions={{ onChange: vi.fn(), onSubmit }}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText('Buscar colaborador'), { key: 'Enter' });
    await userEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  // triste
  /* Duas mensagens embaixo do mesmo campo competem: a que importa é a do erro. */
  it('hides the hint while there is an error', () => {
    render(
      <AzuosRichTextField
        data={{ ...data, hint: { text: 'Dica que some', tone: 'neutral' } }}
        state={{ error: 'Informe a senha' }}
      />,
    );

    expect(screen.queryByText('Dica que some')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe a senha');
  });
});
