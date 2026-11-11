import {
  boardWeight,
  DASHBOARD_SCOPES,
  MAX_BOARD_WEIGHT,
} from '@template/shared/schemas/dashboard-board.schema';
import { describe, expect, it } from 'vitest';

import { defaultBoard } from './default-boards';

describe('defaultBoard', () => {
  // feliz: o painel que nasce pronto cabe na cota — senão a pessoa não conseguiria pôr nada nele.
  it('fits every default board inside the weight quota', () => {
    for (const scope of DASHBOARD_SCOPES) {
      expect(boardWeight(defaultBoard(scope).widgets)).toBeLessThanOrEqual(MAX_BOARD_WEIGHT);
    }
  });

  // triste: o painel padrão não fica vazio — a cota não pode ter sido atingida apagando blocos.
  it('keeps at least one block on every default board', () => {
    for (const scope of DASHBOARD_SCOPES) {
      expect(defaultBoard(scope).widgets.length).toBeGreaterThan(0);
    }
  });
});
