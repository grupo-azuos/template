import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMaskedField } from './use-masked-field';

function Field({ value, cursor }: { value: string; cursor: number | null }) {
  const { ref, moveCursorTo } = useMaskedField();
  if (cursor !== null) moveCursorTo(cursor);

  return <input ref={ref} aria-label="CNPJ" defaultValue={value} />;
}

describe('useMaskedField', () => {
  // feliz
  it('puts the cursor where the mask asked after the render', () => {
    const { getByLabelText } = render(<Field value="11.222.333" cursor={4} />);
    const field = getByLabelText('CNPJ') as HTMLInputElement;

    expect(field.selectionStart).toBe(4);
    expect(field.selectionEnd).toBe(4);
  });

  // triste
  it('leaves the cursor alone when nothing was asked', () => {
    const { getByLabelText } = render(<Field value="11.222.333" cursor={null} />);
    const field = getByLabelText('CNPJ') as HTMLInputElement;

    field.setSelectionRange(2, 2);

    expect(field.selectionStart).toBe(2);
  });
});
