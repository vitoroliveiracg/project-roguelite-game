import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExperienceTome from '../../../../../domain/ObjectModule/Items/Consumables/ExperienceTome';
import Coin from '../../../../../domain/ObjectModule/Items/Consumables/Coin';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('Consumables - Quest & Currency', () => {
  let target: Player;

  beforeEach(() => {
    // Precisamos de um Player real para testar ganho de XP e Moedas
    target = new Player(1, { x: 0, y: 0 }, new Attributes(8, 1, 10, 10, 10, 10, 0, 10), mockEventManager);
    vi.clearAllMocks();
  });

  it('ExperienceTome deve conceder XP imediato ao jogador', () => {
    const tome = new ExperienceTome();
    expect(tome.category).toBe('quest');
    expect(tome.rarity).toBe('epic');
    
    tome.use(target);
    
    // O jogador estava no level 1 (XP base 0). O tomo dá 500.
    expect(target.attributes.currentXp).toBeGreaterThan(0);
    expect(target.attributes.level).toBeGreaterThan(1);
  });

  it('Coin deve adicionar o valor à carteira do jogador', () => {
    const coin = new Coin(55);
    expect(coin.category).toBe('currency');
    
    coin.use(target);
    expect(target.coins).toBe(55);
  });
});