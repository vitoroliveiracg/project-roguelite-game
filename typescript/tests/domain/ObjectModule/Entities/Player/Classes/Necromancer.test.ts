import { describe, it, expect, vi, beforeEach } from 'vitest';
import Necromancer from '../../../../../../domain/ObjectModule/Entities/Player/Classes/Necromancer';
import DefaultXPTable from '../../../../../../domain/ObjectModule/Entities/DefaultXPTable';
import type Player from '../../../../../../domain/ObjectModule/Entities/Player/Player';
import type { IEventManager } from '../../../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };
const mockPlayer = {} as Player;
const xpTable = new DefaultXPTable();

describe('Necromancer Class', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar skills corretamente e logar execução', () => {
    const necro = new Necromancer(xpTable, mockPlayer, mockEventManager);
    expect(necro.allSkills.length).toBe(4);
    expect(necro.getSkillForLevel(2)?.id).toBe('n_t1_reap');
    
    necro.executeSkill('n_t4_corpse_explosion', { x: 0, y: 0 });
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('log', expect.objectContaining({
      message: expect.stringContaining('[Necromante] Habilidade n_t4_corpse_explosion')
    }));
  });
});