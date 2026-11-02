import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tasksApi } from './tasks.api';

const fetchMock = vi.fn();

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

  return { url, init };
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('tasksApi', () => {
  // feliz
  /* O que importa aqui é a TRADUÇÃO da intenção em requisição: filtro vazio não vira
     `?search=` na URL, e a página vai como está. */
  it('lists with only the filters that have a value', async () => {
    fetchMock.mockResolvedValue(respond(200, { items: [], total: 0 }));

    await expect(
      tasksApi.list({ page: 2, pageSize: 20, search: '', status: 'done' }),
    ).resolves.toEqual({ items: [], total: 0 });

    expect(lastRequest().url).toBe('/api/tasks?page=2&pageSize=20&status=done');
  });

  it('reads one task by id', async () => {
    fetchMock.mockResolvedValue(respond(200, { id: 7, title: 'Revisar contrato' }));

    await expect(tasksApi.findById(7)).resolves.toMatchObject({ id: 7 });

    expect(lastRequest().url).toBe('/api/tasks/7');
  });

  it('creates with POST and the body as JSON', async () => {
    fetchMock.mockResolvedValue(respond(201, { id: 1, title: 'Nova' }));

    await tasksApi.create({ title: 'Nova', description: null, status: 'todo' });

    const { url, init } = lastRequest();
    expect(url).toBe('/api/tasks');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({ title: 'Nova' });
  });

  it('updates with PATCH on the task url', async () => {
    fetchMock.mockResolvedValue(respond(200, { id: 3, status: 'done' }));

    await tasksApi.update(3, { status: 'done' });

    const { url, init } = lastRequest();
    expect(url).toBe('/api/tasks/3');
    expect(init.method).toBe('PATCH');
  });

  it('removes with DELETE and accepts an empty answer', async () => {
    fetchMock.mockResolvedValue(respond(204));

    await expect(tasksApi.remove(9)).resolves.toBeUndefined();

    const { url, init } = lastRequest();
    expect(url).toBe('/api/tasks/9');
    expect(init.method).toBe('DELETE');
  });

  // triste
  it('propagates the API error instead of hiding it', async () => {
    fetchMock.mockResolvedValue(respond(404, { statusCode: 404, message: 'Tarefa não encontrada.' }));

    await expect(tasksApi.findById(404)).rejects.toThrow('Tarefa não encontrada.');
  });
});
