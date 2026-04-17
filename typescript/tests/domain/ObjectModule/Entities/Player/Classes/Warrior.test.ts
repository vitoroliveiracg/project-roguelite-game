import { describe, it, expect, vi, beforeEach } from 'vitest';
import Warrior from '../../../../../../domain/ObjectModule/Entities/Player/Classes/Warrior';
import DefaultXPTable from '../../../../../../domain/ObjectModule/Entities/DefaultXPTable';
import type Player from '../../../../../../domain/ObjectModule/Entities/Player/Player';
import type { IEventManager } from '../../../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };
const mockPlayer = {} as Player;
const xpTable = new DefaultXPTable();

describe('Warrior Class', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar skills corretamente e recuperar por nível', () => {
    const warrior = new Warrior(xpTable, mockPlayer, mockEventManager);
    expect(warrior.allSkills.length).toBe(2);
    expect(warrior.getSkillForLevel(2)?.id).toBe('w_t1_strike');
    expect(warrior.getSkillForLevel(5)).toBeNull();
  });

  it('deve logar a execução da skill via loadout', () => {
    const warrior = new Warrior(xpTable, mockPlayer, mockEventManager);
    warrior.executeSkill('w_t2_cleave', { x: 0, y: 0 });
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('log', expect.objectContaining({ message: expect.stringContaining('[Guerreiro]') }));
  });
});