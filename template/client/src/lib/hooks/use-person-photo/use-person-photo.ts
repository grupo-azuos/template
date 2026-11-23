import { useSyncExternalStore } from 'react';

import {
  peopleDirectorySnapshot,
  personPhotoOf,
  subscribePeopleDirectory,
} from '../../utils/people-directory.util';

/**
 * A foto da pessoa no diretório (pelo id, ou pelo nome). Quando o diretório chega depois do
 * primeiro desenho, o rosto troca as iniciais pela foto sozinho.
 */
export function usePersonPhoto(person: {
  id?: string | null;
  name?: string | null;
}): string | null {
  useSyncExternalStore(subscribePeopleDirectory, peopleDirectorySnapshot, peopleDirectorySnapshot);

  return personPhotoOf(person);
}
