/**
 * O DIRETÓRIO DE PESSOAS da tela — de onde o rosto (`AzuosPersonAvatar`) tira a FOTO.
 *
 * Regra do grupo: onde aparece uma pessoa, aparece a foto dela. Muitos registros guardam só o
 * nome ("Wellington Queiroz") ou o id sem a foto; sem um lugar para procurar, o rosto caía nas
 * iniciais mesmo com a pessoa tendo foto. Aqui fica a lista de quem usa o sistema (com a foto),
 * carregada UMA vez pela casca (`usePeopleDirectoryModel`), e o rosto procura por id ou, sem id,
 * pelo nome — sem acento, sem diferença de maiúscula.
 *
 * Um estado do módulo, lido por `useSyncExternalStore` (`usePersonPhoto`): o rosto é função pura
 * de props e não pode fazer consulta; a consulta fica no view-model da casca.
 */
export type DirectoryPersonPhoto = { id: string; name: string; avatarUrl?: string | null };

type Directory = { byId: Record<string, string>; byName: Record<string, string> };

let directory: Directory = { byId: {}, byName: {} };
const listeners = new Set<() => void>();

/** O nome comparável: sem acento, sem diferença de maiúscula e com um espaço só. */
export function normalizePersonName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function setPeopleDirectory(people: readonly DirectoryPersonPhoto[]): void {
  const next: Directory = { byId: {}, byName: {} };
  for (const person of people) {
    if (!person.avatarUrl) continue;
    next.byId[person.id] = person.avatarUrl;
    next.byName[normalizePersonName(person.name)] = person.avatarUrl;
  }
  directory = next;
  listeners.forEach((listener) => listener());
}

export function subscribePeopleDirectory(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** A versão atual do diretório: troca inteira a cada carga, e é isso que avisa o React. */
export function peopleDirectorySnapshot(): Directory {
  return directory;
}

/** A foto da pessoa: pelo id, ou pelo nome quando o registro só guardou o nome. */
export function personPhotoOf(person: { id?: string | null; name?: string | null }): string | null {
  const byId = person.id ? directory.byId[person.id] : undefined;
  if (byId) return byId;
  if (!person.name) return null;

  return directory.byName[normalizePersonName(person.name)] ?? null;
}
