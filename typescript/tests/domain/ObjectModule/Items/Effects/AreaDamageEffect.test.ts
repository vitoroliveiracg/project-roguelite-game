import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import AreaDamageEffect from '../../../../../domain/ObjectModule/Items/Effects/AreaDamageEffect';
import Dice from '../../../../../domain/shared/Dice';

class MockEventManager implements IEventManager {
  listeners = new Map();
  on(key: string, cb: Function) { this.listeners.set(key, cb); }
  dispatch(key: string, payload: any) {
    // Intercepta e simula a Spatial Query devolvendo os vizinhos mockados
    if (key === 'requestNeighbors' && typeof payload.callback === 'function') {
      payload.callback(payload.mockNeighbors || []);
    }
  }
}

class MockEntity extends Entity {
  constructor(id: number) {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), new MockEventManager());
  }
  update() {}
  override takeDamage = vi.fn();
}

describe('AreaDamageEffect (Splash Damage)', () => {
  let attacker: MockEntity;
  let target: MockEntity;
  let neighbor: MockEntity;
  let eventManager: MockEventManager;

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5);
    eventManager = new MockEventManager();
    attacker = new MockEntity(1);
    target = new MockEntity(2);
    neighbor = new MockEntity(3);
    vi.clearAllMocks();
  });

  it('deve solicitar vizinhos e aplicar dano mágico em área mitigando fogo amigo', () => {
    const attack = new Attack(attacker, 10, 'magical');
    const effect = new AreaDamageEffect(eventManager, 50, attack);

    // Injeta os vizinhos forçadamente na chamada do dispatch para simular a engine espacial
    vi.spyOn(eventManager, 'dispatch').mockImplementation((key, payload: any) => {
      if (key === 'requestNeighbors') payload.callback([target, neighbor, attacker]);
    });

    effect.apply(target);
    expect(neighbor.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ damageType: 'magical' }));
  });
});