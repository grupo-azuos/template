import {
  Controls,
  Description,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
} from '@storybook/addon-docs/blocks';

import { COMPONENT_DOCS } from './component-docs';

/**
 * A PÁGINA "DOCS" DE TODO COMPONENTE, na mesma ordem em todos:
 *
 * 1. o nome e o texto de escolha (para que serve, quando usar, quando não usar), de
 *    `component-docs.ts`;
 * 2. o exemplo principal e a tabela de props;
 * 3. o comentário técnico do próprio componente (o JSDoc em cima do `export function`);
 * 4. todas as variações.
 */
export function AzuosDocsPage() {
  const meta = useOf('meta', ['meta']);
  const name = meta.preparedMeta.title.split('/').pop() ?? '';
  const doc = COMPONENT_DOCS[name];

  return (
    <>
      <Title />
      <Subtitle />
      {doc ? (
        <section className="azuos-doc-guide">
          <p className="azuos-doc-summary">{doc.summary}</p>
          <div className="azuos-doc-columns">
            <div>
              <h3>Quando usar</h3>
              <ul>
                {doc.use.map((item) => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Quando não usar</h3>
              <ul>
                {doc.avoid.map((item) => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
      <Primary />
      <Controls />
      <h2>Como ele funciona</h2>
      <Description />
      <Stories title="Variações" />
    </>
  );
}

/** Os nomes entre crases viram código, como no resto da documentação. */
function renderInline(text: string) {
  return text
    .split(/(`[^`]+`)/)
    .map((part, index) =>
      part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part,
    );
}
