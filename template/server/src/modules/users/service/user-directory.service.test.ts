import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { toPeople, type UserDirectoryRepository } from '../repository/user-directory.repository';
import { UserDirectoryService } from './user-directory.service';

const ana: RequestUser = { id: 'ana', email: 'ana@empresa.com.br', name: 'Ana', role: 'user' };

function serviceWith(repository: Partial<UserDirectoryRepository>) {
  return new UserDirectoryService(repository as UserDirectoryRepository);
}

describe('UserDirectoryService', () => {
  // feliz
  it('lists the admin-console people by name when support turned the integration on', async () => {
    const service = serviceWith({
      isConnected: () => true,
      findPeople: vi.fn().mockResolvedValue([
        { id: '2', name: 'Bia', email: 'bia@x', avatarUrl: null },
        { id: '1', name: 'Ana', email: 'ana@x', avatarUrl: 'https://foto' },
      ]),
    });

    const list = await service.list(ana);

    expect(list.isConnected).toBe(true);
    expect(list.people.map((person) => person.name)).toEqual(['Ana', 'Bia']);
  });

  it('offers only who is logged in while the integration is off, without calling out', async () => {
    const findPeople = vi.fn();
    const service = serviceWith({ isConnected: () => false, findPeople });

    const list = await service.list(ana);

    expect(list).toEqual({
      people: [{ id: 'ana', name: 'Ana', email: 'ana@empresa.com.br', avatarUrl: null }],
      isConnected: false,
    });
    expect(findPeople).not.toHaveBeenCalled();
  });

  // triste
  it('says it could not read the list, instead of an empty team', async () => {
    const service = serviceWith({
      isConnected: () => true,
      findPeople: vi.fn().mockResolvedValue(null),
    });

    await expect(service.list(ana)).rejects.toThrow(ServiceUnavailableException);
  });
});

describe('toPeople', () => {
  // triste
  it('drops whoever has no id or neither name nor e-mail, and anything that is not text', () => {
    const people = toPeople({
      data: {
        people: [
          { id: '1', name: ' Ana ', email: 'ana@x', presentation: { avatarUrl: 42 } },
          { id: '', name: 'Sem id' },
          { id: '3' },
        ],
      },
    });

    expect(people).toEqual([{ id: '1', name: 'Ana', email: 'ana@x', avatarUrl: null }]);
  });
});
